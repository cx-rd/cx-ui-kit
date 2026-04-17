import { Component, input, output, signal } from '@angular/core';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { UserMenuComponent } from '../../components/user-menu';
import { NotificationPopoverComponent, NotificationPreviewComponent, NotificationDetailModalComponent } from '../../components/notification';
import { UserInfo, UserMenuAction, NotificationItem } from '../../core/models';

@Component({
  selector: 'lib-toolbar',
  standalone: true,
  imports: [
    OverlayModule,
    UserMenuComponent,
    NotificationPopoverComponent,
    NotificationPreviewComponent,
    NotificationDetailModalComponent
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  readonly userInfo = input<UserInfo | null>(null);
  readonly customActions = input<UserMenuAction[]>([]);
  readonly notifications = input<NotificationItem[]>([]);

  readonly menuToggled = output<void>();
  readonly userMenuAction = output<string>();
  readonly notificationAction = output<{ type: string; notification?: NotificationItem }>();

  readonly isUserMenuOpen = signal(false);
  readonly isNotificationOpen = signal(false);
  readonly hoveredNotification = signal<NotificationItem | null>(null);
  readonly hoveredElement = signal<HTMLElement | null>(null);
  readonly selectedNotification = signal<NotificationItem | null>(null);

  readonly previewPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'top',
      offsetX: -12
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'top',
      offsetX: 12
    }
  ];

  onMenuClick(): void {
    this.menuToggled.emit();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((open) => !open);
    if (this.isUserMenuOpen()) {
      this.closeNotifications();
    }
  }

  toggleNotifications(): void {
    this.isNotificationOpen.update((open) => !open);
    if (this.isNotificationOpen()) {
      this.isUserMenuOpen.set(false);
    } else {
      this.resetNotificationHover();
    }
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  closeNotifications(): void {
    this.isNotificationOpen.set(false);
    this.resetNotificationHover();
  }

  onUserMenuAction(actionId: string): void {
    this.userMenuAction.emit(actionId);
    this.closeUserMenu();
  }

  onNotificationHover(data: { notification: NotificationItem | null; element: HTMLElement | null }): void {
    this.hoveredNotification.set(data.notification);
    this.hoveredElement.set(data.element);
  }

  onViewNotificationDetail(notification: NotificationItem): void {
    this.selectedNotification.set(notification);
    this.closeNotifications();
    this.notificationAction.emit({ type: 'view', notification });
  }

  onMarkAllAsRead(): void {
    this.notificationAction.emit({ type: 'markAllRead' });
  }

  closeDetailModal(): void {
    this.selectedNotification.set(null);
  }

  private resetNotificationHover(): void {
    this.hoveredNotification.set(null);
    this.hoveredElement.set(null);
  }
}
