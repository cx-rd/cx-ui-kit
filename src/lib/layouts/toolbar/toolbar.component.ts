import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { UserMenuComponent } from '../../components/user-menu';
import { NotificationPopoverComponent, NotificationPreviewComponent, NotificationDetailModalComponent } from '../../components/notification';
import { UserInfo, UserMenuAction, NotificationItem } from '../../core/models';

@Component({
  selector: 'lib-toolbar',
  standalone: true,
  imports: [
    CommonModule,
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
  // Inputs
  userInfo = input<UserInfo | null>(null);
  customActions = input<UserMenuAction[]>([]);
  notifications = input<NotificationItem[]>([]);

  // Outputs
  menuToggled = output<void>();
  userMenuAction = output<string>();
  notificationAction = output<{ type: string, notification?: NotificationItem }>();

  // State
  isUserMenuOpen = signal(false);
  isNotificationOpen = signal(false);
  hoveredNotification = signal<NotificationItem | null>(null);
  hoveredElement = signal<HTMLElement | null>(null);
  selectedNotification = signal<NotificationItem | null>(null);

  // Overlay Positions for Preview (Side Panel - Left or Right depending on space)
  previewPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'top',
      offsetX: -12 // Padding from popover edge
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'top',
      offsetX: 12 // Padding from popover edge
    }
  ];

  onMenuClick() {
    this.menuToggled.emit();
  }

  toggleUserMenu() {
    this.isUserMenuOpen.update(open => !open);
    if (this.isUserMenuOpen()) this.isNotificationOpen.set(false);
  }

  toggleNotifications() {
    this.isNotificationOpen.update(open => !open);
    if (this.isNotificationOpen()) this.isUserMenuOpen.set(false);
  }

  onUserMenuAction(actionId: string) {
    this.userMenuAction.emit(actionId);
    this.isUserMenuOpen.set(false);
  }

  onNotificationHover(data: { notification: NotificationItem | null, element: HTMLElement | null }) {
    this.hoveredNotification.set(data.notification);
    this.hoveredElement.set(data.element);
  }

  onViewNotificationDetail(notification: NotificationItem) {
    this.selectedNotification.set(notification);
    this.isNotificationOpen.set(false);
    this.notificationAction.emit({ type: 'view', notification });
  }

  onMarkAllAsRead() {
    this.notificationAction.emit({ type: 'markAllRead' });
  }

  closeDetailModal() {
    this.selectedNotification.set(null);
  }
}
