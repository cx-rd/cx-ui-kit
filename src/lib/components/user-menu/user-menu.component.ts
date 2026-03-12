import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInfo, UserMenuAction } from '../../core/models';

@Component({
    selector: 'lib-user-menu',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-menu.component.html',
    styleUrl: './user-menu.component.scss'
})
export class UserMenuComponent {
    @Input() userInfo: UserInfo | null = null;
    @Input() customActions: UserMenuAction[] = [];

    @Output() actionClick = new EventEmitter<string>();

    onActionClick(actionId: string) {
        this.actionClick.emit(actionId);
    }
}
