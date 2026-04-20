import {
    AfterViewInit,
    Component,
    DestroyRef,
    ElementRef,
    NgZone,
    booleanAttribute,
    computed,
    effect,
    inject,
    input,
    output,
    signal
} from '@angular/core';
import { ToastPosition } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { ToastComponent } from './toast.component';

@Component({
    selector: 'lib-toast-viewport',
    standalone: true,
    imports: [ToastComponent],
    templateUrl: './toast-viewport.component.html',
    styleUrl: './toast-viewport.component.scss'
})
export class ToastViewportComponent implements AfterViewInit {
    readonly position = input<ToastPosition | undefined>();
    readonly pauseOnHover = input(true, { transform: booleanAttribute });

    readonly actionClick = output<{ id: string; actionId: string }>();

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
    // 依位置分組，讓每個角落的 toast stack 可以獨立展開與量測。
    readonly groups = computed(() => {
        const grouped = new Map<ToastPosition, ReturnType<typeof this.toastService.toasts>>();
        const position = this.position();

        for (const toast of this.toastService.toasts()) {
            if (position && toast.position !== position) {
                continue;
            }

            const current = grouped.get(toast.position) ?? [];
            grouped.set(toast.position, [...current, toast]);
        }

        return Array.from(grouped.entries());
    });
    // toast 清單變動後，統一在下一幀重算堆疊版面，避免連續量測造成抖動。
    private readonly toastWatcher = effect(() => {
        this.groups();
        this.scheduleMeasure();
    });

    /** 每個位置只顯示最新三筆，其餘透過堆疊視覺暗示仍然存在。 */
    getStackedToasts(toasts: ReturnType<typeof this.toastService.toasts>): ReturnType<typeof this.toastService.toasts> {
        return [...toasts].reverse().slice(0, 3);
    }

    /** 從 service 移除指定 toast。 */
    dismiss(id: string): void {
        this.toastService.dismiss(id);
    }

    /** 判斷指定位置的 stack 目前是否展開。 */
    isExpanded(position: ToastPosition): boolean {
        return this.expandedStacks().has(position);
    }

    /** 只切換單一位置的展開狀態，避免不同角落互相干擾。 */
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

    /** 焦點真的離開整個 stack 才收合，讓鍵盤操作不會一直閃動。 */
    onStackFocusOut(position: ToastPosition, event: FocusEvent): void {
        const currentTarget = event.currentTarget as HTMLElement | null;
        const nextTarget = event.relatedTarget as Node | null;

        if (currentTarget && nextTarget && currentTarget.contains(nextTarget)) {
            return;
        }

        this.scheduleCollapseCheck(position);
    }

    /** 滑入任一 toast 就展開；離開後延後檢查，避免跨卡片移動時誤收合。 */
    onToastHover(position: ToastPosition, event: { id: string; hovering: boolean }): void {
        if (event.hovering) {
            this.cancelCollapseCheck(position);
            this.setExpanded(position, true);

            if (this.pauseOnHover()) {
                this.toastService.pausePosition(position);
            }

            return;
        }

        this.scheduleCollapseCheck(position);
    }

    /** 對外輸出較精簡的 action payload。 */
    onAction(event: { id: string; action: { id: string } }): void {
        this.actionClick.emit({ id: event.id, actionId: event.action.id });
    }

    /** View 完成渲染後才開始量測，避免抓到尚未穩定的尺寸。 */
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

    /** 把多次尺寸更新合併到同一個 animation frame 處理。 */
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

    /** 延後一幀再判斷是否收合，減少在同一個 stack 內移動時的閃爍。 */
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
                    if (this.pauseOnHover()) {
                        this.toastService.resumePosition(position);
                    }

                    this.setExpanded(position, false);
                }
            });

            this.collapseFrames.set(position, frame);
        });
    }

    /** 取消指定 stack 既有的收合檢查。 */
    private cancelCollapseCheck(position: ToastPosition): void {
        const frame = this.collapseFrames.get(position);

        if (!frame) {
            return;
        }

        cancelAnimationFrame(frame);
        this.collapseFrames.delete(position);
    }

    /** 讓每張可見卡片的尺寸變動都能回頭觸發重新排版。 */
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

    /** 同時計算收合與展開兩套位移，讓堆疊層次在不同尺寸下都一致。 */
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
            const collapsedOffsets = this.getCollapsedOffsets(collapsedHeights, collapsedStep);
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

    /** 計算收合狀態下的垂直重疊位移。 */
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

    /** 深層卡片逐步縮小，強化堆疊的層次感。 */
    private getCollapsedScale(index: number, isCompactViewport: boolean): number {
        const scaleStep = isCompactViewport ? 0.045 : 0.055;
        return Math.max(0.84, 1 - (index * scaleStep));
    }

    /** 以實際卡片寬度當作 stack 命中範圍，避免 hover 區域比畫面更寬。 */
    private getItemWidth(item: HTMLElement): number {
        const toast = item.querySelector('.toast') as HTMLElement | null;
        return Math.ceil(toast?.getBoundingClientRect().width ?? item.getBoundingClientRect().width);
    }

    /** 取得指定位置對應的 DOM stack。 */
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
