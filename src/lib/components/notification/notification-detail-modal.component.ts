import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationItem } from '../../core/models';
import { RelativeTimePipe } from '../../core/pipes/relative-time.pipe';

@Component({
    selector: 'lib-notification-detail-modal',
    standalone: true,
    imports: [CommonModule, RelativeTimePipe],
    templateUrl: './notification-detail-modal.component.html',
    styleUrl: './notification-detail-modal.component.scss'
})
export class NotificationDetailModalComponent {
    @Input() notification: NotificationItem | null = null;
    @Output() close = new EventEmitter<void>();

    onClose() {
        this.close.emit();
    }
}
