import { Injectable, inject } from '@angular/core';
import { SETTINGS_TABS, SETTINGS_SECTIONS } from '../tokens/settings.tokens';
import { SettingsTab, SettingsSection } from '../models/settings.models';

@Injectable()
export class SettingsRegistryService {
    private readonly rawTabs = inject(SETTINGS_TABS, { optional: true }) ?? [];
    private readonly rawSections = inject(SETTINGS_SECTIONS, { optional: true }) ?? [];

    /**
     * Get all registered tabs, sorted by 'order'
     */
    getTabs(): SettingsTab[] {
        return this.flatten<SettingsTab>(this.rawTabs)
            .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    }

    /**
     * Get all registered sections for a specific tab, sorted by 'order'
     */
    getSectionsByTab(tabId: string): SettingsSection[] {
        return this.flatten<SettingsSection>(this.rawSections)
            .filter(section => section.tabId === tabId)
            .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    }

    private flatten<T>(items: ReadonlyArray<T | ReadonlyArray<T>>): T[] {
        const result: T[] = [];
        items.forEach((item) => {
            if (Array.isArray(item)) {
                result.push(...item);
            } else {
                result.push(item as T);
            }
        });
        return result;
    }
}
