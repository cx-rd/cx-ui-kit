import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationItem } from '../../core/models';
import { RelativeTimePipe } from '../../core/pipes/relative-time.pipe';

@Component({
    selector: 'lib-notification-popover',
    standalone: true,
    imports: [CommonModule, RelativeTimePipe],
    templateUrl: './notification-popover.component.html',
    styleUrl: './notification-popover.component.scss'
})
export class NotificationPopoverComponent {
    @Input() notifications: NotificationItem[] = [];

    @Output() markAllAsRead = new EventEmitter<void>();
    @Output() viewDetail = new EventEmitter<NotificationItem>();
    @Output() hoverItem = new EventEmitter<{ notification: NotificationItem | null, element: HTMLElement | null }>();

    onMarkAllAsRead() {
        this.markAllAsRead.emit();
    }

    onItemClick(notification: NotificationItem) {
        this.viewDetail.emit(notification);
    }

    onItemMouseEnter(notification: NotificationItem, event: MouseEvent) {
        const element = event.currentTarget as HTMLElement;
        this.hoverItem.emit({ notification, element });
    }

    onItemMouseLeave() {
        this.hoverItem.emit({ notification: null, element: null });
    }
}
