import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    booleanAttribute,
    computed,
    input,
    numberAttribute,
    output
} from '@angular/core';
import {
    TimelineDensity,
    TimelineItem,
    TimelineItemContext,
    TimelineItemId,
    TimelineItemPosition,
    TimelineItemSelect,
    TimelineItemStatus,
    TimelineItemTemplate,
    TimelineItemTone,
    TimelineLayout,
    TimelineMarkerAnimation
} from '../../core/models';

interface ResolvedTimelineItem {
    key: string;
    index: number;
    item: TimelineItem;
    title: string;
    description: string | null;
    eyebrow: string | null;
    timestampText: string | null;
    timestampDateTime: string | null;
    badgeLabel: string | null;
    status: TimelineItemStatus;
    tone: TimelineItemTone;
    position: TimelineItemPosition;
    isActive: boolean;
    isDisabled: boolean;
    isConnectorComplete: boolean;
    ariaLabel: string;
    context: TimelineItemContext;
}

const TIMELINE_LAYOUTS = new Set<TimelineLayout>(['stacked', 'alternate']);
const TIMELINE_DENSITIES = new Set<TimelineDensity>(['comfortable', 'compact']);
const TIMELINE_ANIMATIONS = new Set<TimelineMarkerAnimation>(['none', 'pulse', 'ripple', 'beam']);
const TIMELINE_STATUSES = new Set<TimelineItemStatus>([
    'neutral',
    'active',
    'complete',
    'warning',
    'error',
    'disabled'
]);
const TIMELINE_TONES = new Set<TimelineItemTone>(['primary', 'success', 'warning', 'error', 'neutral']);

function optionalNumberAttribute(value: number | string | null | undefined): number | null {
    return value == null || value === '' ? null : numberAttribute(value);
}

