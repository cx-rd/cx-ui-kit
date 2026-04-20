# Paginator

`PaginatorComponent` is a standalone pagination control that can be used inside or outside `DataTableComponent`.

## Import

```ts
import { Component } from '@angular/core';
import { PaginatorComponent, DataTablePageChange } from '@cx-rd/ui-kit';
```

## Example

```ts
@Component({
  standalone: true,
  imports: [PaginatorComponent],
  template: `
    <lib-paginator
      [pageIndex]="pageIndex"
      [pageSize]="pageSize"
      [totalItems]="totalItems"
      [maxVisiblePages]="7"
      (pageChange)="onPageChange($event)">
    </lib-paginator>
  `
})
export class ExampleComponent {
  pageIndex = 0;
  pageSize = 20;
  totalItems = 240;

  onPageChange(event: DataTablePageChange): void {
    this.pageIndex = event.pageIndex;
  }
}
```

## Common Inputs

- `pageIndex`, `pageSize`, `totalItems`
- `maxVisiblePages`
- `showBoundaryButtons`
- `previousLabel`, `nextLabel`, `firstLabel`, `lastLabel`
- `ariaLabel`

## Outputs

- `pageChange`

## Notes

- The emitted `pageChange` payload includes `pageIndex`, `pageSize`, `totalItems`, `pageCount`, `startIndex`, and `endIndex`.
- `DataTableComponent` uses this component internally for footer pagination.
