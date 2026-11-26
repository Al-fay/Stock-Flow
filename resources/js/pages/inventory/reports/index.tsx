import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import {
    Package,
    Wallet,
    TrendingUp,
    TrendingDown,
    ClipboardList,
    Search,
    RotateCcw,
    FileSpreadsheet,
    FileText,
} from "lucide-react";

import DashboardLayout from "@/layouts/dashboard-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Category {
    id: number;
    name: string;
}

interface ProductOption {
    id: number;
    name: string;
    sku: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    stock: number;
    purchase_price: number;
    selling_price: number;
    category?: Category;
    unit?: {
        name: string;
        symbol?: string;
    };
}

interface StockMovement {
    id: number;
    reference_number: string;
    movement_type: string;
    quantity: number;
    notes?: string;
    created_at: string;
    product?: Product;
    user?: {
        name: string;
    };
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

interface Props {
    products: PaginatedData<Product>;
    movements: PaginatedData<StockMovement>;

    valuation: {
        total_stock: number;
        total_inventory_value: number;
        total_selling_value: number;
        total_products: number;
    };

    movementSummary: {
        total_transactions: number;
        total_in: number;
        total_out: number;
    };

    categories: Category[];
    productOptions: ProductOption[];

    filters: {
        search?: string;
        category_id?: string;
        product_id?: string;
        movement_type?: string;
        date_from?: string;
        date_to?: string;
        per_page?: number;
    };
}

const formatNumber = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(Number(value || 0));

const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const formatDate = (value: string) =>
    new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));

const movementLabel = (type: string) => {
    const labels: Record<string, string> = {
        IN: "Stock In",
        OUT: "Stock Out",
        RETURN: "Stock Return",
        ADJUSTMENT: "Adjustment",
        DAMAGE: "Damage",
    };

    return labels[type] ?? type;
};

