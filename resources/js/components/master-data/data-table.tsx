import { useEffect, useState } from "react";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type PaginationState,
    type SortingState,
} from "@tanstack/react-table";

import type { DataTableProps } from "@/types/master-data";

export function DataTable<TData>({
    data,
    columns,
    pagination,
    search,
    onSearchChange,
    onPaginationChange,
    onSortingChange,
    loading = false,
}: DataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [paginationState, setPaginationState] = useState<PaginationState>({
        pageIndex: pagination.current_page - 1,
        pageSize: pagination.per_page,
    });

    useEffect(() => {
        setPaginationState({
            pageIndex: pagination.current_page - 1,
            pageSize: pagination.per_page,
        });
    }, [pagination.current_page, pagination.per_page]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination: paginationState,
        },
        pageCount: pagination.last_page,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        enableMultiSort: false,

        onSortingChange: (updater) => {
            const next =
                typeof updater === "function" ? updater(sorting) : updater;

            setSorting(next);
            onSortingChange(next);
        },

        onPaginationChange: (updater) => {
            const next =
                typeof updater === "function"
                    ? updater(paginationState)
                    : updater;

            setPaginationState(next);
            onPaginationChange(next);
        },

        getCoreRowModel: getCoreRowModel(),
    });

    const start = pagination.from ?? 0;
    const end = pagination.to ?? 0;

    return (
        <div className="w-full min-w-0 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Cari data..."
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        Total {pagination.total} data
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="w-full min-w-0 overflow-hidden rounded-lg border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="bg-muted/50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        const sorted =
                                            header.column.getIsSorted();

                                        return (
                                            <th
                                                key={header.id}
                                                className="h-11 px-4 text-left align-middle font-medium text-muted-foreground"
                                            >
                                                {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                                    <button
                                                        type="button"
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        className="inline-flex items-center gap-2"
                                                    >
                                                        {flexRender(
                                                            header.column
                                                                .columnDef
                                                                .header,
                                                            header.getContext(),
                                                        )}

                                                        {header.column.getIsSorted() ===
                                                            "asc" && "↑"}
                                                        {header.column.getIsSorted() ===
                                                            "desc" && "↓"}
                                                    </button>
                                                ) : (
                                                    flexRender(
                                                        header.column.columnDef
                                                            .header,
                                                        header.getContext(),
                                                    )
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-t border-border transition-colors hover:bg-muted/40"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="px-4 py-3 align-middle"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Information */}
                <p className="text-xs text-muted-foreground sm:text-sm">
                    Menampilkan{" "}
                    <span className="font-medium text-foreground">
                        {start}–{end}
                    </span>{" "}
                    dari{" "}
                    <span className="font-medium text-foreground">
                        {pagination.total}
                    </span>{" "}
                    data
                </p>

                {/* Pagination Controls */}
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <select
                        value={paginationState.pageSize}
                        onChange={(event) =>
                            table.setPageSize(Number(event.target.value))
                        }
                        className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs sm:flex-none sm:text-sm"
                    >
                        {[10, 25, 50, 100].map((size) => (
                            <option key={size} value={size}>
                                {size} / halaman
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-9 shrink-0 rounded-md border border-border px-2 text-xs transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50 sm:px-3 sm:text-sm"
                    >
                        Sebelumnya
                    </button>

                    <span className="shrink-0 text-center text-xs text-muted-foreground sm:min-w-16 sm:text-sm">
                        {pagination.current_page}/{pagination.last_page}
                    </span>

                    <button
                        type="button"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-9 shrink-0 rounded-md border border-border px-2 text-xs transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50 sm:px-3 sm:text-sm"
                    >
                        Berikutnya
                    </button>
                </div>
            </div>
        </div>
    );
}
