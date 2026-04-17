import { Component, effect, inject, input, output, signal, booleanAttribute, DestroyRef } from '@angular/core';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

export interface NavItem {
  icon: string;
  label: string;
  route?: string;
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'lib-sidebar',
  standalone: true,
  imports: [OverlayModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly productName = input('Product Name');
  readonly navItems = input<NavItem[]>([]);
  readonly isCollapsed = input(false, { transform: booleanAttribute });

  readonly toggle = output<void>();
  readonly closeMenu = output<void>();

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeItem = signal<NavItem | null>(null);
  readonly flyoutItem = signal<NavItem | null>(null);

  readonly flyoutPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'top',
      offsetX: 8
    }
  ];

  constructor() {
    effect(() => {
      const collapsed = this.isCollapsed();
      const items = this.navItems();
      const active = this.activeItem();

      this.flyoutItem.set(null);

      if (!collapsed && active) {
        this.expandParentGroup(items, active);
      }
    });

    effect(() => {
      this.navItems();
      this.syncActiveItemWithRoute();
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.syncActiveItemWithRoute());
  }

  toggleSidebar(): void {
    this.toggle.emit();
    this.flyoutItem.set(null);
  }

  onClose(): void {
    this.closeMenu.emit();
  }

  showFlyout(item: NavItem): void {
    if (this.isCollapsed() && item.children?.length) {
      this.flyoutItem.set(item);
    }
  }

  hideFlyout(): void {
    this.flyoutItem.set(null);
  }

  selectItem(item: NavItem): void {
    if (this.isCollapsed() && item.children?.length) {
      this.showFlyout(item);
      return;
    }

    if (item.children?.length) {
      item.expanded = !item.expanded;
      return;
    }

    this.activeItem.set(item);

    if (item.route) {
      void this.router.navigateByUrl(item.route);
      this.closeMenu.emit();
    }

    this.collapseOtherGroups(item);
  }

  isActive(item: NavItem): boolean {
    return this.activeItem() === item;
  }

  isChildActive(item: NavItem): boolean {
    const active = this.activeItem();

    if (!item.children?.length || !active) {
      return false;
    }

    return item.children.some((child) => child === active);
  }

  private syncActiveItemWithRoute(): void {
    const currentUrl = this.router.url;
    const items = this.navItems();

    for (const navItem of items) {
      if (navItem.route && currentUrl.startsWith(navItem.route)) {
        this.activeItem.set(navItem);
        return;
      }

      const activeChild = navItem.children?.find((child) => child.route && currentUrl.startsWith(child.route));
      if (activeChild) {
        this.activeItem.set(activeChild);
        navItem.expanded = true;
        return;
      }
    }

    this.activeItem.set(null);
  }

  private expandParentGroup(items: NavItem[], active: NavItem): void {
    for (const navItem of items) {
      if (navItem.children?.some((child) => child === active)) {
        navItem.expanded = true;
      }
    }
  }

  private collapseOtherGroups(activeLeaf: NavItem): void {
    for (const navItem of this.navItems()) {
      if (!navItem.children?.length) {
        continue;
      }

      const isParentOfActiveLeaf = navItem.children.some((child) => child === activeLeaf);
      if (!isParentOfActiveLeaf) {
        navItem.expanded = false;
      }
    }
  }
}
