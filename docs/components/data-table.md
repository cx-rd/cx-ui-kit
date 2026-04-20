# DataTable

`DataTableComponent` covers the common list view baseline without forcing every screen into the same data-loading strategy.

## Highlights

- Client or manual sorting
- Client or manual pagination
- Optional single or multiple row selection
- Built-in page-size selector, range summary, and paginator footer
- Loading and empty states
- Custom header and cell templates for advanced rendering

## Import

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
```

## Example

```ts
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
  }

  onSelectionChange(event: DataTableSelectionChange<UserRow>): void {
    console.log(event);
  }
}
```

## Common Inputs

- `columns`, `items`, `rowId`
- `selectionMode`, `selectedRowIds`, `isRowSelectable`
- `sortMode`, `sortState`
- `paginationMode`, `pageIndex`, `pageSize`, `pageSizeOptions`, `totalItems`
- `stickyHeader`, `dense`, `loading`, `emptyStateLabel`

## Outputs

- `selectedRowIdsChange`
- `selectionChange`
- `sortChange`
- `pageChange`

## Notes

- Use `sortMode="manual"` when sorting is owned by the server.
- Use `paginationMode="manual"` when the parent container fetches paged results.
- `DataTable` reuses `SelectList` for the page-size selector.
