import { Observable } from 'rxjs';

export type SelectListSelectionMode = 'single' | 'multi';

export type SelectListDataMode = 'static' | 'async';

export type SelectListCompareWith<T = unknown> = (left: T | null | undefined, right: T | null | undefined) => boolean;

export interface SelectListOption<T = unknown> {
    id?: string;
    value: T;
    label: string;
    caption?: string;
    group?: string;
    icon?: string;
    disabled?: boolean;
    keywords?: string[];
    meta?: Record<string, unknown>;
}

export interface SelectListAsyncQuery<T = unknown> {
    query: string;
    page: number;
    selectedOptions: SelectListOption<T>[];
}

export interface SelectListAsyncResult<T = unknown> {
    options: SelectListOption<T>[];
    hasMore?: boolean;
    total?: number;
}

export type SelectListAsyncLoaderResponse<T = unknown> =
    | SelectListAsyncResult<T>
    | SelectListOption<T>[];

export type SelectListAsyncLoader<T = unknown> = (
    context: SelectListAsyncQuery<T>
) =>
    | Observable<SelectListAsyncLoaderResponse<T>>
    | Promise<SelectListAsyncLoaderResponse<T>>
    | SelectListAsyncLoaderResponse<T>;

export interface SelectListDataSource<T = unknown> {
    options?: SelectListOption<T>[];
    asyncLoader?: SelectListAsyncLoader<T>;
    debounceMs?: number;
    minQueryLength?: number;
}

export interface SelectListSelectionChange<T = unknown> {
    mode: SelectListSelectionMode;
    value: T | T[] | null;
    values: T[];
    option: SelectListOption<T> | null;
    options: SelectListOption<T>[];
}

export interface SelectListSearchChange {
    query: string;
}
