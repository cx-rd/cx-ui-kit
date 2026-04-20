import { CommonModule } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    ElementRef,
    HostListener,
    OnDestroy,
    booleanAttribute,
    effect,
    forwardRef,
    inject,
    input,
    numberAttribute,
    output,
    viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom, isObservable } from 'rxjs';
import {
    SelectListAsyncLoaderResponse,
    SelectListCompareWith,
    SelectListDataMode,
    SelectListDataSource,
    SelectListOption,
    SelectListSearchChange,
    SelectListSelectionChange,
    SelectListSelectionMode
} from '../../core/models';

interface SelectListOptionGroup<T = unknown> {
    label: string | null;
    options: SelectListOption<T>[];
}

const PANEL_TRANSITION_MS = 180;
const PANEL_RENDER_TICK_MS = 10;

function optionalBooleanAttribute(value: boolean | string | null | undefined): boolean | undefined {
    return value == null ? undefined : booleanAttribute(value);
}

function optionalNumberAttribute(value: number | string | null | undefined): number | null {
    return value == null ? null : numberAttribute(value);
}

@Component({
    selector: 'lib-select-list',
    standalone: true,
    imports: [CommonModule, OverlayModule, ReactiveFormsModule],
    templateUrl: './select-list.component.html',
    styleUrl: './select-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectListComponent),
            multi: true
        }
    ]
})
export class SelectListComponent<T = unknown> implements ControlValueAccessor, OnDestroy {
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);
    private readonly hostElement = inject(ElementRef<HTMLElement>);

    private static nextId = 0;

    private readonly panelElement = viewChild<unknown, ElementRef<HTMLElement>>('panelElement', { read: ElementRef });
    private readonly triggerButton = viewChild<unknown, ElementRef<HTMLButtonElement>>('triggerButton', { read: ElementRef });
    private readonly searchInput = viewChild<unknown, ElementRef<HTMLInputElement>>('searchInput', { read: ElementRef });

    readonly label = input<string>();
    readonly hint = input<string>();
    readonly placeholder = input('Select options');
    readonly searchPlaceholder = input('Search options');
    readonly emptyLabel = input('No options available');
    readonly loadingLabel = input('Loading options...');
    readonly minSearchLabel = input<string>();
    readonly selectionMode = input<SelectListSelectionMode>('single');
    readonly options = input<SelectListOption<T>[]>([]);
    readonly dataSource = input<SelectListDataSource<T> | undefined>();
    readonly searchable = input<boolean | undefined, boolean | string | null | undefined>(undefined, {
        transform: optionalBooleanAttribute
    });
    readonly clearable = input(true, { transform: booleanAttribute });
    readonly closeOnSelect = input<boolean | undefined, boolean | string | null | undefined>(undefined, {
        transform: optionalBooleanAttribute
    });
    readonly showSelectAll = input(false, { transform: booleanAttribute });
    readonly visibleSelectionLimit = input(2, { transform: numberAttribute });
    readonly maxSelections = input<number | null, number | string | null | undefined>(null, {
        transform: optionalNumberAttribute
    });
    readonly required = input(false, { transform: booleanAttribute });
    readonly invalid = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly compareWith = input<SelectListCompareWith<T>>((left, right) => left === right);

    readonly selectionChange = output<SelectListSelectionChange<T>>();
    readonly searchChange = output<SelectListSearchChange>();
    readonly openedChange = output<boolean>();

    readonly triggerId = `tp-select-list-trigger-${SelectListComponent.nextId}`;
    readonly panelId = `tp-select-list-panel-${SelectListComponent.nextId++}`;
    readonly searchControl = new FormControl('', { nonNullable: true });
    readonly overlayPositions: ConnectedPosition[] = [
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 }
    ];

    isPanelOpen = false;
    isPanelRendered = false;
    overlayWidth = 0;
    asyncOptions: SelectListOption<T>[] = [];
    knownOptions: SelectListOption<T>[] = [];
    selectedValues: T[] = [];
    loading = false;
    errorMessage: string | null = null;
    hasMore = false;
    asyncTotal: number | null = null;
    currentPage = 1;

    private controlDisabled = false;
    private lastWrittenValue: T | T[] | null = null;
    private loadTimer?: ReturnType<typeof setTimeout>;
    private panelOpenTimer?: ReturnType<typeof setTimeout>;
    private panelCloseTimer?: ReturnType<typeof setTimeout>;
    private activeRequestId = 0;
    private onChange: (value: unknown) => void = () => undefined;
    private onTouched: () => void = () => undefined;

    constructor() {
        this.searchControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((query) => {
                this.searchChange.emit({ query });

                if (this.isAsyncMode) {
                    this.scheduleAsyncLoad(true);
                }
                this.cdr.markForCheck();
            });

        effect(() => {
            const selectionMode = this.selectionMode();
            this.selectedValues = this.normalizeSelection(this.lastWrittenValue, selectionMode);
            this.cdr.markForCheck();
        });

        effect(() => {
            this.options();
            this.dataSource();

            this.syncKnownOptions(this.staticOptionPool);

            if (!this.isAsyncMode) {
                this.resetAsyncState();
            } else if (this.isPanelOpen) {
                this.scheduleAsyncLoad(true, true);
            }

            this.cdr.markForCheck();
        });

        effect(() => {
            if (this.disabled() && this.isPanelOpen) {
                this.closePanel();
                return;
            }

            this.cdr.markForCheck();
        });

        effect(() => {
            this.searchable();

            if (!this.canShowSearch) {
                this.resetSearch();
            }

            this.cdr.markForCheck();
        });
    }

    get dataMode(): SelectListDataMode {
        return this.dataSource()?.asyncLoader ? 'async' : 'static';
    }

    get isAsyncMode(): boolean {
        return this.dataMode === 'async';
    }

    get isMulti(): boolean {
        return this.selectionMode() === 'multi';
    }

    get isPanelClosing(): boolean {
        return this.isPanelRendered && !this.isPanelOpen && !!this.panelCloseTimer;
    }

    get isDisabled(): boolean {
        return this.disabled() || this.controlDisabled;
    }

    get canShowSearch(): boolean {
        const searchable = this.searchable();

        if (typeof searchable === 'boolean') {
            return searchable;
        }

        return this.isAsyncMode || this.staticOptionPool.length > 7;
    }

    get resolvedCloseOnSelect(): boolean {
        const closeOnSelect = this.closeOnSelect();

        if (typeof closeOnSelect === 'boolean') {
            return closeOnSelect;
        }

        return !this.isMulti;
    }

    get minQueryLength(): number {
        return Math.max(0, this.dataSource()?.minQueryLength ?? 0);
    }

    get visibleOptions(): SelectListOption<T>[] {
        return this.filterOptions(this.optionPool, this.normalizedQuery);
    }

    get optionGroups(): SelectListOptionGroup<T>[] {
        return this.groupOptions(this.visibleOptions);
    }

    get selectedOptions(): SelectListOption<T>[] {
        return this.selectedValues.map((value) => this.resolveOption(value));
    }

    get selectedOption(): SelectListOption<T> | null {
        return this.selectedOptions[0] ?? null;
    }

    get visibleSelectedOptions(): SelectListOption<T>[] {
        return this.selectedOptions.slice(0, Math.max(1, this.visibleSelectionLimit()));
    }

    get hiddenSelectionCount(): number {
        return Math.max(0, this.selectedOptions.length - this.visibleSelectedOptions.length);
    }

    get hasSelection(): boolean {
        return this.selectedValues.length > 0;
    }

    get shouldShowMinQueryHint(): boolean {
        return this.isAsyncMode
            && this.minQueryLength > 0
            && this.normalizedQuery.length < this.minQueryLength
            && this.visibleOptions.length === 0
            && !this.loading
            && !this.errorMessage;
    }

    get resolvedMinQueryLabel(): string {
        return this.minSearchLabel() ?? `Type at least ${this.minQueryLength} characters to search`;
    }

    get selectableVisibleOptions(): SelectListOption<T>[] {
        return this.visibleOptions.filter((option) => !option.disabled);
    }

    get showClearButton(): boolean {
        return this.clearable() && this.hasSelection && !this.isDisabled;
    }

    get allVisibleOptionsSelected(): boolean {
        return this.selectableVisibleOptions.length > 0
            && this.selectableVisibleOptions.every((option) => this.isSelected(option));
    }

    get canLoadMore(): boolean {
        return this.isAsyncMode
            && this.hasMore
            && !this.loading
            && !this.shouldShowMinQueryHint;
    }

    get trackSelectedSummary(): string {
        if (!this.hasSelection) {
            return this.placeholder();
        }

        if (!this.isMulti) {
            return this.selectedOption?.label ?? this.placeholder();
        }

        return `${this.selectedOptions.length} selected`;
    }

    writeValue(value: unknown): void {
        this.lastWrittenValue = value as T | T[] | null;
        this.selectedValues = this.normalizeSelection(value, this.selectionMode());
        this.syncKnownOptions(this.selectedValues.map((item) => this.buildFallbackOption(item)));
        this.cdr.markForCheck();
    }

    registerOnChange(fn: (value: unknown) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.controlDisabled = isDisabled;

        if (isDisabled && this.isPanelOpen) {
            this.closePanel();
        }

        this.cdr.markForCheck();
    }

    ngOnDestroy(): void {
        this.clearLoadTimer();
        this.clearPanelTimers();
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        if (this.isPanelRendered) {
            this.updateOverlayWidth();
        }
    }

    @HostListener('document:mousedown', ['$event'])
    onDocumentMouseDown(event: MouseEvent): void {
        if (!this.isPanelRendered) {
            return;
        }

        const target = event.target as Node | null;

        if (this.hostElement.nativeElement.contains(target)) {
            return;
        }

        if (this.panelElement()?.nativeElement.contains(target)) {
            return;
        }

        this.closePanel();
    }

    togglePanel(): void {
        if (this.isDisabled) {
            return;
        }

        if (this.isPanelRendered && !this.isPanelClosing) {
            this.closePanel();
            return;
        }

        this.openPanel();
    }

    openPanel(): void {
        if (this.isDisabled) {
            return;
        }

        if (this.isPanelRendered && this.isPanelOpen) {
            return;
        }

        this.clearPanelCloseTimer();
        this.updateOverlayWidth();

        if (!this.isPanelRendered) {
            this.isPanelRendered = true;
        }

        this.clearPanelOpenTimer();
        this.panelOpenTimer = setTimeout(() => {
            this.panelOpenTimer = undefined;
            this.updateOverlayWidth();

            this.isPanelOpen = true;
            this.openedChange.emit(true);

            if (this.canShowSearch) {
                setTimeout(() => this.searchInput()?.nativeElement.focus(), PANEL_TRANSITION_MS / 3);
            }

            if (this.isAsyncMode) {
                this.scheduleAsyncLoad(true, true);
            }

            this.cdr.markForCheck();
        }, PANEL_RENDER_TICK_MS);

        this.cdr.markForCheck();
    }

    closePanel(): void {
        if (!this.isPanelRendered) {
            return;
        }

        const wasOpening = !!this.panelOpenTimer;

        this.clearPanelOpenTimer();

        if (!this.isPanelOpen && !wasOpening) {
            return;
        }

        this.isPanelOpen = false;

        if (wasOpening) {
            this.finalizePanelClose();
            return;
        }

        this.openedChange.emit(false);
        this.onTouched();

        this.clearPanelCloseTimer();
        this.panelCloseTimer = setTimeout(() => {
            this.panelCloseTimer = undefined;
            this.finalizePanelClose();
        }, PANEL_TRANSITION_MS);
        this.cdr.markForCheck();
    }

    onOverlayDetach(): void {
        if (this.isPanelRendered) {
            const wasInteracting = this.isPanelOpen || !!this.panelOpenTimer;

            if (wasInteracting) {
                this.openedChange.emit(false);
                this.onTouched();
            }

            this.finalizePanelClose();
        } else {
            this.cdr.markForCheck();
        }
    }

    clearSelection(event: MouseEvent): void {
        event.stopPropagation();
        this.updateSelection([]);
    }

    toggleSelectAll(): void {
        const visibleOptions = this.selectableVisibleOptions;
        const maxSelections = this.maxSelections();

        if (!visibleOptions.length) {
            return;
        }

        if (this.allVisibleOptionsSelected) {
            const nextValues = this.selectedValues.filter(
                (value) => !visibleOptions.some((option) => this.areValuesEqual(option.value, value))
            );

            this.updateSelection(nextValues);
            return;
        }

        const nextValues = [...this.selectedValues];

        for (const option of visibleOptions) {
            if (this.isSelectedValue(nextValues, option.value)) {
                continue;
            }

            if (maxSelections && nextValues.length >= maxSelections) {
                break;
            }

            nextValues.push(option.value);
        }

        this.updateSelection(nextValues);
    }


    async loadMore(): Promise<void> {
        if (!this.canLoadMore) {
            return;
        }

        this.currentPage += 1;
        await this.fetchAsyncOptions(false);
    }

    selectOption(option: SelectListOption<T>): void {
        if (option.disabled || this.isOptionLocked(option)) {
            return;
        }

        this.syncKnownOptions([option]);

        if (!this.isMulti) {
            this.updateSelection([option.value], option);

            if (this.resolvedCloseOnSelect) {
                this.closePanel();
            }

            return;
        }

        const nextValues = this.isSelected(option)
            ? this.selectedValues.filter((value) => !this.areValuesEqual(value, option.value))
            : [...this.selectedValues, option.value];

        this.updateSelection(nextValues, option);

        if (this.resolvedCloseOnSelect) {
            this.closePanel();
        }
    }

    isSelected(option: SelectListOption<T>): boolean {
        return this.isSelectedValue(this.selectedValues, option.value);
    }

    isOptionLocked(option: SelectListOption<T>): boolean {
        const maxSelections = this.maxSelections();

        return !!maxSelections
            && !this.isSelected(option)
            && this.selectedValues.length >= maxSelections;
    }

    private get normalizedQuery(): string {
        return this.searchControl.value.trim();
    }

    private get staticOptionPool(): SelectListOption<T>[] {
        return this.mergeOptionCollections(this.options(), this.dataSource()?.options ?? []);
    }

    private get optionPool(): SelectListOption<T>[] {
        return this.isAsyncMode
            ? this.mergeOptionCollections(this.staticOptionPool, this.asyncOptions)
            : this.staticOptionPool;
    }

    private updateSelection(nextValues: T[], option?: SelectListOption<T>): void {
        const selectionMode = this.selectionMode();
        const normalizedValues = this.normalizeSelection(nextValues, selectionMode);
        const resolvedOptions = normalizedValues.map((value) => this.resolveOption(value));
        const selectedOption = option ?? resolvedOptions[0] ?? null;
        const emittedValue = this.isMulti
            ? [...normalizedValues]
            : (normalizedValues[0] ?? null);

        this.selectedValues = normalizedValues;
        this.lastWrittenValue = emittedValue;
        this.syncKnownOptions(resolvedOptions);
        this.onChange(emittedValue);
        this.selectionChange.emit({
            mode: selectionMode,
            value: emittedValue,
            values: [...normalizedValues],
            option: this.isMulti ? selectedOption : (resolvedOptions[0] ?? null),
            options: resolvedOptions
        });
        this.onTouched();
        this.cdr.markForCheck();
    }

    private normalizeSelection(value: unknown, mode: SelectListSelectionMode): T[] {
        if (mode === 'multi') {
            if (Array.isArray(value)) {
                return [...value] as T[];
            }

            return value == null ? [] : [value as T];
        }

        if (Array.isArray(value)) {
            return value.length ? [value[0] as T] : [];
        }

        return value == null ? [] : [value as T];
    }

    private resolveOption(value: T): SelectListOption<T> {
        const option = this.knownOptions.find((item) => this.areValuesEqual(item.value, value));

        return option ?? this.buildFallbackOption(value);
    }

    private buildFallbackOption(value: T): SelectListOption<T> {
        return {
            value,
            label: this.stringifyValue(value)
        };
    }

    private stringifyValue(value: T): string {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        if (
            value
            && typeof value === 'object'
            && 'label' in value
            && typeof (value as { label?: unknown }).label === 'string'
        ) {
            return (value as { label: string }).label;
        }

        return 'Selected item';
    }

    private filterOptions(options: SelectListOption<T>[], query: string): SelectListOption<T>[] {
        if (!query) {
            return options;
        }

        const loweredQuery = query.toLowerCase();

        return options.filter((option) => {
            const content = [
                option.label,
                option.caption,
                option.group,
                ...(option.keywords ?? [])
            ]
                .filter((item): item is string => !!item)
                .join(' ')
                .toLowerCase();

            return content.includes(loweredQuery);
        });
    }

    private groupOptions(options: SelectListOption<T>[]): SelectListOptionGroup<T>[] {
        const groups: SelectListOptionGroup<T>[] = [];
        const groupLookup = new Map<string, SelectListOptionGroup<T>>();

        for (const option of options) {
            const groupKey = option.group ?? '';

            if (!groupLookup.has(groupKey)) {
                const nextGroup: SelectListOptionGroup<T> = {
                    label: option.group ?? null,
                    options: []
                };

                groupLookup.set(groupKey, nextGroup);
                groups.push(nextGroup);
            }

            groupLookup.get(groupKey)?.options.push(option);
        }

        return groups;
    }

    private scheduleAsyncLoad(resetPage: boolean, immediate = false): void {
        if (!this.isAsyncMode || !this.isPanelOpen) {
            return;
        }

        this.clearLoadTimer();

        if (resetPage) {
            this.currentPage = 1;
        }

        const delay = immediate ? 0 : (this.dataSource()?.debounceMs ?? 250);
        this.loadTimer = setTimeout(() => {
            void this.fetchAsyncOptions(resetPage);
        }, delay);
    }

    private async fetchAsyncOptions(resetPage: boolean): Promise<void> {
        const loader = this.dataSource()?.asyncLoader;

        if (!loader) {
            return;
        }

        if (this.normalizedQuery.length < this.minQueryLength) {
            this.resetAsyncState();
            this.cdr.markForCheck();
            return;
        }

        const requestId = ++this.activeRequestId;
        const requestedPage = resetPage ? 1 : this.currentPage;

        this.loading = true;
        this.errorMessage = null;
        this.cdr.markForCheck();

        try {
            const response = await this.resolveAsyncResponse(
                loader({
                    query: this.normalizedQuery,
                    page: requestedPage,
                    selectedOptions: this.selectedOptions
                })
            );

            if (requestId !== this.activeRequestId) {
                return;
            }

            const normalized = this.normalizeAsyncResponse(response);

            this.asyncOptions = resetPage
                ? normalized.options
                : this.mergeOptionCollections(this.asyncOptions, normalized.options);
            this.syncKnownOptions(normalized.options);
            this.hasMore = normalized.hasMore ?? false;
            this.asyncTotal = normalized.total ?? null;
            this.errorMessage = null;
        } catch (error) {
            if (requestId !== this.activeRequestId) {
                return;
            }

            this.errorMessage = error instanceof Error
                ? error.message
                : 'Unable to load options.';

            if (resetPage) {
                this.asyncOptions = [];
                this.hasMore = false;
                this.asyncTotal = null;
            }
        } finally {
            if (requestId === this.activeRequestId) {
                this.loading = false;
                this.cdr.markForCheck();
            }
        }
    }

    private async resolveAsyncResponse(
        response: ReturnType<NonNullable<SelectListDataSource<T>['asyncLoader']>>
    ): Promise<SelectListAsyncLoaderResponse<T>> {
        if (isObservable(response)) {
            return firstValueFrom(response);
        }

        return Promise.resolve(response);
    }

    private normalizeAsyncResponse(response: SelectListAsyncLoaderResponse<T>) {
        if (Array.isArray(response)) {
            return { options: response, hasMore: false, total: response.length };
        }

        return {
            options: response.options ?? [],
            hasMore: response.hasMore ?? false,
            total: response.total
        };
    }

    private syncKnownOptions(options: SelectListOption<T>[]): void {
        this.knownOptions = this.mergeOptionCollections(this.knownOptions, options);
    }

    private mergeOptionCollections(...collections: SelectListOption<T>[][]): SelectListOption<T>[] {
        const merged: SelectListOption<T>[] = [];

        for (const collection of collections) {
            for (const option of collection ?? []) {
                const existingIndex = merged.findIndex((item) => this.areOptionsEqual(item, option));

                if (existingIndex === -1) {
                    merged.push(option);
                    continue;
                }

                merged[existingIndex] = { ...merged[existingIndex], ...option };
            }
        }

        return merged;
    }

    private areOptionsEqual(left: SelectListOption<T>, right: SelectListOption<T>): boolean {
        if (left.id && right.id) {
            return left.id === right.id;
        }

        return this.areValuesEqual(left.value, right.value);
    }

    private areValuesEqual(left: T | null | undefined, right: T | null | undefined): boolean {
        return this.compareWith()(left, right);
    }

    private isSelectedValue(source: T[], value: T): boolean {
        return source.some((item) => this.areValuesEqual(item, value));
    }

    private updateOverlayWidth(): void {
        const width = this.triggerButton()?.nativeElement.getBoundingClientRect().width
            ?? this.hostElement.nativeElement.getBoundingClientRect().width;

        this.overlayWidth = width ? Math.round(width) : 0;
    }

    private finalizePanelClose(): void {
        this.clearPanelCloseTimer();

        if (!this.isPanelRendered) {
            return;
        }

        this.isPanelOpen = false;
        this.isPanelRendered = false;
        this.resetSearch();
        this.cdr.markForCheck();
    }

    private resetAsyncState(resetOptions = true): void {
        this.clearLoadTimer();
        this.activeRequestId += 1;
        this.loading = false;
        this.errorMessage = null;
        this.hasMore = false;
        this.asyncTotal = null;
        this.currentPage = 1;

        if (resetOptions) {
            this.asyncOptions = [];
        }
    }

    private resetSearch(): void {
        if (this.isAsyncMode) {
            this.resetAsyncState();
        }

        if (!this.searchControl.value) {
            return;
        }

        this.searchControl.setValue('', { emitEvent: false });
    }

    private clearLoadTimer(): void {
        if (this.loadTimer) {
            clearTimeout(this.loadTimer);
            this.loadTimer = undefined;
        }
    }

    private clearPanelOpenTimer(): void {
        if (this.panelOpenTimer) {
            clearTimeout(this.panelOpenTimer);
            this.panelOpenTimer = undefined;
        }
    }

    private clearPanelCloseTimer(): void {
        if (this.panelCloseTimer) {
            clearTimeout(this.panelCloseTimer);
            this.panelCloseTimer = undefined;
        }
    }

    private clearPanelTimers(): void {
        this.clearPanelOpenTimer();
        this.clearPanelCloseTimer();
    }
}

