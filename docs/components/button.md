# Button

`ButtonComponent` provides a standalone UI-kit button with built-in visual hover and active states. Product teams can attach their own behavior to hover and active transitions through output events.

## Highlights

- Variants: `primary`, `secondary`, `outline`, `ghost`, and `danger`
- Sizes: `sm`, `md`, and `lg`
- Native button types: `button`, `submit`, and `reset`
- Optional full-width layout
- `hoverChange` and `activeChange` outputs for project-owned interaction behavior
- CSS custom properties for project-level hover and active styling overrides

## Import

```ts
import { Component } from '@angular/core';
import { ButtonActiveChange, ButtonComponent, ButtonHoverChange } from '@cx-rd/ui-kit';
```

## Example

```ts
@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <lib-button
      variant="primary"
      size="md"
      (click)="save()"
      (hoverChange)="onButtonHover($event)"
      (activeChange)="onButtonActive($event)">
      Save changes
    </lib-button>
  `
})
export class ExampleComponent {
  save(): void {
    // project-owned click behavior
  }

  onButtonHover(event: ButtonHoverChange): void {
    console.log('hovering', event.hovering);
  }

  onButtonActive(event: ButtonActiveChange): void {
    console.log('active', event.active);
  }
}
```

## Common Inputs

- `variant`: `primary`, `secondary`, `outline`, `ghost`, or `danger`
- `size`: `sm`, `md`, or `lg`
- `type`: `button`, `submit`, or `reset`
- `disabled`
- `fullWidth`
- `ariaLabel`
- `pressed`: sets `aria-pressed` for toggle button usage

## Outputs

- `hoverChange`: emits `{ hovering, event }` when pointer hover starts or ends
- `activeChange`: emits `{ active, event }` when pointer or Space/Enter keyboard active state starts or ends

## Custom Hover And Active Styling

Set CSS custom properties on `lib-button` from the consuming project:

```scss
lib-button.product-save-button {
  --lib-button-bg: #0f766e;
  --lib-button-hover-bg: #115e59;
  --lib-button-active-bg: #134e4a;
  --lib-button-focus-shadow: 0 0 0 4px rgba(15, 118, 110, 0.18);
}
```

Use outputs when hover or active should trigger project logic such as analytics, previews, or contextual help. Keep domain behavior in the consuming app instead of the UI-kit button.
