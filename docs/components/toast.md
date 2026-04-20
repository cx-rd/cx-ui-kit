# Toast

`ToastService` and `ToastViewportComponent` provide a programmatic toast stack for transient feedback.

## Import

```ts
import { Component, inject } from '@angular/core';
import { ToastService, ToastViewportComponent } from '@cx-rd/ui-kit';
```

## Example

```ts
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

## Notes

- `loading()` does not auto-close by design.
- Keep the returned id and call `dismiss(id)` when the async work finishes.
- `ToastViewportComponent` handles the visible stack and hover/focus expansion behavior.

## Common Fields

- `variant`: `success | error | info | warning | update | loading | neutral`
- `label`, `title`, `message`
- `icon`, `showIcon`, `closable`
- `duration`, `autoClose`, `showProgress`, `position`
- `action`
- `className`
- `styles`: override accent, border, background, text, width, radius, shadow, and related visual tokens
