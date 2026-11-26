import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import {
    ArrowLeftRight,
    Eye,
    Package,
    Plus,
    RotateCcw,
    Search,
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

interface Product {
    id: number;
    sku: string;
    name: string;
}

interface StockOut {
    id: number;
    reference_number: string;
    transaction_date?: string;
}

interface StockReturnItem {
    id: number;
    product_id: number;
    quantity: number | string;
    unit_price: number | string;
    subtotal: number | string;
    restock_quantity: number | string;
    damaged_quantity: number | string;
    notes?: string | null;
    product?: Product | null;
}

interface StockReturn {
    id: number;
    reference_number: string;
    return_date: string;
    total_quantity: number | string;
    total_amount: number | string;
    status: string;
    reason?: string | null;
    creator?: User | null;
    stock_out?: StockOut | null;
    items?: StockReturnItem[];
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
    total_restock: number | string;
    total_damaged: number | string;
    total_amount: number | string;
}

interface Filters {
    search: string;
    start_date: string;
    end_date: string;
    per_page: number;
}

interface Props {
    returns: PaginatedData<StockReturn>;
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

const formatDate = (date: string | null | undefined) => {
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
            return "default" as const;

        case "DRAFT":
            return "secondary" as const;

        case "CANCELLED":
            return "destructive" as const;

        default:
            return "outline" as const;
    }
};

export default function StockReturnIndex({ returns, summary, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [startDate, setStartDate] = useState(filters.start_date ?? "");
    const [endDate, setEndDate] = useState(filters.end_date ?? "");
    const [perPage, setPerPage] = useState(String(filters.per_page ?? 10));

    const hasFilters = Boolean(search || startDate || endDate);

    const applyFilters = () => {
        router.get(
            "/inventory/stock-return",
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
            "/inventory/stock-return",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const goToPage = (url: string | null) => {
        if (!url) return;

        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openDetail = (reference: string) => {
        router.visit(`/inventory/stock-return/${reference}`);
    };

    return (
        <>
            <Head title="Stock Return" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Stock Return
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Riwayat pengembalian barang dari transaksi Stock
                            Out.
                        </p>
                    </div>

                    <Button
                        onClick={() =>
                            router.visit("/inventory/stock-return/create")
                        }
                    >
                        <Plus className="mr-2 size-4" />
                        Retur Baru
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Total Transaksi
                                </p>
                                <p className="text-2xl font-bold tabular-nums">
                                    {formatNumber(summary.total_transactions)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-primary/10 p-3 text-primary">
                                <ArrowLeftRight className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Qty Diretur
                                </p>
                                <p className="text-2xl font-bold tabular-nums">
                                    {formatNumber(summary.total_quantity)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-600">
                                <Package className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Masuk Stok
                                </p>
                                <p className="text-2xl font-bold tabular-nums">
                                    {formatNumber(summary.total_restock)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                                <RotateCcw className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Barang Damaged
                                </p>
                                <p className="text-2xl font-bold tabular-nums">
                                    {formatNumber(summary.total_damaged)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
                                <Package className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Nilai Retur
                                </p>
                                <p className="text-lg font-bold tabular-nums">
                                    {formatCurrency(summary.total_amount)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
                                <ArrowLeftRight className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Filter Riwayat Retur
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
                                    placeholder="Cari retur, Stock Out, SKU, produk..."
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

                {/* Return Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Referensi Retur
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Stock Out Asal
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Tanggal
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Produk
                                        </th>

                                        <th className="px-4 py-3 text-right font-medium">
                                            Qty Retur
                                        </th>

                                        <th className="px-4 py-3 text-right font-medium">
                                            Nilai Retur
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
                                    {returns.data.length > 0 ? (
                                        returns.data.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDetail(
                                                                item.reference_number,
                                                            )
                                                        }
                                                        className="font-medium text-primary hover:underline"
                                                    >
                                                        {item.reference_number}
                                                    </button>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {item.stock_out
                                                        ?.reference_number ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/inventory/stock-out/${item.stock_out!.reference_number}`,
                                                                )
                                                            }
                                                            className="text-muted-foreground hover:text-primary hover:underline"
                                                        >
                                                            {
                                                                item.stock_out
                                                                    .reference_number
                                                            }
                                                        </button>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {formatDate(
                                                        item.return_date,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        <p className="font-medium">
                                                            {item.items
                                                                ?.length ??
                                                                0}{" "}
                                                            item
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {item.items
                                                                ?.slice(0, 2)
                                                                .map(
                                                                    (
                                                                        returnItem,
                                                                    ) =>
                                                                        returnItem
                                                                            .product
                                                                            ?.name,
                                                                )
                                                                .filter(Boolean)
                                                                .join(", ")}

                                                            {(item.items
                                                                ?.length ?? 0) >
                                                                2 &&
                                                                ` +${item.items!.length - 2} lainnya`}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatNumber(
                                                        item.total_quantity,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap">
                                                    {formatCurrency(
                                                        item.total_amount,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {item.creator?.name ?? "-"}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <Badge
                                                        variant={getStatusVariant(
                                                            item.status,
                                                        )}
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openDetail(
                                                                item.reference_number,
                                                            )
                                                        }
                                                        title="Lihat detail retur"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="py-16 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="rounded-full bg-muted p-4">
                                                        <RotateCcw className="size-6 text-muted-foreground" />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="font-medium">
                                                            Belum ada transaksi
                                                            retur
                                                        </p>

                                                        <p className="text-sm text-muted-foreground">
                                                            Transaksi Stock
                                                            Return yang dibuat
                                                            akan muncul di sini.
                                                        </p>
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.visit(
                                                                "/inventory/stock-return/create",
                                                            )
                                                        }
                                                    >
                                                        <Plus className="mr-2 size-4" />
                                                        Buat Retur Baru
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
                                    {returns.data.length}
                                </span>{" "}
                                dari{" "}
                                <span className="font-medium text-foreground">
                                    {returns.total}
                                </span>{" "}
                                transaksi retur
                            </p>

                            <div className="flex flex-wrap items-center gap-1">
                                {returns.links.map((link, index) => (
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

StockReturnIndex.layout = (page: React.ReactNode) => (
    <DashboardLayout>{page}</DashboardLayout>
);
