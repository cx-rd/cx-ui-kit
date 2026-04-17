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
    readonly notification = input<NotificationItem | null>(null);
}
