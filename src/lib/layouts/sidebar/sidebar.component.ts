import { Component, input, signal, Output, EventEmitter, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { RouterModule, Router } from '@angular/router';

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
  imports: [CommonModule, OverlayModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  productName = input<string>('Product Name');
  navItems = input<NavItem[]>([]);
  isCollapsed = input<boolean>(false);

  @Output() toggle = new EventEmitter<void>();
  @Output() closeMenu = new EventEmitter<void>();

    private router = inject(Router);

    activeItem = signal<NavItem | null>(null);
    flyoutItem = signal<NavItem | null>(null);

    // CDK Overlay Positions
    flyoutPositions: ConnectedPosition[] = [
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
            // 當收起狀態改變時，關閉所有的 Flyout
            this.flyoutItem.set(null);

            // 當從收起變回展開時，自動展開目前選中項目的父層
            if (!collapsed) {
                const active = this.activeItem();
                if (active) {
                    this.navItems().forEach(navItem => {
                        if (navItem.children?.some(child => child === active)) {
                            navItem.expanded = true;
                        }
                    });
                }
            }
        });

        // Initialize and listen to router changes
        this.router.events.subscribe(event => {
            if (event.constructor.name === 'NavigationEnd') {
                this.syncActiveItemWithRoute();
            }
        });
    }

    ngOnInit() {
        this.syncActiveItemWithRoute();
    }

    private syncActiveItemWithRoute() {
        const currentUrl = this.router.url;
        const items = this.navItems();
        let foundMatch = false;

        for (const navItem of items) {
            // Check direct route match
            if (navItem.route && currentUrl.startsWith(navItem.route)) {
                this.activeItem.set(navItem);
                foundMatch = true;
                break;
            }

            // Check children
            if (navItem.children) {
                const activeChild = navItem.children.find(child => 
                    child.route && currentUrl.startsWith(child.route)
                );
                if (activeChild) {
                    this.activeItem.set(activeChild);
                    navItem.expanded = true; // Auto-expand current group
                    foundMatch = true;
                    break;
                }
            }
        }

        if (!foundMatch) {
            this.activeItem.set(null);
        }
    }

    toggleSidebar() {
        this.toggle.emit();
        this.flyoutItem.set(null);
    }

    onClose() {
        this.closeMenu.emit();
    }

    showFlyout(item: NavItem) {
        if (this.isCollapsed() && item.children) {
            this.flyoutItem.set(item);
        }
    }

    hideFlyout() {
        this.flyoutItem.set(null);
    }

    selectItem(item: NavItem) {
        // 如果在收起狀態點擊有子項目的項目，僅顯示 Flyout 而不切換內部的 expanded 狀態
        if (this.isCollapsed() && item.children) {
            this.showFlyout(item);
            return;
        }

        if (item.children) {
            item.expanded = !item.expanded;
        } else {
            this.activeItem.set(item);

            if (item.route) {
                this.router.navigateByUrl(item.route);
                this.closeMenu.emit(); // Close mobile menu on navigation
            }

            // 當點擊子項目或無子項目的主項目時，處理收起邏輯（自動收起非當前路徑的組）
            this.navItems().forEach(navItem => {
                if (navItem.children) {
                    const isChildOfThisPattern = navItem.children.some(child => child === item);
                    if (!isChildOfThisPattern) {
                        navItem.expanded = false;
                    }
                }
            });
        }
    }

  toggleGroup(item: NavItem) {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  isActive(item: NavItem): boolean {
    return this.activeItem() === item;
  }

  isChildActive(item: NavItem): boolean {
    if (!item.children || !this.activeItem()) return false;
    return item.children.some(child => child === this.activeItem());
  }
}
