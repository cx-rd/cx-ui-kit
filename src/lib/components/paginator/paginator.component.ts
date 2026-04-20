import {
    ChangeDetectionStrategy,
    Component,
    booleanAttribute,
    input,
    numberAttribute,
    output
} from '@angular/core';
import { DataTablePageChange } from '../../core/models';

interface PaginatorItem {
    type: 'page' | 'ellipsis';
    value?: number;
}

@Component({
    selector: 'lib-paginator',
    standalone: true,
    templateUrl: './paginator.component.html',
    styleUrl: './paginator.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatorComponent {
    readonly pageIndex = input(0, { transform: numberAttribute });
    readonly pageSize = input(10, { transform: numberAttribute });
    readonly totalItems = input(0, { transform: numberAttribute });
    readonly maxVisiblePages = input(5, { transform: numberAttribute });
    readonly showBoundaryButtons = input(true, { transform: booleanAttribute });
    readonly previousLabel = input('Previous page');
    readonly nextLabel = input('Next page');
    readonly firstLabel = input('First page');
    readonly lastLabel = input('Last page');
    readonly ariaLabel = input('Pagination');

    readonly pageChange = output<DataTablePageChange>();

    get resolvedPageSize(): number {
        return Math.max(1, this.pageSize());
    }

    get resolvedTotalItems(): number {
        return Math.max(0, this.totalItems());
    }

    get pageCount(): number {
        return Math.max(1, Math.ceil(this.resolvedTotalItems / this.resolvedPageSize));
    }

    get resolvedPageIndex(): number {
        return this.clampPageIndex(this.pageIndex());
    }

    get canGoPrevious(): boolean {
        return this.resolvedPageIndex > 0;
    }

    get canGoNext(): boolean {
        return this.resolvedPageIndex < this.pageCount - 1;
    }

    get pageItems(): PaginatorItem[] {
        // 頁數過多時固定保留首尾頁，中間以滑動視窗搭配省略號呈現。
        const totalPages = this.pageCount;
        const maxVisiblePages = Math.max(3, this.maxVisiblePages());

        if (totalPages <= maxVisiblePages) {
            return Array.from({ length: totalPages }, (_, index) => ({
                type: 'page',
                value: index
            }));
        }

        const currentPage = this.resolvedPageIndex;
        const windowSize = Math.max(1, maxVisiblePages - 2);
        let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
        let end = start + windowSize - 1;

        if (end >= totalPages - 1) {
            end = totalPages - 2;
            start = Math.max(1, end - windowSize + 1);
        }

        const items: PaginatorItem[] = [{ type: 'page', value: 0 }];

        if (start > 1) {
            items.push({ type: 'ellipsis' });
        }

        for (let page = start; page <= end; page += 1) {
            items.push({ type: 'page', value: page });
        }

        if (end < totalPages - 2) {
            items.push({ type: 'ellipsis' });
        }

        items.push({ type: 'page', value: totalPages - 1 });

        return items;
    }

    goToFirst(): void {
        this.emitPageChange(0);
    }

    goToPrevious(): void {
        if (!this.canGoPrevious) {
            return;
        }

        this.emitPageChange(this.resolvedPageIndex - 1);
    }

    goToNext(): void {
        if (!this.canGoNext) {
            return;
        }

        this.emitPageChange(this.resolvedPageIndex + 1);
    }

    goToLast(): void {
        this.emitPageChange(this.pageCount - 1);
    }

    goToPage(pageIndex: number): void {
        this.emitPageChange(pageIndex);
    }

    private emitPageChange(pageIndex: number): void {
        const nextPageIndex = this.clampPageIndex(pageIndex);

        // 點到目前頁時不重送事件，避免外層重複做資料請求或重算。
        if (nextPageIndex === this.resolvedPageIndex) {
            return;
        }

        this.pageChange.emit(this.buildPageChange(nextPageIndex));
    }

    private buildPageChange(pageIndex: number): DataTablePageChange {
        const totalItems = this.resolvedTotalItems;
        const pageSize = this.resolvedPageSize;
        const startIndex = totalItems === 0 ? 0 : pageIndex * pageSize + 1;
        const endIndex = totalItems === 0
            ? 0
            : Math.min(totalItems, (pageIndex + 1) * pageSize);

        // 一次帶齊頁碼與顯示範圍，DataTable footer 不需要自己再計算。
        return {
            pageIndex,
            pageSize,
            totalItems,
            pageCount: this.pageCount,
            startIndex,
            endIndex
        };
    }

    private clampPageIndex(pageIndex: number): number {
        return Math.min(Math.max(0, pageIndex), this.pageCount - 1);
    }
}
