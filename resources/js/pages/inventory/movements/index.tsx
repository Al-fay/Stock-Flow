import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    RefreshCcw,
    Search,
    Package,
    AlertTriangle,
} from "lucide-react";

import { DataTable } from "@/components/master-data/data-table";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";

interface Unit {
    id: number;
    name: string;
    symbol: string;
}

interface Product {
    id: number;
    sku: string;
    name: string;
    unit?: Unit;
}

interface Supplier {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface StockMovement {
    id: number;
    product: Product | null;
    supplier?: Supplier | null;
    user?: User | null;
    movement_type: "IN" | "OUT" | "ADJUSTMENT" | "DAMAGE";
    quantity: string | number;
    reference_number?: string | null;
    notes?: string | null;
    created_at: string;
}

interface PaginationData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Summary {
    total_transactions: number;
    total_in: number;
    total_out: number;
    total_adjustment: number;
    total_damage: number;
}

interface Props {
    movements: PaginationData<StockMovement>;
    summary: Summary;
    filters: {
        search: string;
        type: string;
        start_date: string;
        end_date: string;
    };
}

const movementLabels: Record<string, string> = {
    IN: "In",
    OUT: "Out",
    ADJUSTMENT: "Adjustment",
    DAMAGE: "Damage",
};

function getMovementColor(type: string) {
    switch (type) {
        case "IN":
            return "border-green-500/20 bg-green-500/5 text-green-600";

        case "OUT":
            return "border-blue-500/20 bg-blue-500/5 text-blue-600";

        case "ADJUSTMENT":
            return "border-amber-500/20 bg-amber-500/5 text-amber-600";

        case "DAMAGE":
            return "border-red-500/20 bg-red-500/5 text-red-600";

        default:
            return "border-border bg-muted text-muted-foreground";
    }
}

function getMovementIcon(type: string) {
    switch (type) {
        case "IN":
            return <ArrowDownToLine className="size-3" />;

        case "OUT":
            return <ArrowUpFromLine className="size-3" />;

        case "DAMAGE":
            return <AlertTriangle className="size-3" />;

        default:
            return <RefreshCcw className="size-3" />;
    }
}

function formatNumber(value: string | number) {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(Number(value));
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default function StockMovementIndex({
    summary,
    movements,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [type, setType] = useState(filters.type ?? "");
    const [startDate, setStartDate] = useState(filters.start_date ?? "");
    const [endDate, setEndDate] = useState(filters.end_date ?? "");

    const columns = useMemo<ColumnDef<StockMovement, any>[]>(
        () => [
            {
                accessorKey: "reference_number",
                header: "Referensi",
                cell: ({ row }) => {
                    const reference =
                        row.original.reference_number ||
                        `MOV-${row.original.id}`;
                    console.log("referencenya ", reference);

                    return (
                        <div>
                            <button
                                type="button"
                                onClick={() =>
                                    router.visit(
                                        `/inventory/movements/${encodeURIComponent(reference)}`,
                                    )
                                }
                                className="font-medium text-primary hover:underline"
                            >
                                {reference}
                            </button>

                            <p className="text-xs text-muted-foreground">
                                ID #{row.original.id}
                            </p>
                        </div>
                    );
                },
            },
            {
                accessorKey: "product.name",
                header: "Produk",
                cell: ({ row }) => {
                    const product = row.original.product;

                    return (
                        <div>
                            <p className="font-medium">
                                {product?.name ?? "Produk tidak tersedia"}
                            </p>

                            <p className="text-xs text-muted-foreground">
                                {product?.sku ?? "-"}
                            </p>
                        </div>
                    );
                },
            },
            {
                accessorKey: "movement_type",
                header: "Jenis",
                cell: ({ row }) => {
                    const movement = row.original.movement_type;

                    return (
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getMovementColor(movement)}`}
                        >
                            {getMovementIcon(movement)}
                            {movementLabels[movement] ?? movement.toLowerCase()}
                        </span>
                    );
                },
            },
            {
                accessorKey: "quantity",
                header: "Qty",
                cell: ({ row }) => {
                    const quantity = Number(row.original.quantity);
                    const unit = row.original.product?.unit;

                    return (
                        <div className="text-right">
                            <span
                                className={`font-semibold tabular-nums ${
                                    quantity >= 0
                                        ? "text-emerald-600"
                                        : "text-red-600"
                                }`}
                            >
                                {quantity > 0 ? "+" : ""}
                                {formatNumber(quantity)}
                            </span>

                            <span className="ml-1 text-xs text-muted-foreground">
                                {unit?.symbol ?? ""}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "supplier.name",
                header: "Supplier",
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.supplier?.name ?? "-"}
                    </span>
                ),
            },
            {
                accessorKey: "user.name",
                header: "User",
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.user?.name ?? "-"}
                    </span>
                ),
            },
            {
                accessorKey: "created_at",
                header: "Tanggal",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-muted-foreground">
                        {formatDate(row.original.created_at)}
                    </span>
                ),
            },
        ],
        [],
    );

    function applyFilters(overrides: Record<string, any> = {}) {
        router.get(
            "/inventory/movements",
            {
                search,
                type,
                start_date: startDate,
                end_date: endDate,
                ...overrides,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function handleSearch(value: string) {
        setSearch(value);
        applyFilters({ search: value });
    }

    return (
        <>
            <Head title="Stock Movement" />

            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Stock Movement
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Riwayat seluruh pergerakan stok produk.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {/* Stock In */}
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.visit("/inventory/stock-in/create")
                                }
                            >
                                <ArrowDownToLine className="mr-2 size-4 text-emerald-600" />
                                Stock In
                            </Button>

                            {/* Stock Out */}
                            <Button
                                onClick={() =>
                                    router.visit("/inventory/stock-out/create")
                                }
                            >
                                <ArrowUpFromLine className="mr-2 size-4" />
                                Stock Out
                            </Button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Total Transaksi */}
                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                                    <Package className="size-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Transaksi
                                    </p>

                                    <p className="mt-1 text-2xl font-bold tabular-nums">
                                        {formatNumber(
                                            summary.total_transactions,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stock In */}
                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-600">
                                    <ArrowDownToLine className="size-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Stock In
                                    </p>

                                    <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600">
                                        {formatNumber(summary.total_in)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stock Out */}
                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-500/10 p-3 text-blue-600">
                                    <ArrowUpFromLine className="size-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Stock Out
                                    </p>

                                    <p className="mt-1 text-2xl font-bold tabular-nums text-blue-600">
                                        {formatNumber(summary.total_out)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Adjustment */}
                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-amber-500/10 p-3 text-amber-600">
                                    <RefreshCcw className="size-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Adjustment
                                    </p>

                                    <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600">
                                        {formatNumber(summary.total_adjustment)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Damage */}
                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-red-500/10 p-3 text-red-600">
                                    <AlertTriangle className="size-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Damage
                                    </p>

                                    <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">
                                        {formatNumber(summary.total_damage)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {/* Start Date */}
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    applyFilters({
                                        start_date: e.target.value,
                                    });
                                }}
                            />

                            {/* End Date */}
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    applyFilters({
                                        end_date: e.target.value,
                                    });
                                }}
                            />

                            {/* Movement Type */}
                            <select
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value);
                                    applyFilters({
                                        type: e.target.value,
                                    });
                                }}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">Semua pergerakan</option>
                                <option value="IN">Stock In</option>
                                <option value="OUT">Stock Out</option>
                                <option value="ADJUSTMENT">Adjustment</option>
                                <option value="DAMAGE">Damage</option>
                            </select>
                        </div>
                    </div>

                    {/* DataTable */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <DataTable
                            data={movements.data}
                            columns={columns}
                            pagination={movements}
                            search={search}
                            onSearchChange={handleSearch}
                            onPaginationChange={(pagination) =>
                                router.get(
                                    "/inventory/movements",
                                    {
                                        search,
                                        type,
                                        start_date: startDate,
                                        end_date: endDate,
                                        page: pagination.pageIndex + 1,
                                        per_page: pagination.pageSize,
                                    },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                )
                            }
                            onSortingChange={() => {}}
                        />
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
}
