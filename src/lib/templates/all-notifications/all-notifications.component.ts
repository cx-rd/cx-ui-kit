import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationItem } from '../../core/models';
import { RelativeTimePipe } from '../../core/pipes/relative-time.pipe';
import { NotificationDetailModalComponent } from '../../components/notification';

type FilterTab = 'All' | 'Alerts' | 'Messages';

@Component({
    selector: 'lib-all-notifications',
    standalone: true,
    imports: [CommonModule, RelativeTimePipe, NotificationDetailModalComponent],
    templateUrl: './all-notifications.component.html',
    styleUrl: './all-notifications.component.scss'
})
export class AllNotificationsPageComponent {
    notifications = input<NotificationItem[]>([]);
    readonly selectedNotification = signal<NotificationItem | null>(null);
    readonly activeTab = signal<FilterTab>('All');

    readonly filteredNotifications = computed<NotificationItem[]>(() => {
        const tab = this.activeTab();
        const all: NotificationItem[] = this.notifications() || [];

        if (tab === 'All') return all;

        return all.filter(n => {
            if (tab === 'Alerts') return n.type === 'alert';
            if (tab === 'Messages') return n.type === 'update';
            return true;
        });
    });

    setTab(tab: FilterTab) {
        this.activeTab.set(tab);
    }

    viewDetail(notification: NotificationItem) {
        this.selectedNotification.set(notification);
    }

    closeModal() {
        this.selectedNotification.set(null);
    }
}
