# @cx-rd/ui-kit

Standardized UI component library for Twilight Kepler projects.

## Installation

### 1. Registry Setup
Add the GitHub Packages registry and authentication token to your `.npmrc` before installing the package:

```ini
@cx-rd:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_CLASSIC_TOKEN
```

### 2. Peer Dependencies
This library requires Angular CDK in the consuming project:

```bash
npm install @angular/cdk@19
npm install @cx-rd/ui-kit
```

### 3. Style Integration
Import the library's unified style entry point in your global `styles.scss`:

```scss
@import '@cx-rd/ui-kit/styles/ui-kit';
```

This single import includes:
- Essential CDK overlay styles
- UI-kit design tokens
- Isolated overlay panel configurations

## Overlay Naming Convention
To avoid style pollution, UI-kit uses a `tp-ui-*` prefix for body-appended elements. If you create custom overlays using our tokens, please use:
- `tp-ui-overlay-pane`
- `tp-ui-backdrop`

## Design Tokens
The library provides SCSS variables to maintain consistency. You can override these before importing `ui-kit.scss`:

```scss
$tp-color-primary: #ea580c;
$tp-radius-md: 4px;

@import '@cx-rd/ui-kit/styles/ui-kit';
```

Available modules:
- Colors: `$tp-color-primary`, `$tp-color-secondary`, etc.
- Radius: `$tp-radius-xs` to `$tp-radius-full`
- Shadows: `$tp-shadow-sm` to `$tp-shadow-xl`
- Spacing: `$tp-spacing-xs` to `$tp-spacing-3xl`
- Responsive Sidebar: collapsible with body-appended flyouts
- Z-Index Tokens: range-based layering from 0 to 1500+
- Unified Layout: `MainLayout` integration

## Toast
The library includes a programmatic toast stack for transient feedback.

```ts
import { Component, inject } from '@angular/core';
import { ToastService, ToastViewportComponent } from '@cx-rd/ui-kit';

@Component({
  standalone: true,
  imports: [ToastViewportComponent],
  template: `
    <button type="button" (click)="showSuccess()">Show success</button>
    <button type="button" (click)="runSync()">Run sync</button>
    <lib-toast-viewport />
  `
})
export class ExampleComponent {
  private readonly toast = inject(ToastService);

  showSuccess(): void {
    this.toast.success({
      title: 'Sync complete',
      message: 'Your data has been synced to the cloud.',
      duration: 4000,
      position: 'top-right'
    });
  }

  runSync(): void {
    const loadingId = this.toast.loading({
      title: 'Sync in progress',
      message: 'Fetching the latest records from backend services.'
    });

    fakeAsyncTask()
      .then(() => {
        this.toast.dismiss(loadingId);
        this.toast.success({
          title: 'Sync complete',
          message: 'Your data has been synced to the cloud.'
        });
      })
      .catch(() => {
        this.toast.dismiss(loadingId);
        this.toast.error({
          title: 'Connection lost',
          message: 'Primary service is unreachable. Please retry in a moment.',
          action: { id: 'retry', label: 'Retry', appearance: 'ghost' }
        });
      });
  }
}
```

`loading()` does not auto-close by design. Keep the returned id, call `dismiss(id)` when the async work finishes, and then show the follow-up `success` or `error` toast.

Customizable fields:
- `variant`: `success | error | info | warning | update | loading | neutral`
- `label`, `title`, `message`
- `icon`, `showIcon`, `closable`
- `duration`, `autoClose`, `showProgress`, `position`
- `action`
- `className`
- `styles`: override accent, border, background, text, width, radius, shadow, and more

## Known Limitations
- Overlays such as flyouts and modals are appended to the `body` level to escape local stacking contexts.
