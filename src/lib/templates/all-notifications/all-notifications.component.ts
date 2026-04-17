import { Component, computed, input, signal } from '@angular/core';
import { NotificationItem } from '../../core/models';
import { RelativeTimePipe } from '../../core/pipes/relative-time.pipe';
import { NotificationDetailModalComponent } from '../../components/notification';

type FilterTab = 'All' | 'Alerts' | 'Messages';

@Component({
    selector: 'lib-all-notifications',
    standalone: true,
    imports: [RelativeTimePipe, NotificationDetailModalComponent],
    templateUrl: './all-notifications.component.html',
    styleUrl: './all-notifications.component.scss'
})
export class AllNotificationsPageComponent {
    readonly notifications = input<NotificationItem[]>([]);
    readonly selectedNotification = signal<NotificationItem | null>(null);
    readonly activeTab = signal<FilterTab>('All');

    readonly filteredNotifications = computed<NotificationItem[]>(() => {
        const tab = this.activeTab();
        const all = this.notifications();

        if (tab === 'All') {
            return all;
        }

        return all.filter((notification) => {
            if (tab === 'Alerts') {
                return notification.type === 'alert';
            }

            if (tab === 'Messages') {
                return notification.type === 'update';
            }

            return true;
        });
    });

    setTab(tab: FilterTab): void {
        this.activeTab.set(tab);
    }

    viewDetail(notification: NotificationItem): void {
        this.selectedNotification.set(notification);
    }

    closeModal(): void {
        this.selectedNotification.set(null);
    }
}
