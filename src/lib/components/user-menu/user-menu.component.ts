import { Component, input, output } from '@angular/core';
import { UserInfo, UserMenuAction } from '../../core/models';

@Component({
    selector: 'lib-user-menu',
    standalone: true,
    imports: [],
    templateUrl: './user-menu.component.html',
    styleUrl: './user-menu.component.scss'
})
export class UserMenuComponent {
    readonly userInfo = input<UserInfo | null>(null);
    readonly customActions = input<UserMenuAction[]>([]);

    readonly actionClick = output<string>();

    // 元件本身不管理選單行為，點擊後只把 actionId 往外拋給容器處理。
    onActionClick(actionId: string): void {
        this.actionClick.emit(actionId);
    }
}
