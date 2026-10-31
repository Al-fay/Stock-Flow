import type {
    ColumnDef,
    PaginationState,
    SortingState,
} from "@tanstack/react-table";

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface DataTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    pagination: PaginatedData<TData>;
    search: string;
    onSearchChange: (value: string) => void;
    onPaginationChange: (pagination: PaginationState) => void;
    onSortingChange: (sorting: SortingState) => void;
    loading?: boolean;
}
