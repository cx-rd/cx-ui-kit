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
    readonly hoverItem = output<{ notification: NotificationItem | null; element: HTMLElement | null }>();

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