@Component({
    selector: 'lib-timeline',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './timeline.component.html',
    styleUrl: './timeline.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent {
    readonly items = input<ReadonlyArray<TimelineItem>>([]);
    readonly activeIndex = input<number | null, number | string | null | undefined>(null, {
        transform: optionalNumberAttribute
    });
    readonly layout = input<TimelineLayout>('stacked');
    readonly density = input<TimelineDensity>('comfortable');
    readonly markerAnimation = input<TimelineMarkerAnimation>('none');
    readonly selectable = input(false, { transform: booleanAttribute });
    readonly showConnectors = input(true, { transform: booleanAttribute });
    readonly showTimestamps = input(true, { transform: booleanAttribute });
    readonly showDescriptions = input(true, { transform: booleanAttribute });
    readonly showBadges = input(true, { transform: booleanAttribute });
    readonly ariaLabel = input('Timeline');
    readonly emptyStateLabel = input('No timeline items available.');
    readonly itemTemplate = input<TimelineItemTemplate | null>(null);
    readonly markerTemplate = input<TimelineItemTemplate | null>(null);

    readonly itemSelect = output<TimelineItemSelect>();

    readonly resolvedItems = computed<ResolvedTimelineItem[]>(() => {
        const items = this.items();
        const activeIndex = this.resolvedActiveIndex();

        return items.map((item, index) => this.resolveItem(item, index, activeIndex));
    });

    readonly resolvedActiveIndex = computed<number | null>(() => {
        const activeIndex = this.activeIndex();
        const itemCount = this.items().length;

        if (itemCount <= 0 || activeIndex == null || !Number.isFinite(activeIndex)) {
            return null;
        }

        return Math.min(Math.max(0, Math.floor(activeIndex)), itemCount - 1);
    });

    get resolvedLayout(): TimelineLayout {
        const layout = this.layout();

        return TIMELINE_LAYOUTS.has(layout) ? layout : 'stacked';
    }

    get resolvedDensity(): TimelineDensity {
        const density = this.density();

        return TIMELINE_DENSITIES.has(density) ? density : 'comfortable';
    }

    get resolvedMarkerAnimation(): TimelineMarkerAnimation {
        const animation = this.markerAnimation();

        return TIMELINE_ANIMATIONS.has(animation) ? animation : 'pulse';
    }

    isInteractive(item: ResolvedTimelineItem): boolean {
        return this.selectable() && !item.isDisabled;
    }

    selectItem(item: ResolvedTimelineItem, event: MouseEvent | KeyboardEvent): void {
        if (!this.isInteractive(item)) {
            return;
        }

        this.itemSelect.emit({
            index: item.index,
            id: item.item.id ?? null,
            item: item.item,
            previousActiveIndex: this.resolvedActiveIndex(),
            event
        });
    }

    private resolveItem(
        item: TimelineItem,
        index: number,
        activeIndex: number | null
    ): ResolvedTimelineItem {
        const status = this.resolveStatus(item, index, activeIndex);
        const tone = this.resolveTone(item, status);
        const position = this.resolvePosition(index);
        const isActive = status === 'active' || activeIndex === index;
        const isDisabled = item.disabled === true || status === 'disabled';
        const title = item.title || `Timeline item ${index + 1}`;
        const timestampText = this.resolveTimestampText(item.timestamp);
        const timestampDateTime = this.resolveTimestampDateTime(item.timestamp);
        const badgeLabel = this.resolveBadgeLabel(item, status);
        const context: TimelineItemContext = {
            $implicit: item,
            item,
            index,
            status,
            tone,
            position,
            isActive,
            isDisabled
        };

        return {
            key: item.id == null ? String(index) : String(item.id),
            index,
            item,
            title,
            description: item.description ?? null,
            eyebrow: item.eyebrow ?? null,
            timestampText,
            timestampDateTime,
            badgeLabel,
            status,
            tone,
            position,
            isActive,
            isDisabled,
            isConnectorComplete: this.resolveConnectorComplete(status, index, activeIndex),
            ariaLabel: this.resolveAriaLabel(title, timestampText, status, isActive),
            context
        };
    }

    private resolveStatus(
        item: TimelineItem,
        index: number,
        activeIndex: number | null
    ): TimelineItemStatus {
        if (item.disabled) {
            return 'disabled';
        }

        if (item.status && TIMELINE_STATUSES.has(item.status)) {
            return item.status;
        }

        return activeIndex === index ? 'active' : 'neutral';
    }

    private resolveTone(item: TimelineItem, status: TimelineItemStatus): TimelineItemTone {
        if (item.tone && TIMELINE_TONES.has(item.tone)) {
            return item.tone;
        }

        switch (status) {
            case 'active':
                return 'primary';
            case 'complete':
                return 'success';
            case 'warning':
                return 'warning';
            case 'error':
                return 'error';
            case 'disabled':
            case 'neutral':
            default:
                return 'neutral';
        }
    }

    private resolvePosition(index: number): TimelineItemPosition {
        return this.resolvedLayout === 'alternate' && index % 2 === 1 ? 'end' : 'start';
    }

    private resolveConnectorComplete(
        status: TimelineItemStatus,
        index: number,
        activeIndex: number | null
    ): boolean {
        return status === 'complete' || (activeIndex != null && index < activeIndex);
    }

    private resolveBadgeLabel(item: TimelineItem, status: TimelineItemStatus): string | null {
        if (item.badge) {
            return item.badge;
        }

        if (status === 'neutral') {
            return null;
        }

        return this.resolveStatusLabel(status);
    }

    private resolveStatusLabel(status: TimelineItemStatus): string {
        switch (status) {
            case 'active':
                return 'Active';
            case 'complete':
                return 'Complete';
            case 'warning':
                return 'Attention';
            case 'error':
                return 'Error';
            case 'disabled':
                return 'Disabled';
            case 'neutral':
            default:
                return 'Update';
        }
    }

    private resolveAriaLabel(
        title: string,
        timestampText: string | null,
        status: TimelineItemStatus,
        isActive: boolean
    ): string {
        const parts = [title];

        if (timestampText) {
            parts.push(timestampText);
        }

        parts.push(isActive ? 'current item' : this.resolveStatusLabel(status).toLowerCase());

        return parts.join(', ');
    }

    private resolveTimestampText(timestamp: TimelineItem['timestamp']): string | null {
        if (!timestamp) {
            return null;
        }

        return timestamp instanceof Date ? timestamp.toLocaleString() : timestamp;
    }

    private resolveTimestampDateTime(timestamp: TimelineItem['timestamp']): string | null {
        if (!timestamp) {
            return null;
        }

        return timestamp instanceof Date ? timestamp.toISOString() : timestamp;
    }
}
