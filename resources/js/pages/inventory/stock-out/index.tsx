import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    ArrowDownToLine,
    CalendarDays,
    Eye,
    Package,
    Plus,
    Search,
    ShoppingCart,
    TrendingDown,
    X,
} from "lucide-react";

import DashboardLayout from "@/layouts/dashboard-layout";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface User {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    name: string;
    symbol?: string | null;
}

interface Product {
    id: number;
    sku: string;
    name: string;
    unit?: Unit | null;
}

interface StockOutItem {
    id: number;
    product_id: number;
    quantity: number | string;
    unit_price?: number | string;
    subtotal?: number | string;
    product?: Product | null;
}

interface StockOut {
    id: number;
    reference_number: string;
    transaction_date: string;
    total_quantity: number | string;
    total_amount: number | string;
    status: string;
    notes?: string | null;
    creator?: User | null;
    items?: StockOutItem[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Summary {
    total_transactions: number;
    total_quantity: number | string;
    total_amount: number | string;
    today_transactions: number;
}

interface Filters {
    search: string;
    start_date: string;
    end_date: string;
    per_page: number;
}

interface Props {
    stockOuts: PaginatedData<StockOut>;
    summary: Summary;
    filters: Filters;
}

const formatNumber = (value: number | string | null | undefined) => {
    return Number(value ?? 0).toLocaleString("id-ID", {
        maximumFractionDigits: 3,
    });
};

const formatCurrency = (value: number | string | null | undefined) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
};

const formatDate = (date: string) => {
    if (!date) return "-";

    const parsed = new Date(`${date.substring(0, 10)}T00:00:00`);

    return parsed.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
        case "POSTED":
            return "default";

        case "DRAFT":
            return "secondary";

        case "CANCELLED":
            return "destructive";

        default:
            return "outline";
    }
};

export default function StockOutIndex({ stockOuts, summary, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [startDate, setStartDate] = useState(filters.start_date ?? "");
    const [endDate, setEndDate] = useState(filters.end_date ?? "");
    const [perPage, setPerPage] = useState(String(filters.per_page ?? 10));

    const hasFilters = Boolean(search || startDate || endDate);

    const applyFilters = () => {
        router.get(
            "/inventory/stock-out",
            {
                search,
                start_date: startDate,
                end_date: endDate,
                per_page: perPage,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setPerPage("10");

        router.get(
            "/inventory/stock-out",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const paginationLinks = useMemo(
        () =>
            stockOuts.links.filter(
                (link) =>
                    link.label !== "&laquo; Previous" &&
                    link.label !== "Next &raquo;",
            ),
        [stockOuts.links],
    );

    const goToPage = (url: string | null) => {
        if (!url) return;

        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Stock Out" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Stock Out
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Kelola dan pantau transaksi pengeluaran stok barang.
                        </p>
                    </div>

                    <Button
                        onClick={() =>
                            router.visit("/inventory/stock-out/create")
                        }
                    >
                        <Plus className="mr-2 size-4" />
                        Stock Out Baru
                    </Button>
                </div>

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Total Transaksi
                                </p>

                                <p className="text-2xl font-bold">
                                    {formatNumber(summary.total_transactions)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-primary/10 p-3 text-primary">
                                <ShoppingCart className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Total Barang Keluar
                                </p>

                                <p className="text-2xl font-bold">
                                    {formatNumber(summary.total_quantity)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
                                <Package className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Nilai Pengeluaran
                                </p>

                                <p className="text-xl font-bold">
                                    {formatCurrency(summary.total_amount)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-orange-500/10 p-3 text-orange-600">
                                <TrendingDown className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Transaksi Hari Ini
                                </p>

                                <p className="text-2xl font-bold">
                                    {formatNumber(summary.today_transactions)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                                <CalendarDays className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Filter Transaksi
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_120px_auto]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            applyFilters();
                                        }
                                    }}
                                    placeholder="Cari referensi, produk, SKU..."
                                    className="pl-9"
                                />
                            </div>

                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />

                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />

                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="10">10 data</option>
                                <option value="25">25 data</option>
                                <option value="50">50 data</option>
                                <option value="100">100 data</option>
                            </select>

                            <div className="flex gap-2">
                                <Button onClick={applyFilters}>Filter</Button>

                                {hasFilters && (
                                    <Button
                                        variant="outline"
                                        onClick={resetFilters}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Referensi
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Tanggal
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Produk
                                        </th>

                                        <th className="px-4 py-3 text-right font-medium">
                                            Total Qty
                                        </th>

                                        <th className="px-4 py-3 text-right font-medium">
                                            Total Nilai
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Dibuat Oleh
                                        </th>

                                        <th className="px-4 py-3 text-center font-medium">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-center font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {stockOuts.data.length > 0 ? (
                                        stockOuts.data.map((stockOut) => (
                                            <tr
                                                key={stockOut.id}
                                                className="border-b transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.visit(
                                                                `/inventory/stock-out/${stockOut.reference_number}`,
                                                            )
                                                        }
                                                        className="font-medium text-primary hover:underline"
                                                    >
                                                        {
                                                            stockOut.reference_number
                                                        }
                                                    </button>
                                                </td>

                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {formatDate(
                                                        stockOut.transaction_date,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        <p className="font-medium">
                                                            {stockOut.items
                                                                ?.length ??
                                                                0}{" "}
                                                            produk
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {stockOut.items
                                                                ?.slice(0, 2)
                                                                .map(
                                                                    (item) =>
                                                                        item
                                                                            .product
                                                                            ?.name,
                                                                )
                                                                .filter(Boolean)
                                                                .join(", ")}

                                                            {(stockOut.items
                                                                ?.length ?? 0) >
                                                                2 &&
                                                                ` +${stockOut.items!.length - 2} lainnya`}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatNumber(
                                                        stockOut.total_quantity,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap">
                                                    {formatCurrency(
                                                        stockOut.total_amount,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {stockOut.creator?.name ??
                                                        "-"}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <Badge
                                                        variant={getStatusVariant(
                                                            stockOut.status,
                                                        )}
                                                    >
                                                        {stockOut.status}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            router.visit(
                                                                `/inventory/stock-out/${stockOut.reference_number}`,
                                                            )
                                                        }
                                                        title="Lihat detail"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="py-16 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="rounded-full bg-muted p-4">
                                                        <ArrowDownToLine className="size-6 text-muted-foreground" />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="font-medium">
                                                            Belum ada transaksi
                                                            Stock Out
                                                        </p>

                                                        <p className="text-sm text-muted-foreground">
                                                            Transaksi
                                                            pengeluaran stok
                                                            akan muncul di sini.
                                                        </p>
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.visit(
                                                                "/inventory/stock-out/create",
                                                            )
                                                        }
                                                    >
                                                        <Plus className="mr-2 size-4" />
                                                        Buat Stock Out
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan{" "}
                                <span className="font-medium text-foreground">
                                    {stockOuts.data.length}
                                </span>{" "}
                                dari{" "}
                                <span className="font-medium text-foreground">
                                    {stockOuts.total}
                                </span>{" "}
                                transaksi
                            </p>

                            <div className="flex flex-wrap items-center gap-1">
                                {stockOuts.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={
                                            link.active ? "default" : "outline"
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => goToPage(link.url)}
                                        className="min-w-9"
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

StockOutIndex.layout = (page: React.ReactNode) => (
    <DashboardLayout>{page}</DashboardLayout>
);
