import { Component, input, output } from '@angular/core';
import { NotificationItem } from '../../core/models';
import { RelativeTimePipe } from '../../core/pipes/relative-time.pipe';

@Component({
    selector: 'lib-notification-detail-modal',
    standalone: true,
    imports: [RelativeTimePipe],
    templateUrl: './notification-detail-modal.component.html',
    styleUrl: './notification-detail-modal.component.scss'
})
export class NotificationDetailModalComponent {
    readonly notification = input<NotificationItem | null>(null);
    readonly close = output<void>();

    // 關閉只往外通知，讓容器統一處理 modal 開關與後續狀態更新。
    onClose(): void {
        this.close.emit();
    }
}
