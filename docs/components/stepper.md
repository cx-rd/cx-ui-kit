# Stepper

`StepperComponent` renders a horizontal or vertical progress sequence with selectable current-step animations.

## Highlights

- Horizontal or vertical orientation
- Automatic completed-state inference for steps before `activeIndex`
- Optional step selection with `stepChange` events
- Per-step `pending`, `complete`, `error`, and `disabled` states
- Current-step animation choices: `pulse`, `orbit`, `glow`, or `none`

## Import

```ts
import { Component } from '@angular/core';
import { StepperComponent, StepperCurrentAnimation, StepperStep, StepperStepChange } from '@cx-rd/ui-kit';
```

## Example

```ts
@Component({
  standalone: true,
  imports: [StepperComponent],
  template: `
    <lib-stepper
      ariaLabel="Release workflow"
      [steps]="steps"
      [activeIndex]="activeIndex"
      [selectable]="true"
      [currentAnimation]="animation"
      (stepChange)="onStepChange($event)">
    </lib-stepper>
  `
})
export class ExampleComponent {
  activeIndex = 1;
  animation: StepperCurrentAnimation = 'orbit';

  steps: StepperStep[] = [
    { id: 'brief', label: 'Brief', description: 'Confirm requirements' },
    { id: 'build', label: 'Build', description: 'Implement the flow' },
    { id: 'review', label: 'Review', description: 'Validate before release' },
    { id: 'ship', label: 'Ship', description: 'Publish to production' }
  ];

  onStepChange(event: StepperStepChange): void {
    this.activeIndex = event.index;
  }
}
```

## Common Inputs

- `steps`: `StepperStep[]`
- `activeIndex`: zero-based current step index
- `orientation`: `horizontal` or `vertical`
- `currentAnimation`: `pulse`, `orbit`, `glow`, or `none`
- `selectable`: emits `stepChange` when users click enabled steps
- `showDescriptions`: toggles step descriptions
- `ariaLabel`: accessible label for the stepper navigation

`steps` has no fixed limit. Pass any `StepperStep[]` length that fits the product flow; the demo data uses different lengths only as examples.

## Outputs

- `stepChange`: emits `previousIndex`, `index`, `direction`, and `step`

## Step Status

Use `status` when a step needs explicit state:

```ts
const steps: StepperStep[] = [
  { label: 'Brief', status: 'complete' },
  { label: 'Build' },
  { label: 'Review', status: 'error' },
  { label: 'Ship', status: 'disabled' }
];
```

When `status` is omitted, steps before `activeIndex` render as `complete`; the active and future steps render as pending, with the active step highlighted separately.

## Animation Selection

Set `currentAnimation` to choose how the current step is emphasized:

- `pulse`: expanding pulse ring
- `orbit`: subtle comet-tail orbit
- `glow`: soft halo that fades outward
- `none`: no motion

Animations respect `prefers-reduced-motion` by reducing motion duration.
