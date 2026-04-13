import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    DestroyRef,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    Output,
    effect,
    inject,
    signal
} from '@angular/core';
import { ToastPosition } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { ToastComponent } from './toast.component';

@Component({
    selector: 'lib-toast-viewport',
    standalone: true,
    imports: [CommonModule, ToastComponent],
    templateUrl: './toast-viewport.component.html',
    styleUrl: './toast-viewport.component.scss'
})
export class ToastViewportComponent implements AfterViewInit {
    @Input() position?: ToastPosition;
    @Input() pauseOnHover = true;

    @Output() actionClick = new EventEmitter<{ id: string; actionId: string }>();

    readonly toastService = inject(ToastService);
    readonly positionClasses = POSITION_CLASS_MAP;
    private readonly expandedStacks = signal<ReadonlySet<ToastPosition>>(new Set<ToastPosition>());
    private readonly hostElement = inject(ElementRef) as ElementRef<HTMLElement>;
    private readonly ngZone = inject(NgZone);
    private readonly destroyRef = inject(DestroyRef);
    private readonly collapseFrames = new Map<ToastPosition, number>();
    private resizeObserver?: ResizeObserver;
    private measureFrame?: number;
    private isViewReady = false;
    private readonly toastWatcher = effect(() => {
        this.toastService.toasts();
        this.scheduleMeasure();
    });

    /** Groups active toasts by position so each viewport corner renders its own stack. */
    get groups(): Array<[ToastPosition, ReturnType<typeof this.toastService.toasts>]> {
        const grouped = new Map<ToastPosition, ReturnType<typeof this.toastService.toasts>>();

        for (const toast of this.toastService.toasts()) {
            if (this.position && toast.position !== this.position) {
                continue;
            }

            const current = grouped.get(toast.position) ?? [];
            grouped.set(toast.position, [...current, toast]);
        }

        return Array.from(grouped.entries());
    }

    /** Keeps only the latest three toasts visible in each stack. */
    getStackedToasts(toasts: ReturnType<typeof this.toastService.toasts>): ReturnType<typeof this.toastService.toasts> {
        return [...toasts].reverse().slice(0, 3);
    }

    /** Keeps each stack container stable across change detection by tracking its position key. */
    trackGroupPosition(_index: number, group: [ToastPosition, ReturnType<typeof this.toastService.toasts>]): ToastPosition {
        return group[0];
    }

    /** Keeps each toast DOM node stable so hover does not retrigger from list re-creation. */
    trackToastId(_index: number, toast: ReturnType<typeof this.toastService.toasts>[number]): string {
        return toast.id;
    }

    /** Removes a toast from the service and viewport. */
    dismiss(id: string): void {
        this.toastService.dismiss(id);
    }

    /** Returns whether the stack at the given position is currently expanded. */
    isExpanded(position: ToastPosition): boolean {
        return this.expandedStacks().has(position);
    }

    /** Sets the expanded state for a specific toast stack position. */
    setExpanded(position: ToastPosition, expanded: boolean): void {
        const isExpanded = this.expandedStacks().has(position);

        if (isExpanded === expanded) {
            return;
        }

        this.expandedStacks.update(current => {
            const next = new Set(current);

            if (expanded) {
                next.add(position);
            } else {
                next.delete(position);
            }

            return next;
        });
        this.scheduleMeasure();
    }

    /** Collapses a stack only when focus moves completely outside of it. */
    onStackFocusOut(position: ToastPosition, event: FocusEvent): void {
        const currentTarget = event.currentTarget as HTMLElement | null;
        const nextTarget = event.relatedTarget as Node | null;

        if (currentTarget && nextTarget && currentTarget.contains(nextTarget)) {
            return;
        }

        this.scheduleCollapseCheck(position);
    }

    /** Expands on direct toast hover and collapses only after the pointer leaves the whole stack. */
    onToastHover(position: ToastPosition, event: { id: string; hovering: boolean }): void {
        if (event.hovering) {
            this.cancelCollapseCheck(position);
            this.setExpanded(position, true);

            if (this.pauseOnHover) {
                this.toastService.pausePosition(position);
            }

            return;
        }

        this.scheduleCollapseCheck(position);
    }

    /** Re-emits action clicks in a simplified payload for consuming apps. */
    onAction(event: { id: string; action: { id: string } }): void {
        this.actionClick.emit({ id: event.id, actionId: event.action.id });
    }

