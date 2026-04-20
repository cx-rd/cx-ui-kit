# @cx-rd/ui-kit

Standardized UI component library for Twilight Kepler projects.

Additional package docs:
- `CHANGELOG.md` for release history
- `RELEASE.md` for the manual release workflow

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
npm install @angular/cdk@21
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

## SelectList
`SelectListComponent` is designed around two orthogonal concerns so new select patterns can be added without breaking old consumers:
- `selectionMode`: `single | multi`
- `dataSource`: static options, async search, or async paging

```ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  SelectListComponent,
  SelectListDataSource,
  SelectListOption
} from '@cx-rd/ui-kit';

const projectOptions: SelectListOption<string>[] = [
  { value: 'core', label: 'Core Platform', caption: 'Shared backend services' },
  { value: 'portal', label: 'Portal UI', caption: 'Angular workspace and design system' }
];

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SelectListComponent],
  template: `
    <lib-select-list
      label="Project"
      placeholder="Choose a project"
      [options]="projectOptions"
      [formControl]="projectControl">
    </lib-select-list>

    <lib-select-list
      label="Capabilities"
      placeholder="Choose capabilities"
      selectionMode="multi"
      [options]="capabilityOptions"
      [showSelectAll]="true"
      [formControl]="capabilityControl">
    </lib-select-list>

    <lib-select-list
      label="Reviewers"
      placeholder="Search teammates"
      selectionMode="multi"
      [dataSource]="reviewerSource"
      [formControl]="reviewerControl">
    </lib-select-list>
  `
})
export class ExampleComponent {
  readonly projectOptions = projectOptions;
  readonly capabilityOptions: SelectListOption<string>[] = [
    { value: 'design-system', label: 'Design System' },
    { value: 'audit-trail', label: 'Audit Trail' }
  ];

  readonly projectControl = new FormControl<string | null>('portal');
  readonly capabilityControl = new FormControl<string[]>(['design-system'], { nonNullable: true });
  readonly reviewerControl = new FormControl<string[]>([], { nonNullable: true });

  readonly reviewerSource: SelectListDataSource<string> = {
    debounceMs: 250,
    minQueryLength: 1,
    asyncLoader: async ({ query, page }) => fetchRemoteReviewers(query, page)
  };
}
```

Useful inputs:
- `label`, `hint`, `placeholder`, `searchPlaceholder`
- `selectionMode`, `showSelectAll`, `visibleSelectionLimit`, `maxSelections`
- `panelMode`, `inlinePanelPlacement` for embedded layouts that should open within the local container instead of body overlay
  `inlinePanelPlacement` supports `below | above | auto`
- `options` for local data
- `dataSource` for seeded async options, debounced remote search, and paging
- `compareWith` when values are objects instead of primitives

Useful outputs:
- `selectionChange`
- `searchChange`
- `openedChange`

## DataTable
`DataTableComponent` covers the common list view baseline without forcing every screen into the same data-loading strategy:
- Client or manual sorting
- Client or manual pagination
- Optional single or multiple row selection
- Built-in page-size selector, range summary, and paginator footer
- Loading / empty states
- Custom header and cell templates for advanced rendering

```ts
import { Component, TemplateRef, ViewChild } from '@angular/core';
import {
  DataTableCellContext,
  DataTableColumn,
  DataTableComponent,
  DataTablePageChange,
  DataTableSelectionChange,
  DataTableSortState
} from '@cx-rd/ui-kit';

interface UserRow {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'invited';
}

@Component({
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <ng-template #statusCell let-row let-value="value">
      <span class="status-chip" [class.status-chip--active]="value === 'active'">
        {{ row.status }}
      </span>
    </ng-template>

    <lib-data-table
      caption="Team members"
      ariaLabel="Team members table"
      rowId="id"
      selectionMode="multiple"
      [columns]="columns"
      [items]="rows"
      [pageSize]="10"
      [pageSizeOptions]="[10, 20, 50]"
      (sortChange)="onSortChange($event)"
      (pageChange)="onPageChange($event)"
      (selectionChange)="onSelectionChange($event)">
    </lib-data-table>
  `
})
export class ExampleComponent {
  @ViewChild('statusCell', { static: true }) statusCell!: TemplateRef<DataTableCellContext<UserRow>>;

  rows: UserRow[] = [
    { id: 1, name: 'Aria Young', email: 'aria@acme.dev', status: 'active' },
    { id: 2, name: 'Milo Chen', email: 'milo@acme.dev', status: 'invited' }
  ];

  get columns(): DataTableColumn<UserRow>[] {
    return [
      { id: 'name', header: 'Name', sortable: true, minWidth: '180px' },
      { id: 'email', header: 'Email', sortable: true, minWidth: '220px' },
      { id: 'status', header: 'Status', cellTemplate: this.statusCell, nowrap: true }
    ];
  }

  onSortChange(sort: DataTableSortState | null): void {
    console.log(sort);
  }

  onPageChange(event: DataTablePageChange): void {
    console.log(event);
    // Fetch the next page if you use manual pagination.
  }

  onSelectionChange(event: DataTableSelectionChange<UserRow>): void {
    console.log(event);
    // Handle selected row ids or row payloads.
  }
}
```

Useful inputs:
- `columns`, `items`, `rowId`
- `selectionMode`, `selectedRowIds`, `isRowSelectable`
- `sortMode`, `sortState`
- `paginationMode`, `pageIndex`, `pageSize`, `pageSizeOptions`, `totalItems`
- `stickyHeader`, `dense`, `loading`, `emptyStateLabel`

Useful outputs:
- `selectedRowIdsChange`
- `selectionChange`
- `sortChange`
- `pageChange`

## Known Limitations
- Overlays such as flyouts and modals are appended to the `body` level to escape local stacking contexts.
