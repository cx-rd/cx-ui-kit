# SelectList

`SelectListComponent` supports single or multi selection with static options, async search, and async paging.

## Import

```ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  SelectListComponent,
  SelectListDataSource,
  SelectListOption
} from '@cx-rd/ui-kit';
```

## Example

```ts
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

## Common Inputs

- `label`, `hint`, `placeholder`, `searchPlaceholder`
- `selectionMode`, `showSelectAll`, `visibleSelectionLimit`, `maxSelections`
- `panelMode`, `inlinePanelPlacement`
- `options` for local data
- `dataSource` for seeded async options, debounced remote search, and paging
- `compareWith` when values are objects instead of primitives

`inlinePanelPlacement` supports `below | above | auto`.

## Outputs

- `selectionChange`
- `searchChange`
- `openedChange`

## Notes

- Use `panelMode="inline"` when the dropdown should stay inside a local layout container instead of rendering into the global overlay container.
- Async data contracts are generic, so the option value type can stay aligned with your model.
