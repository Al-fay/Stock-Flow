import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import {
    ArrowDownToLine,
    CalendarDays,
    Eye,
    Package,
    Plus,
    Search,
    Wallet,
    RefreshCcw,
    Truck,
} from "lucide-react";

import DashboardLayout from "@/layouts/dashboard-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Supplier {
    id: number;
    name: string;
}

interface Creator {
    id: number;
    name: string;
}

interface StockIn {
    id: number;
    reference_number: string;
    supplier_id: number;
    transaction_date: string;
    total_quantity: number | string;
    total_amount: number | string;
    payment_method: string;
    status: string;
    notes?: string | null;
    items_count: number;
    supplier?: Supplier | null;
    creator?: Creator | null;
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
    stockIns: PaginatedData<StockIn>;
    summary: Summary;
    filters: Filters;
}

const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const formatNumber = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(Number(value || 0));

const formatDate = (value?: string | null) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
};

const paymentLabel = (payment: string) => {
    switch (payment) {
        case "CASH":
            return "Tunai";
        case "TRANSFER":
            return "Transfer";
        case "QRIS":
            return "QRIS";
        case "OTHER":
            return "Lainnya";
        default:
            return payment;
    }
};

export default function StockInIndex({ stockIns, summary, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [startDate, setStartDate] = useState(filters.start_date ?? "");
    const [endDate, setEndDate] = useState(filters.end_date ?? "");
    const [perPage, setPerPage] = useState(String(filters.per_page ?? 10));

    const applyFilters = () => {
        router.get(
            "/inventory/stock-in",
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
            "/inventory/stock-in",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const openDetail = (reference: string) => {
        router.visit(`/inventory/stock-in/${reference}`);
    };

    return (
        <DashboardLayout>
            <Head title="Stock In" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Stock In
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Riwayat transaksi barang masuk dan pembelian stok.
                        </p>
                    </div>

                    <Button>
                        <Link href="/inventory/stock-in/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Stock In
                        </Link>
                    </Button>
                </div>

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Total Transaksi
                                    </p>

                                    <p className="text-2xl font-bold">
                                        {summary.total_transactions}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Transaksi sesuai filter
                                    </p>
                                </div>

                                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                                    <ArrowDownToLine className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Total Barang Masuk
                                    </p>

                                    <p className="text-2xl font-bold">
                                        {formatNumber(summary.total_quantity)}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Akumulasi quantity
                                    </p>
                                </div>

                                <div className="rounded-lg bg-blue-500/10 p-3 text-blue-500">
                                    <Package className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Total Pembelian
                                    </p>

                                    <p className="text-xl font-bold">
                                        {formatCurrency(summary.total_amount)}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Nilai seluruh transaksi
                                    </p>
                                </div>

                                <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-600">
                                    <Wallet className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Transaksi Hari Ini
                                    </p>

                                    <p className="text-2xl font-bold">
                                        {summary.today_transactions}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Barang masuk hari ini
                                    </p>
                                </div>

                                <div className="rounded-lg bg-orange-500/10 p-3 text-orange-500">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
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
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyFilters();
                            }}
                            className="space-y-4"
                        >
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                    <Input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari nomor transaksi / supplier..."
                                        className="pl-9"
                                    />
                                </div>

                                {/* Start Date */}
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                />

                                {/* End Date */}
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />

                                {/* Per Page */}
                                <select
                                    value={perPage}
                                    onChange={(e) => setPerPage(e.target.value)}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                                >
                                    <option value="10">10 data</option>
                                    <option value="25">25 data</option>
                                    <option value="50">50 data</option>
                                    <option value="100">100 data</option>
                                </select>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button type="submit">
                                    <Search className="mr-2 h-4 w-4" />
                                    Terapkan Filter
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetFilters}
                                >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>Riwayat Stock In</CardTitle>

                            <p className="text-sm text-muted-foreground">
                                Total {stockIns.total} transaksi
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">
                                            No. Referensi
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Tanggal
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Supplier
                                        </th>

                                        <th className="px-4 py-3 text-right font-medium">
                                            Item
                                        </th>

                                        <th className="px-4 py-3 text-right font-medium">
                                            Total Qty
                                        </th>

                                        <th className="px-4 py-3 text-right font-medium">
                                            Total Pembelian
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Pembayaran
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Dibuat Oleh
                                        </th>

                                        <th className="px-4 py-3 text-center font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {stockIns.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-4">
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

                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {formatDate(
                                                    item.transaction_date,
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />

                                                    <span>
                                                        {item.supplier?.name ??
                                                            "-"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-right">
                                                {item.items_count}
                                            </td>

                                            <td className="px-4 py-4 text-right font-medium">
                                                {formatNumber(
                                                    item.total_quantity,
                                                )}
                                            </td>

                                            <td className="px-4 py-4 text-right font-medium whitespace-nowrap">
                                                {formatCurrency(
                                                    item.total_amount,
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                <Badge variant="outline">
                                                    {paymentLabel(
                                                        item.payment_method,
                                                    )}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-4">
                                                <Badge
                                                    variant={
                                                        item.status === "POSTED"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {item.status}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-4">
                                                {item.creator?.name ?? "-"}
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        openDetail(
                                                            item.reference_number,
                                                        )
                                                    }
                                                    title="Lihat detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}

                                    {stockIns.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={10}
                                                className="py-12 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Package className="h-10 w-10 opacity-40" />

                                                    <p>
                                                        Data Stock In belum
                                                        tersedia.
                                                    </p>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link href="/inventory/stock-in/create">
                                                            Tambah Stock In
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {stockIns.last_page > 1 && (
                            <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Menampilkan{" "}
                                    {stockIns.data.length > 0
                                        ? (stockIns.current_page - 1) *
                                              stockIns.per_page +
                                          1
                                        : 0}{" "}
                                    -{" "}
                                    {Math.min(
                                        stockIns.current_page *
                                            stockIns.per_page,
                                        stockIns.total,
                                    )}{" "}
                                    dari {stockIns.total} data
                                </p>

                                <div className="flex flex-wrap items-center gap-1">
                                    {stockIns.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={
                                                link.active
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => {
                                                if (link.url) {
                                                    router.visit(link.url, {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    });
                                                }
                                            }}
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
