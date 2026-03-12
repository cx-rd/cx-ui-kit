import { InjectionToken } from '@angular/core';
import { SettingsTab, SettingsSection } from '../models/settings.models';

export const SETTINGS_TABS = new InjectionToken<SettingsTab[]>('SETTINGS_TABS');
export const SETTINGS_SECTIONS = new InjectionToken<SettingsSection[]>('SETTINGS_SECTIONS');
