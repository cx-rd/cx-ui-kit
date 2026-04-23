# Timeline

`TimelineComponent` renders event history, audit trails, approval logs, and activity feeds as a standalone UI-kit component.

## Highlights

- Data-driven timeline items with title, description, timestamp, eyebrow, and badge
- Saturated status dots as the default marker treatment, so Timeline does not look like Stepper
- `stacked` and `alternate` layouts
- `comfortable` and `compact` density modes
- Per-item `neutral`, `active`, `complete`, `warning`, `error`, and `disabled` states
- Optional selectable markers with `itemSelect` events
- Optional marker animation choices: `none`, `pulse`, `ripple`, or `beam`
- Optional `itemTemplate` hook for project-specific content
- Optional `markerTemplate` hook for domain-specific marker content, while the default UI-kit marker stays a dot

## Import

```ts
import { Component } from '@angular/core';
import {
  TimelineComponent,
  TimelineItem,
  TimelineItemSelect,
  TimelineLayout,
  TimelineMarkerAnimation
} from '@cx-rd/ui-kit';
```

## Example

```ts
@Component({
  standalone: true,
  imports: [TimelineComponent],
  template: `
    <lib-timeline
      ariaLabel="Release audit timeline"
      [items]="items"
      [activeIndex]="activeIndex"
      layout="alternate"
      markerAnimation="ripple"
      [selectable]="true"
      (itemSelect)="onItemSelect($event)">
    </lib-timeline>
  `
})
export class ExampleComponent {
  activeIndex = 2;

  items: TimelineItem[] = [
    {
      id: 'brief',
      title: 'Brief approved',
      description: 'Scope and acceptance criteria were confirmed.',
      timestamp: '09:10',
      status: 'complete'
    },
    {
      id: 'build',
      title: 'Build started',
      description: 'Implementation moved into the active sprint.',
      timestamp: '10:35',
      status: 'complete'
    },
    {
      id: 'review',
      title: 'Security review',
      description: 'Waiting for reviewer approval before rollout.',
      timestamp: '14:20',
      status: 'active',
      badge: 'In review'
    }
  ];

  onItemSelect(event: TimelineItemSelect): void {
    this.activeIndex = event.index;
  }
}
```

## Common Inputs

- `items`: `TimelineItem[]`
- `activeIndex`: zero-based current item index; used for `aria-current`, selection context, and optional active-marker animation
- `layout`: `stacked` or `alternate`
- `density`: `comfortable` or `compact`
- `markerAnimation`: `none`, `pulse`, `ripple`, or `beam`; defaults to `none` so records do not look like progress steps
- `selectable`: renders interactive markers and emits `itemSelect`
- `showConnectors`: toggles the vertical connector line
- `showTimestamps`: toggles timestamp rendering
- `showDescriptions`: toggles descriptions
- `showBadges`: toggles status or custom badges
- `ariaLabel`: accessible label for the timeline region
- `emptyStateLabel`: message when `items` is empty
- `itemTemplate`: optional `TemplateRef<TimelineItemContext>` for custom item body
- `markerTemplate`: optional `TemplateRef<TimelineItemContext>` for custom marker content

## Outputs

- `itemSelect`: emits `index`, `id`, `item`, `previousActiveIndex`, and the source DOM event

## Item Status

Use `status` for explicit state:

```ts
const items: TimelineItem[] = [
  { title: 'Draft created', status: 'complete' },
  { title: 'Review pending', status: 'active' },
  { title: 'Policy exception', status: 'warning' },
  { title: 'Rollout failed', status: 'error' },
  { title: 'Archive task', status: 'disabled', disabled: true }
];
```

If `status` is omitted and `activeIndex` matches the item index, the component treats that item as active. Other items default to `neutral`.

## Template Hooks

Use templates when a product timeline needs richer content while keeping UI-kit ownership of layout, spacing, default dots, connectors, and motion.

```html
<ng-template #itemTemplate let-item let-index="index" let-status="status">
  <strong>{{ index + 1 }}. {{ item.title }}</strong>
  <p>{{ item.description }}</p>
  <small>Status: {{ status }}</small>
</ng-template>

<lib-timeline
  [items]="items"
  [itemTemplate]="itemTemplate">
</lib-timeline>
```

Use `markerTemplate` only when the marker itself carries domain meaning, for example logistics events that need package, truck, or checkpoint icons. If omitted, UI-kit renders the default dot.

```html
<ng-template #markerTemplate let-item>
  <span class="material-icons" aria-hidden="true">
    {{ item.icon || 'radio_button_checked' }}
  </span>
</ng-template>

<lib-timeline
  [items]="items"
  [markerTemplate]="markerTemplate">
</lib-timeline>
```

Avoid placing interactive controls inside `itemTemplate` when `selectable` is enabled unless those controls stop event propagation intentionally.

The default marker is intentionally a same-sized saturated dot inside a circular outline. Avoid switching it back to numbers for normal timelines, because numbered markers make the component read as a stepper.

## Animation Selection

- `none`: no motion
- `pulse`: expanding ring around the active marker
- `ripple`: layered soft halo around the active marker
- `beam`: animated connector beam below the active marker

Animations respect `prefers-reduced-motion`.

## What Is Required vs Optional

Required for a useful timeline:

- `items` with at least `title`
- A stable `id` when items can be reordered
- `ariaLabel` when multiple timelines can appear on the same page

Optional per project:

- `activeIndex` for selection context, `aria-current`, or optional animation targeting
- `selectable` and `itemSelect` when users can jump to an event
- `layout="alternate"` for wide editorial or audit pages
- `density="compact"` for side panels and dashboards
- `itemTemplate` for domain-rich cards
- `markerTemplate` for domain marker icons, such as logistics checkpoints
- `markerAnimation` only when a product explicitly wants to emphasize a selected record
