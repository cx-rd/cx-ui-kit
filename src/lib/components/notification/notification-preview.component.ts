import { Component, input } from '@angular/core';
import { NotificationItem } from '../../core/models';

@Component({
    selector: 'lib-notification-preview',
    standalone: true,
    imports: [],
    templateUrl: './notification-preview.component.html',
    styleUrl: './notification-preview.component.scss'
})
export class NotificationPreviewComponent {
    // 預覽區維持純展示，避免和 Popover / Modal 各自持有通知狀態。
    readonly notification = input<NotificationItem | null>(null);
}
