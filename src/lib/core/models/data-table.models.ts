import { TemplateRef } from '@angular/core';

export type DataTableRowId = string | number;

export type DataTableSelectionMode = 'none' | 'single' | 'multiple';

export type DataTableSortMode = 'client' | 'manual';

export type DataTablePaginationMode = 'client' | 'manual';

export type DataTableColumnAlign = 'start' | 'center' | 'end';

export type DataTableSortDirection = 'asc' | 'desc';

export type DataTableSortableValue = string | number | boolean | Date | null | undefined;

export type DataTableAccessor<T = unknown, TValue = unknown> =
    | keyof T
    | string
    | ((row: T, rowIndex: number) => TValue);

export type DataTableTrackBy<T = unknown> =
    | keyof T
    | string
    | ((row: T, rowIndex: number) => DataTableRowId);

export type DataTableRowSelectable<T = unknown> = (row: T, rowIndex: number) => boolean;

export interface DataTableSortState {
    columnId: string;
    direction: DataTableSortDirection;
}

export interface DataTablePageChange {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    pageCount: number;
    startIndex: number;
    endIndex: number;
}

export interface DataTableCellContext<T = unknown> {
    $implicit: T;
    row: T;
    column: DataTableColumn<T>;
    value: unknown;
    rowIndex: number;
    rowKey: DataTableRowId;
}

export interface DataTableHeaderContext<T = unknown> {
    $implicit: DataTableColumn<T>;
    column: DataTableColumn<T>;
    sort: DataTableSortState | null;
}

export interface DataTableColumn<T = unknown> {
    id: string;
    header: string;
    accessor?: DataTableAccessor<T>;
    sortAccessor?: DataTableAccessor<T, DataTableSortableValue>;
    sortable?: boolean;
    align?: DataTableColumnAlign;
    width?: string;
    minWidth?: string;
    nowrap?: boolean;
    headerClass?: string;
    cellClass?: string | ((row: T, rowIndex: number) => string | null | undefined);
    headerTemplate?: TemplateRef<DataTableHeaderContext<T>>;
    cellTemplate?: TemplateRef<DataTableCellContext<T>>;
    valueFormatter?: (value: unknown, row: T, column: DataTableColumn<T>) => string;
    meta?: Record<string, unknown>;
}

export interface DataTableSelectionChange<T = unknown> {
    mode: Exclude<DataTableSelectionMode, 'none'>;
    keys: DataTableRowId[];
    rows: T[];
    allVisibleSelected: boolean;
    indeterminate: boolean;
}
