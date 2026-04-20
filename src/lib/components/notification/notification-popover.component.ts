import { Component, input, output } from '@angular/core';
import { NotificationItem } from '../../core/models';
import { RelativeTimePipe } from '../../core/pipes/relative-time.pipe';

@Component({
    selector: 'lib-notification-popover',
    standalone: true,
    imports: [RelativeTimePipe],
    templateUrl: './notification-popover.component.html',
    styleUrl: './notification-popover.component.scss'
})
export class NotificationPopoverComponent {
    readonly notifications = input<NotificationItem[]>([]);

    readonly markAllAsRead = output<void>();
    readonly viewDetail = output<NotificationItem>();
    // Hover 時連同 DOM element 一起送出，外層才能把預覽卡對齊到目前項目。
    readonly hoverItem = output<{ notification: NotificationItem | null; element: HTMLElement | null }>();

    // 互動結果全部交給容器處理，Popover 自己不直接改資料狀態。
    onMarkAllAsRead(): void {
        this.markAllAsRead.emit();
    }

    onItemClick(notification: NotificationItem): void {
        this.viewDetail.emit(notification);
    }

    onItemMouseEnter(notification: NotificationItem, event: MouseEvent): void {
        const element = event.currentTarget as HTMLElement;
        this.hoverItem.emit({ notification, element });
    }

    onItemMouseLeave(): void {
        this.hoverItem.emit({ notification: null, element: null });
    }
}
