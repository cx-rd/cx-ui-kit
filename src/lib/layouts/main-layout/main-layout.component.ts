import { Component, input, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent, NavItem } from '../sidebar';
import { ToolbarComponent } from '../toolbar';
import { UserInfo, UserMenuAction, NotificationItem } from '../../core/models';

@Component({
  selector: 'lib-main-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ToolbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  productName = input<string>('Product Name');
  navItems = input<NavItem[]>([]);
  userInfo = input<UserInfo | null>(null);
  customUserActions = input<UserMenuAction[]>([]);
  notifications = input<NotificationItem[]>([]);

  isSidebarCollapsed = signal(false);
  isMobileMenuOpen = signal(false);

  @HostListener('window:resize', ['$event'])
  onResize() {
    const width = window.innerWidth;
    if (width > 768) {
      // 寬度回到桌面版，自動關閉手機版選單
      this.closeMobileMenu();
    } else {
      // 寬度變為手機版，如果不小心保留了收起狀態，則強制打開選單（手機選單不應有收起模式）
      this.isSidebarCollapsed.set(false);
    }
  }

  toggleSidebar() {
    if (window.innerWidth <= 768) {
      this.isMobileMenuOpen.update(v => !v);
    } else {
      const wasCollapsed = this.isSidebarCollapsed();
      this.isSidebarCollapsed.update(v => !v);

      if (wasCollapsed && !this.isSidebarCollapsed()) {
        // ... 原有的展開邏輯也可以保留或優化
      }
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
}
