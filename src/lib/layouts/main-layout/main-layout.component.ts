import { Component, HostListener, input, output, signal } from '@angular/core';
import { SidebarComponent, NavItem } from '../sidebar';
import { ToolbarComponent } from '../toolbar';
import { UserInfo, UserMenuAction, NotificationItem } from '../../core/models';

@Component({
  selector: 'lib-main-layout',
  standalone: true,
  imports: [SidebarComponent, ToolbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  readonly productName = input('Product Name');
  readonly navItems = input<NavItem[]>([]);
  readonly userInfo = input<UserInfo | null>(null);
  readonly customUserActions = input<UserMenuAction[]>([]);
  readonly notifications = input<NotificationItem[]>([]);

  readonly userMenuAction = output<string>();
  readonly notificationAction = output<{ type: string; notification?: NotificationItem }>();

  readonly isSidebarCollapsed = signal(false);
  readonly isMobileMenuOpen = signal(false);

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768) {
      this.closeMobileMenu();
      return;
    }

    this.isSidebarCollapsed.set(false);
  }

  toggleSidebar(): void {
    if (window.innerWidth <= 768) {
      this.isMobileMenuOpen.update((value) => !value);
      return;
    }

    this.isSidebarCollapsed.update((value) => !value);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
