import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    booleanAttribute,
    effect,
    inject,
    input,
    numberAttribute,
    output
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
    DataTableCellContext,
    DataTableColumn,
    DataTablePageChange,
    DataTablePaginationMode,
    DataTableRowId,
    DataTableRowSelectable,
    DataTableSelectionChange,
    DataTableSelectionMode,
    DataTableSortableValue,
    DataTableSortMode,
    DataTableSortState,
    DataTableTrackBy,
    SelectListOption,
    SelectListSelectionChange
} from '../../core/models';
import { PaginatorComponent } from '../paginator';
import { SelectListComponent } from '../select-list';

function optionalNumberAttribute(value: number | string | null | undefined): number | null {
    return value == null ? null : numberAttribute(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

@Component({
    selector: 'lib-data-table',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, PaginatorComponent, SelectListComponent],
    templateUrl: './data-table.component.html',
    styleUrl: './data-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T = unknown> {
    private readonly cdr = inject(ChangeDetectorRef);

    readonly ariaLabel = input('Data table');
    readonly caption = input<string>();
    readonly columns = input<ReadonlyArray<DataTableColumn<T>>>([]);
    readonly items = input<ReadonlyArray<T>>([]);
    readonly rowId = input<DataTableTrackBy<T> | undefined>();
    readonly selectionMode = input<DataTableSelectionMode>('none');
    readonly selectedRowIds = input<ReadonlyArray<DataTableRowId>>([]);
    readonly isRowSelectable = input<DataTableRowSelectable<T> | undefined>();
    readonly stickyHeader = input(false, { transform: booleanAttribute });
    readonly dense = input(false, { transform: booleanAttribute });
    readonly loading = input(false, { transform: booleanAttribute });
    readonly loadingLabel = input('Loading data...');
    readonly emptyStateLabel = input('No data available');
    readonly showPageSizeSelector = input(true, { transform: booleanAttribute });
    readonly showRangeSummary = input(true, { transform: booleanAttribute });
    readonly pageSizeLabel = input('Rows per page');
    readonly itemsLabel = input('items');
    readonly sortMode = input<DataTableSortMode>('client');
    readonly sortState = input<DataTableSortState | null>(null);
    readonly paginationMode = input<DataTablePaginationMode>('client');
    readonly totalItems = input<number | null, number | string | null | undefined>(null, {
        transform: optionalNumberAttribute
    });
    readonly pageIndex = input(0, { transform: numberAttribute });
    readonly pageSize = input(10, { transform: numberAttribute });
    readonly pageSizeOptions = input<ReadonlyArray<number>>([10, 20, 50, 100]);
    readonly paginatorMaxVisiblePages = input(5, { transform: numberAttribute });
    readonly paginatorBoundaryButtons = input(true, { transform: booleanAttribute });

    readonly selectionChange = output<DataTableSelectionChange<T>>();
    readonly selectedRowIdsChange = output<DataTableRowId[]>();
    readonly sortChange = output<DataTableSortState | null>();
    readonly pageChange = output<DataTablePageChange>();

    readonly pageSizeControl = new FormControl<number | null>(null);

    // 這份 options 會提供給 footer 的 SelectList，維持穩定引用可避免不必要的重算與重渲染。
    pageSizeSelectOptions: SelectListOption<number>[] = [];
    currentPageIndex = 0;
    currentPageSize = 10;
    currentSortState: DataTableSortState | null = null;
    currentSelectedRowIds: DataTableRowId[] = [];

    // 跨頁或手動分頁時，已選資料列不一定都還在目前 items 內，這裡用來暫存已知 row 實體。
    private readonly selectedRowLookup = new Map<DataTableRowId, T>();

    constructor() {
        // 這幾個 effect 的目的都是把 input 正規化後同步到內部狀態，讓 template 與事件輸出只面對單一資料來源。
        effect(() => {
            this.currentPageIndex = this.normalizePageIndex(this.pageIndex());
            this.ensureValidPageIndex();
            this.cdr.markForCheck();
        });

        effect(() => {
            this.currentPageSize = this.normalizePageSize(this.pageSize());
            this.rebuildPageSizeSelectOptions();
            this.syncPageSizeControl();
            this.ensureValidPageIndex();
            this.cdr.markForCheck();
        });

        effect(() => {
            this.currentSortState = this.normalizeSortState(this.sortState());
            this.cdr.markForCheck();
        });

        effect(() => {
            const selectionMode = this.selectionMode();
            const selectedKeys = this.selectedRowIds();

            this.currentSelectedRowIds = this.normalizeSelectionKeys(selectedKeys, selectionMode);
            this.syncSelectedRowLookup(this.items());
            this.cdr.markForCheck();
        });

        effect(() => {
            this.columns();
            this.items();
            this.rowId();
            this.isRowSelectable();
            this.totalItems();
            this.sortMode();
            this.paginationMode();
            this.pageSizeOptions();
            this.rebuildPageSizeSelectOptions();
            this.syncPageSizeControl();
            this.ensureValidPageIndex();
            this.syncSelectedRowLookup(this.items());
            this.cdr.markForCheck();
        });
    }

    get displayedColumnCount(): number {
        return this.columns().length + (this.selectionMode() === 'none' ? 0 : 1);
    }

    get resolvedPageSize(): number {
        return Math.max(1, this.currentPageSize);
    }

    get resolvedPageIndex(): number {
        return this.clampPageIndex(this.currentPageIndex);
    }

    get totalCount(): number {
        const itemCount = this.items().length;

        if (this.paginationMode() === 'manual') {
            return Math.max(itemCount, this.totalItems() ?? itemCount);
        }

        return itemCount;
    }

    get pageCount(): number {
        return Math.max(1, Math.ceil(this.totalCount / this.resolvedPageSize));
    }

    get visibleRowOffset(): number {
        return this.resolvedPageIndex * this.resolvedPageSize;
    }

    get processedRows(): T[] {
        // 排序時先保留原始 index，避免 accessor / row key 需要索引時失去對應關係。
        const rows = this.items().map((row, index) => ({ row, index }));

        if (this.sortMode() !== 'client' || !this.currentSortState) {
            return rows.map((entry) => entry.row);
        }

        const column = this.columns().find((item) => item.id === this.currentSortState?.columnId);

        if (!column || !column.sortable) {
            return rows.map((entry) => entry.row);
        }

        const direction = this.currentSortState.direction === 'desc' ? -1 : 1;

        return rows.sort((left, right) => {
            const leftValue = this.resolveSortValue(left.row, column, left.index);
            const rightValue = this.resolveSortValue(right.row, column, right.index);

            return this.compareSortValues(leftValue, rightValue) * direction;
        }).map((entry) => entry.row);
    }

    get visibleRows(): T[] {
        // manual 模式代表資料已由外部切好頁，client 模式才在元件內自行 slice。
        if (this.paginationMode() === 'manual') {
            return this.processedRows;
        }

        const start = this.visibleRowOffset;

        return this.processedRows.slice(start, start + this.resolvedPageSize);
    }

    get pageChangeState(): DataTablePageChange {
        return this.buildPageChange(this.resolvedPageIndex, this.resolvedPageSize);
    }

    get rangeSummary(): string {
        if (this.totalCount === 0) {
            return `0 ${this.itemsLabel()}`;
        }

        const { startIndex, endIndex, totalItems } = this.pageChangeState;

        return `${startIndex}-${endIndex} of ${totalItems} ${this.itemsLabel()}`;
    }

    get selectedCountSummary(): string | null {
        if (this.selectionMode() === 'none' || this.currentSelectedRowIds.length === 0) {
            return null;
        }

        return `${this.currentSelectedRowIds.length} selected`;
    }

    get visibleSelectableRows(): Array<{ row: T; rowIndex: number; rowKey: DataTableRowId }> {
        return this.visibleRows
            .map((row, index) => {
                const rowIndex = this.visibleRowOffset + index;

                return {
                    row,
                    rowIndex,
                    rowKey: this.resolveRowKey(row, rowIndex)
                };
            })
            .filter(({ row, rowIndex }) => this.canSelectRow(row, rowIndex));
    }

    get allVisibleRowsSelected(): boolean {
        return this.selectionMode() === 'multiple'
            && this.visibleSelectableRows.length > 0
            && this.visibleSelectableRows.every(({ rowKey }) => this.currentSelectedRowIds.includes(rowKey));
    }

    get visibleSelectionIndeterminate(): boolean {
        if (this.selectionMode() === 'none' || this.allVisibleRowsSelected) {
            return false;
        }

        return this.visibleSelectableRows.some(({ rowKey }) => this.currentSelectedRowIds.includes(rowKey));
    }

    trackColumn(_index: number, column: DataTableColumn<T>): string {
        return column.id;
    }

    trackRow(row: T, rowIndex: number): DataTableRowId {
        return this.resolveRowKey(row, rowIndex);
    }

    isColumnSorted(column: DataTableColumn<T>, direction?: 'asc' | 'desc'): boolean {
        if (!this.currentSortState || this.currentSortState.columnId !== column.id) {
            return false;
        }

        return direction ? this.currentSortState.direction === direction : true;
    }

    getColumnHeaderSort(column: DataTableColumn<T>): DataTableSortState | null {
        return this.currentSortState?.columnId === column.id ? this.currentSortState : null;
    }

    toggleSort(column: DataTableColumn<T>): void {
        if (!column.sortable) {
            return;
        }

        const nextSortState = this.getNextSortState(column.id);

        this.currentSortState = nextSortState;

        // client 端排序會改變資料順序，切回第一頁比較符合使用者預期。
        if (this.paginationMode() === 'client') {
            this.currentPageIndex = 0;
        }

        this.sortChange.emit(nextSortState);
        this.cdr.markForCheck();
    }

    isRowSelected(row: T, rowIndex: number): boolean {
        return this.currentSelectedRowIds.includes(this.resolveRowKey(row, rowIndex));
    }

    canSelectRow(row: T, rowIndex: number): boolean {
        const selectionMode = this.selectionMode();

        if (selectionMode === 'none') {
            return false;
        }

        return this.isRowSelectable()?.(row, rowIndex) ?? true;
    }

    toggleRowSelection(row: T, rowIndex: number): void {
        const selectionMode = this.selectionMode();

        if (!this.canSelectRow(row, rowIndex)) {
            return;
        }

        const rowKey = this.resolveRowKey(row, rowIndex);

        if (selectionMode === 'single') {
            const nextKeys = this.currentSelectedRowIds.includes(rowKey) ? [] : [rowKey];

            this.updateSelection(nextKeys, [{ rowKey, row }]);
            return;
        }

        const nextKeys = this.currentSelectedRowIds.includes(rowKey)
            ? this.currentSelectedRowIds.filter((key) => key !== rowKey)
            : [...this.currentSelectedRowIds, rowKey];

        this.updateSelection(nextKeys, [{ rowKey, row }]);
    }

    toggleSelectAllVisibleRows(): void {
        if (this.selectionMode() !== 'multiple' || !this.visibleSelectableRows.length) {
            return;
        }

        const visibleKeys = this.visibleSelectableRows.map(({ rowKey }) => rowKey);

        if (this.allVisibleRowsSelected) {
            const nextKeys = this.currentSelectedRowIds.filter((key) => !visibleKeys.includes(key));

            this.updateSelection(nextKeys);
            return;
        }

        const nextKeys = [...this.currentSelectedRowIds];

        for (const { rowKey, row } of this.visibleSelectableRows) {
            if (!nextKeys.includes(rowKey)) {
                nextKeys.push(rowKey);
                this.selectedRowLookup.set(rowKey, row);
            }
        }

        this.updateSelection(nextKeys);
    }

    onPageSizeSelectionChange(event: SelectListSelectionChange<number>): void {
        if (typeof event.value !== 'number') {
            return;
        }

        const nextPageSize = this.normalizePageSize(event.value);

        if (nextPageSize === this.resolvedPageSize) {
            return;
        }

        this.applyPageChange(0, nextPageSize);
    }

    onPaginatorChange(change: DataTablePageChange): void {
        this.applyPageChange(change.pageIndex, change.pageSize);
    }

    resolveCellValue(row: T, column: DataTableColumn<T>, rowIndex: number): unknown {
        return this.resolveAccessorValue(row, rowIndex, column.accessor ?? column.id);
    }

    formatCellValue(row: T, column: DataTableColumn<T>, rowIndex: number): string {
        const value = this.resolveCellValue(row, column, rowIndex);

        if (column.valueFormatter) {
            return column.valueFormatter(value, row, column);
        }

        if (value == null) {
            return '-';
        }

        return value instanceof Date ? value.toLocaleString() : String(value);
    }

    buildCellContext(row: T, column: DataTableColumn<T>, rowIndex: number): DataTableCellContext<T> {
        const value = this.resolveCellValue(row, column, rowIndex);

        return {
            $implicit: row,
            row,
            column,
            value,
            rowIndex,
            rowKey: this.resolveRowKey(row, rowIndex)
        };
    }

    resolveCellClass(column: DataTableColumn<T>, row: T, rowIndex: number): string | null {
        if (typeof column.cellClass === 'function') {
            return column.cellClass(row, rowIndex) ?? null;
        }

        return column.cellClass ?? null;
    }

    private updateSelection(
        keys: ReadonlyArray<DataTableRowId>,
        cacheEntries: Array<{ rowKey: DataTableRowId; row: T }> = []
    ): void {
        const selectionMode = this.selectionMode();

        if (selectionMode === 'none') {
            return;
        }

        const nextKeys = this.normalizeSelectionKeys(keys, selectionMode);

        // 先把這次互動碰到的 row 填回快取，避免外部只拿到 key 卻找不到對應 row。
        for (const { rowKey, row } of cacheEntries) {
            this.selectedRowLookup.set(rowKey, row);
        }

        // 已被取消選取的資料列要同步從快取移除，避免 selectionChange 帶出過期資料。
        for (const key of Array.from(this.selectedRowLookup.keys())) {
            if (!nextKeys.includes(key)) {
                this.selectedRowLookup.delete(key);
            }
        }

        this.currentSelectedRowIds = nextKeys;
        this.selectedRowIdsChange.emit([...nextKeys]);
        this.selectionChange.emit({
            mode: selectionMode,
            keys: [...nextKeys],
            rows: this.resolveSelectedRows(nextKeys),
            allVisibleSelected: this.allVisibleRowsSelected,
            indeterminate: this.visibleSelectionIndeterminate
        });
        this.cdr.markForCheck();
    }

    private applyPageChange(pageIndex: number, pageSize: number): void {
        this.currentPageSize = this.normalizePageSize(pageSize);
        this.currentPageIndex = this.clampPageIndex(pageIndex);

        // pageChange payload 統一由這裡產生，避免 paginator / page-size selector 各自算一份。
        const change = this.buildPageChange(this.currentPageIndex, this.currentPageSize);

        this.pageChange.emit(change);
        this.cdr.markForCheck();
    }

    private buildPageChange(pageIndex: number, pageSize: number): DataTablePageChange {
        const totalItems = this.totalCount;
        const pageCount = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
        const clampedPageIndex = Math.min(Math.max(0, pageIndex), pageCount - 1);
        const startIndex = totalItems === 0 ? 0 : clampedPageIndex * pageSize + 1;
        const endIndex = totalItems === 0 ? 0 : Math.min(totalItems, (clampedPageIndex + 1) * pageSize);

        return {
            pageIndex: clampedPageIndex,
            pageSize,
            totalItems,
            pageCount,
            startIndex,
            endIndex
        };
    }

    private ensureValidPageIndex(): void {
        this.currentPageIndex = this.clampPageIndex(this.currentPageIndex);
    }

    private syncPageSizeControl(): void {
        if (this.pageSizeControl.value === this.currentPageSize) {
            return;
        }

        this.pageSizeControl.setValue(this.currentPageSize, { emitEvent: false });
    }

    private rebuildPageSizeSelectOptions(): void {
        const options = new Set<number>(
            this.pageSizeOptions()
                .map((value) => Math.max(1, Number(value)))
                .filter((value) => Number.isFinite(value))
        );

        // 即使目前 page size 不在預設清單中，也要保留在 selector 內，避免 UI 顯示失配。
        options.add(this.resolvedPageSize);

        this.pageSizeSelectOptions = Array.from(options)
            .sort((left, right) => left - right)
            .map((value) => ({
                value,
                label: String(value)
            }));
    }

    private clampPageIndex(pageIndex: number): number {
        return Math.min(Math.max(0, pageIndex), this.pageCount - 1);
    }

    private normalizePageIndex(pageIndex: number): number {
        return Number.isFinite(pageIndex) ? Math.max(0, pageIndex) : 0;
    }

    private normalizePageSize(pageSize: number): number {
        return Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;
    }

    private normalizeSortState(sortState: DataTableSortState | null): DataTableSortState | null {
        if (!sortState) {
            return null;
        }

        return {
            columnId: sortState.columnId,
            direction: sortState.direction === 'desc' ? 'desc' : 'asc'
        };
    }

    private normalizeSelectionKeys(
        keys: ReadonlyArray<DataTableRowId>,
        selectionMode: DataTableSelectionMode
    ): DataTableRowId[] {
        if (selectionMode === 'none') {
            return [];
        }

        const uniqueKeys = Array.from(new Set(keys));

        if (selectionMode === 'single') {
            return uniqueKeys.slice(0, 1);
        }

        return uniqueKeys;
    }

    private resolveSelectedRows(keys: ReadonlyArray<DataTableRowId>): T[] {
        return keys
            .map((key) => this.selectedRowLookup.get(key))
            .filter((row): row is T => row !== undefined);
    }

    private syncSelectedRowLookup(rows: ReadonlyArray<T>): void {
        const selectedKeys = new Set(this.currentSelectedRowIds);
        const baseIndex = this.paginationMode() === 'manual' ? this.visibleRowOffset : 0;

        for (const key of Array.from(this.selectedRowLookup.keys())) {
            if (!selectedKeys.has(key)) {
                this.selectedRowLookup.delete(key);
            }
        }

        rows.forEach((row, index) => {
            const rowKey = this.resolveRowKey(row, baseIndex + index);

            if (selectedKeys.has(rowKey)) {
                this.selectedRowLookup.set(rowKey, row);
            }
        });
    }

    private getNextSortState(columnId: string): DataTableSortState | null {
        if (!this.currentSortState || this.currentSortState.columnId !== columnId) {
            return { columnId, direction: 'asc' };
        }

        if (this.currentSortState.direction === 'asc') {
            return { columnId, direction: 'desc' };
        }

        return null;
    }

    private resolveSortValue(row: T, column: DataTableColumn<T>, rowIndex: number): DataTableSortableValue {
        const value = this.resolveAccessorValue(row, rowIndex, column.sortAccessor ?? column.accessor ?? column.id);

        if (
            typeof value === 'string'
            || typeof value === 'number'
            || typeof value === 'boolean'
            || value instanceof Date
            || value == null
        ) {
            return value;
        }

        return String(value);
    }

    private resolveAccessorValue<TValue>(
        row: T,
        rowIndex: number,
        accessor: string | keyof T | ((item: T, index: number) => TValue)
    ): TValue | undefined {
        // accessor 同時支援函式、單層 key 與 a.b.c 形式的路徑字串。
        if (typeof accessor === 'function') {
            return accessor(row, rowIndex);
        }

        const path = String(accessor);

        if (!path.includes('.')) {
            return isRecord(row) ? (row[path] as TValue | undefined) : undefined;
        }

        const segments = path.split('.');
        let current: unknown = row;

        for (const segment of segments) {
            if (!isRecord(current)) {
                return undefined;
            }

            current = current[segment];
        }

        return current as TValue | undefined;
    }

    private resolveRowKey(row: T, rowIndex: number): DataTableRowId {
        // row key 的優先順序：自訂 trackBy -> 指定 rowId 欄位 -> row.id -> fallback index。
        const configuredRowId = this.rowId();

        if (typeof configuredRowId === 'function') {
            return configuredRowId(row, rowIndex);
        }

        if (configuredRowId) {
            const resolved = this.resolveAccessorValue<DataTableRowId>(row, rowIndex, configuredRowId);

            if (typeof resolved === 'string' || typeof resolved === 'number') {
                return resolved;
            }
        }

        if (isRecord(row)) {
            const id = row['id'];

            if (typeof id === 'string' || typeof id === 'number') {
                return id;
            }
        }

        return rowIndex;
    }

    private compareSortValues(left: DataTableSortableValue, right: DataTableSortableValue): number {
        if (left == null && right == null) {
            return 0;
        }

        if (left == null) {
            return 1;
        }

        if (right == null) {
            return -1;
        }

        const normalizedLeft = left instanceof Date ? left.getTime() : (typeof left === 'boolean' ? Number(left) : left);
        const normalizedRight = right instanceof Date ? right.getTime() : (typeof right === 'boolean' ? Number(right) : right);

        if (typeof normalizedLeft === 'number' && typeof normalizedRight === 'number') {
            return normalizedLeft - normalizedRight;
        }

        return String(normalizedLeft).localeCompare(String(normalizedRight), undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    }
}