export default function InventoryReports({
    products,
    movements,
    valuation,
    movementSummary,
    categories,
    productOptions,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [categoryId, setCategoryId] = useState(filters.category_id ?? "");
    const [productId, setProductId] = useState(filters.product_id ?? "");
    const [movementType, setMovementType] = useState(
        filters.movement_type ?? "",
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
    const [dateTo, setDateTo] = useState(filters.date_to ?? "");
    const [perPage, setPerPage] = useState(String(filters.per_page ?? 10));

    const applyFilters = () => {
        router.get(
            "/inventory/reports",
            {
                search,
                category_id: categoryId,
                product_id: productId,
                movement_type: movementType,
                date_from: dateFrom,
                date_to: dateTo,
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
        setCategoryId("");
        setProductId("");
        setMovementType("");
        setDateFrom("");
        setDateTo("");
        setPerPage("10");

        router.get(
            "/inventory/reports",
            {},
            {
                preserveState: false,
                replace: true,
            },
        );
    };

    const paginate = (url: string | null) => {
        if (!url) return;

        router.get(
            url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleExportPdf = () => {
        const params = new URLSearchParams();

        if (filters.search) {
            params.set("search", filters.search);
        }

        if (filters.category_id) {
            params.set("category_id", filters.category_id);
        }

        if (filters.product_id) {
            params.set("product_id", filters.product_id);
        }

        if (filters.movement_type) {
            params.set("movement_type", filters.movement_type);
        }

        if (filters.date_from) {
            params.set("date_from", filters.date_from);
        }

        if (filters.date_to) {
            params.set("date_to", filters.date_to);
        }

        window.location.href = `/inventory/reports/export/pdf?${params.toString()}`;
    };

    return (
        <DashboardLayout>
            <Head title="Inventory Reports" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Inventory Reports
                        </h1>

                        <p className="text-muted-foreground text-sm">
                            Laporan stok, nilai persediaan, dan pergerakan
                            inventory.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="destructive"
                            onClick={handleExportPdf}
                            className="cursor-pointer"
                        >
                            <FileText className="mr-2 size-4" />
                            Export PDF
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                const params = new URLSearchParams();

                                if (filters.search) {
                                    params.set("search", filters.search);
                                }

                                if (filters.category_id) {
                                    params.set(
                                        "category_id",
                                        filters.category_id,
                                    );
                                }

                                if (filters.product_id) {
                                    params.set(
                                        "product_id",
                                        filters.product_id,
                                    );
                                }

                                if (filters.movement_type) {
                                    params.set(
                                        "movement_type",
                                        filters.movement_type,
                                    );
                                }

                                if (filters.date_from) {
                                    params.set("date_from", filters.date_from);
                                }

                                if (filters.date_to) {
                                    params.set("date_to", filters.date_to);
                                }

                                window.location.href = `/inventory/reports/export?${params.toString()}`;
                            }}
                            className="cursor-pointer"
                        >
                            <FileSpreadsheet className="mr-2 size-4" />
                            Export Excel
                        </Button>
                    </div>
                </div>

                {/* Valuation Cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-xl bg-primary/10 p-3 text-primary">
                                <Package className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Produk
                                </p>

                                <h3 className="text-2xl font-bold">
                                    {formatNumber(valuation.total_products)}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
                                <ClipboardList className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Stok
                                </p>

                                <h3 className="text-2xl font-bold">
                                    {formatNumber(valuation.total_stock)}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                                <Wallet className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Nilai Persediaan
                                </p>

                                <h3 className="text-xl font-bold">
                                    {formatCurrency(
                                        valuation.total_inventory_value,
                                    )}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
                                <TrendingUp className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Potensi Nilai Penjualan
                                </p>

                                <h3 className="text-xl font-bold">
                                    {formatCurrency(
                                        valuation.total_selling_value,
                                    )}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Movement Summary */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Transaksi Movement
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatNumber(
                                    movementSummary.total_transactions,
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Barang Masuk
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex items-center gap-2">
                            <TrendingUp className="size-5 text-emerald-600" />

                            <div className="text-2xl font-bold text-emerald-600">
                                {formatNumber(movementSummary.total_in)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Barang Keluar
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex items-center gap-2">
                            <TrendingDown className="size-5 text-destructive" />

                            <div className="text-2xl font-bold text-destructive">
                                {formatNumber(movementSummary.total_out)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter Laporan</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Input
                                placeholder="Cari SKU, produk, referensi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="h-9 rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">Semua kategori</option>

                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                className="h-9 rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">Semua produk</option>

                                {productOptions.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.sku} - {product.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={movementType}
                                onChange={(e) =>
                                    setMovementType(e.target.value)
                                }
                                className="h-9 rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">Semua movement</option>
                                <option value="IN">Stock In</option>
                                <option value="OUT">Stock Out</option>
                                <option value="RETURN">Stock Return</option>
                                <option value="ADJUSTMENT">Adjustment</option>
                                <option value="DAMAGE">Damage</option>
                            </select>

                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />

                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />

                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(e.target.value)}
                                className="h-9 rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="10">10 data</option>
                                <option value="25">25 data</option>
                                <option value="50">50 data</option>
                                <option value="100">100 data</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button onClick={applyFilters}>
                                <Search className="mr-2 size-4" />
                                Terapkan Filter
                            </Button>

                            <Button variant="outline" onClick={resetFilters}>
                                <RotateCcw className="mr-2 size-4" />
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stock Summary</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="p-3">SKU</th>
                                        <th className="p-3">Produk</th>
                                        <th className="p-3">Kategori</th>
                                        <th className="p-3 text-right">Stok</th>
                                        <th className="p-3 text-right">
                                            Harga Beli
                                        </th>
                                        <th className="p-3 text-right">
                                            Nilai Stok
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {products.data.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="border-b hover:bg-muted/50"
                                        >
                                            <td className="p-3 font-mono text-xs">
                                                {product.sku}
                                            </td>

                                            <td className="p-3 font-medium">
                                                {product.name}
                                            </td>

                                            <td className="p-3">
                                                {product.category?.name ?? "-"}
                                            </td>

                                            <td className="p-3 text-right">
                                                {formatNumber(product.stock)}{" "}
                                                {product.unit?.symbol ??
                                                    product.unit?.name ??
                                                    ""}
                                            </td>

                                            <td className="p-3 text-right">
                                                {formatCurrency(
                                                    product.purchase_price,
                                                )}
                                            </td>

                                            <td className="p-3 text-right font-medium">
                                                {formatCurrency(
                                                    Number(product.stock) *
                                                        Number(
                                                            product.purchase_price,
                                                        ),
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                    {products.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Data produk tidak ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">
                                Total {products.total} produk
                            </p>

                            <div className="flex flex-wrap gap-1">
                                {products.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        variant={
                                            link.active ? "default" : "outline"
                                        }
                                        disabled={!link.url}
                                        onClick={() => paginate(link.url)}
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

                {/* Movement Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stock Movement History</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="p-3">Tanggal</th>
                                        <th className="p-3">Referensi</th>
                                        <th className="p-3">Produk</th>
                                        <th className="p-3">Jenis</th>
                                        <th className="p-3 text-right">
                                            Quantity
                                        </th>
                                        <th className="p-3">User</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {movements.data.map((movement) => (
                                        <tr
                                            key={movement.id}
                                            className="border-b hover:bg-muted/50"
                                        >
                                            <td className="p-3 whitespace-nowrap">
                                                {formatDate(
                                                    movement.created_at,
                                                )}
                                            </td>

                                            <td className="p-3 font-mono text-xs">
                                                {movement.reference_number}
                                            </td>

                                            <td className="p-3">
                                                <div className="font-medium">
                                                    {movement.product?.name ??
                                                        "-"}
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    {movement.product?.sku}
                                                </div>
                                            </td>

                                            <td className="p-3">
                                                {movementLabel(
                                                    movement.movement_type,
                                                )}
                                            </td>

                                            <td
                                                className={`p-3 text-right font-semibold ${
                                                    Number(movement.quantity) >=
                                                    0
                                                        ? "text-emerald-600"
                                                        : "text-destructive"
                                                }`}
                                            >
                                                {Number(movement.quantity) > 0
                                                    ? "+"
                                                    : ""}
                                                {formatNumber(
                                                    movement.quantity,
                                                )}
                                            </td>

                                            <td className="p-3">
                                                {movement.user?.name ?? "-"}
                                            </td>
                                        </tr>
                                    ))}

                                    {movements.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Tidak ada data movement.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">
                                Total {movements.total} movement
                            </p>

                            <div className="flex flex-wrap gap-1">
                                {movements.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        variant={
                                            link.active ? "default" : "outline"
                                        }
                                        disabled={!link.url}
                                        onClick={() => paginate(link.url)}
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
        </DashboardLayout>
    );
}