    /** Starts observing toast sizes once the viewport has rendered. */
    ngAfterViewInit(): void {
        this.isViewReady = true;

        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure());
        }

        this.scheduleMeasure();

        this.destroyRef.onDestroy(() => {
            if (this.measureFrame) {
                cancelAnimationFrame(this.measureFrame);
            }

            for (const frame of this.collapseFrames.values()) {
                cancelAnimationFrame(frame);
            }

            this.collapseFrames.clear();
            this.resizeObserver?.disconnect();
        });
    }

    /** Schedules a single layout recalculation on the next animation frame. */
    private scheduleMeasure(): void {
        if (!this.isViewReady) {
            return;
        }

        if (this.measureFrame) {
            cancelAnimationFrame(this.measureFrame);
        }

        this.ngZone.runOutsideAngular(() => {
            this.measureFrame = requestAnimationFrame(() => {
                this.measureFrame = undefined;
                this.observeItems();
                this.applyStackLayout();
            });
        });
    }

    /** Defers collapse so moving between toasts in the same stack does not flicker the layout. */
    private scheduleCollapseCheck(position: ToastPosition): void {
        this.cancelCollapseCheck(position);

        this.ngZone.runOutsideAngular(() => {
            const frame = requestAnimationFrame(() => {
                this.collapseFrames.delete(position);

                const stack = this.getStackElement(position);
                const activeElement = document.activeElement;
                const isHovered = stack?.matches(':hover') ?? false;
                const containsFocus = !!(stack && activeElement instanceof Node && stack.contains(activeElement));

                if (!isHovered && !containsFocus) {
                    if (this.pauseOnHover) {
                        this.toastService.resumePosition(position);
                    }

                    this.setExpanded(position, false);
                }
            });

            this.collapseFrames.set(position, frame);
        });
    }

    /** Cancels any pending collapse check for the given stack position. */
    private cancelCollapseCheck(position: ToastPosition): void {
        const frame = this.collapseFrames.get(position);

        if (!frame) {
            return;
        }

        cancelAnimationFrame(frame);
        this.collapseFrames.delete(position);
    }

    /** Subscribes each visible stack item to ResizeObserver updates. */
    private observeItems(): void {
        if (!this.resizeObserver) {
            return;
        }

        this.resizeObserver.disconnect();

        const items = Array.from(
            this.hostElement.nativeElement.querySelectorAll('.toast-stack__item')
        ) as HTMLElement[];

        for (const item of items) {
            this.resizeObserver.observe(item);
        }
    }

    /** Computes collapsed and expanded transforms for each toast stack. */
    private applyStackLayout(): void {
        const isCompactViewport = window.matchMedia('(max-width: 640px)').matches;
        const collapsedStep = isCompactViewport ? 8 : 10;
        const expandedGap = isCompactViewport ? 14 : 18;

        const stacks = Array.from(
            this.hostElement.nativeElement.querySelectorAll('.toast-stack')
        ) as HTMLElement[];

        for (const stack of stacks) {
            const position = stack.dataset['position'];
            const direction = position?.startsWith('bottom') ? -1 : 1;
            const items = Array.from(stack.querySelectorAll('.toast-stack__item')) as HTMLElement[];

            if (items.length === 0) {
                continue;
            }

            const itemHeights = items.map(item => Math.ceil(item.getBoundingClientRect().height));
            const itemWidths = items.map(item => this.getItemWidth(item));
            const collapsedScales = items.map((_, index) => this.getCollapsedScale(index, isCompactViewport));
            const collapsedHeights = itemHeights.map((height, index) => height * collapsedScales[index]);
            const collapsedOffsets = direction === 1
                ? this.getCollapsedOffsets(collapsedHeights, collapsedStep)
                : this.getCollapsedOffsets(collapsedHeights, collapsedStep);
            const stackWidth = Math.max(...itemWidths);

            let expandedOffset = 0;
            let expandedHeight = 0;

            for (const [index, item] of items.entries()) {
                const itemHeight = itemHeights[index];
                const collapsedScale = collapsedScales[index];

                item.style.setProperty('--stack-collapsed-translate', `${collapsedOffsets[index] * direction}px`);
                item.style.setProperty('--stack-expanded-translate', `${expandedOffset * direction}px`);
                item.style.setProperty('--stack-collapsed-scale', `${collapsedScale}`);
                item.style.setProperty('--stack-collapsed-opacity', `${Math.max(0.42, 1 - (index * 0.24))}`);
                item.style.setProperty('--stack-collapsed-blur', `${Math.min(2.2, index * 0.85)}px`);
                expandedHeight = Math.max(expandedHeight, expandedOffset + itemHeight);
                expandedOffset += itemHeight + expandedGap;
            }

            const collapsedHeight = Math.max(...collapsedHeights.map((height, index) => collapsedOffsets[index] + height));

            stack.style.setProperty('--stack-collapsed-height', `${collapsedHeight}px`);
            stack.style.setProperty('--stack-expanded-height', `${expandedHeight}px`);
            stack.style.setProperty('--stack-width', `${stackWidth}px`);
        }
    }

    /** Returns the vertical offsets that create the overlapped collapsed stack. */
    private getCollapsedOffsets(collapsedHeights: number[], collapsedStep: number): number[] {
        if (collapsedHeights.length === 0) {
            return [];
        }

        const offsets = [0];
        let previousBottom = collapsedHeights[0];

        for (let index = 1; index < collapsedHeights.length; index += 1) {
            const offset = previousBottom + collapsedStep - collapsedHeights[index];
            offsets.push(offset);
            previousBottom = offset + collapsedHeights[index];
        }

        return offsets;
    }

    /** Gradually shrinks deeper toasts so the stack reads as layered cards. */
    private getCollapsedScale(index: number, isCompactViewport: boolean): number {
        const scaleStep = isCompactViewport ? 0.045 : 0.055;
        return Math.max(0.84, 1 - (index * scaleStep));
    }

    /** Measures the rendered toast card width so the stack hit area matches the visible card. */
    private getItemWidth(item: HTMLElement): number {
        const toast = item.querySelector('.toast') as HTMLElement | null;
        return Math.ceil(toast?.getBoundingClientRect().width ?? item.getBoundingClientRect().width);
    }

    /** Finds the rendered stack element for a specific toast position. */
    private getStackElement(position: ToastPosition): HTMLElement | null {
        return this.hostElement.nativeElement.querySelector(
            `.toast-stack[data-position="${position}"]`
        ) as HTMLElement | null;
    }
}

const POSITION_CLASS_MAP: Record<ToastPosition, string> = {
    'top-left': 'toast-stack--top-left',
    'top-center': 'toast-stack--top-center',
    'top-right': 'toast-stack--top-right',
    'bottom-left': 'toast-stack--bottom-left',
    'bottom-center': 'toast-stack--bottom-center',
    'bottom-right': 'toast-stack--bottom-right'
};
