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

    onActionClick(actionId: string): void {
        this.actionClick.emit(actionId);
    }
}
