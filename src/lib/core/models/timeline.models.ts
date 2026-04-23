import { TemplateRef } from '@angular/core';

export type TimelineItemId = string | number;

export type TimelineLayout = 'stacked' | 'alternate';

export type TimelineDensity = 'comfortable' | 'compact';

export type TimelineMarkerAnimation = 'none' | 'pulse' | 'ripple' | 'beam';

export type TimelineItemStatus = 'neutral' | 'active' | 'complete' | 'warning' | 'error' | 'disabled';

export type TimelineItemTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export type TimelineItemPosition = 'start' | 'end';

export interface TimelineItem {
    id?: TimelineItemId;
    title: string;
    description?: string;
    timestamp?: string | Date;
    eyebrow?: string;
    badge?: string;
    icon?: string;
    status?: TimelineItemStatus;
    tone?: TimelineItemTone;
    disabled?: boolean;
    meta?: Record<string, unknown>;
}

export interface TimelineItemContext {
    $implicit: TimelineItem;
    item: TimelineItem;
    index: number;
    status: TimelineItemStatus;
    tone: TimelineItemTone;
    position: TimelineItemPosition;
    isActive: boolean;
    isDisabled: boolean;
}

export interface TimelineItemSelect {
    index: number;
    id: TimelineItemId | null;
    item: TimelineItem;
    previousActiveIndex: number | null;
    event: MouseEvent | KeyboardEvent;
}

export type TimelineItemTemplate = TemplateRef<TimelineItemContext>;
