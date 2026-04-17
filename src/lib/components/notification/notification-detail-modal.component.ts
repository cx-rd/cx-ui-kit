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

    onClose(): void {
        this.close.emit();
    }
}
