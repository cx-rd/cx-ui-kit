import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationItem } from '../../core/models';

@Component({
    selector: 'lib-notification-preview',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notification-preview.component.html',
    styleUrl: './notification-preview.component.scss'
})
export class NotificationPreviewComponent {
    @Input() notification: NotificationItem | null = null;
}
