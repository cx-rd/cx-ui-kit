export interface SettingsTab {
    id: string;
    label: string;
    order?: number;
}

export interface SettingsSection {
    id: string;
    label: string;
    tabId: string;
    icon?: string;
    order?: number;
    component?: any; // Standalone component class
}

export interface SettingsContent {
    id: string;
    title: string;
    description?: string;
}
