export interface UserMenuAction {
    id: string;
    label: string;
    icon: string;
    color?: string; // Optional CSS color value for the icon
}

export interface UserInfo {
    name: string;
    email: string;
    avatarUrl?: string;
}
