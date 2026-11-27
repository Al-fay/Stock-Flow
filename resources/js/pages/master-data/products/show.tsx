import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import {
    ArrowLeft,
    Package,
    Boxes,
    TrendingUp,
    TrendingDown,
    RotateCcw,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Pencil,
    Calendar,
    Filter,
} from "lucide-react";

interface Category {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    name: string;
    symbol: string;
}

interface Product {
    id: number;
    category_id: number | null;
    unit_id: number;
    sku: string;
    barcode: string | null;
    name: string;
    description: string | null;
    purchase_price: string | number;
    selling_price: string | number;
    stock: string | number;
    minimum_stock: string | number;
    is_active: boolean;
    created_at: string;
    category: Category | null;
    unit: Unit | null;
}

interface Movement {
    id: number;
    movement_type: string;
    quantity: string | number;
    reference: string | null;
    reference_number?: string | null;
    notes: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
    } | null;
    supplier?: {
        id: number;
        name: string;
    } | null;
}

interface PaginatedMovements {
    data: Movement[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

interface Summary {
    total_in: number | string;
    total_out: number | string;
    total_return: number | string;
    total_adjustment: number | string;
    total_damage: number | string;
    total_transactions: number;
}

interface Filters {
    movement_type: string | null;
    date_from: string | null;
    date_to: string | null;
}

interface Props {
    product: Product;
    summary: Summary;
    movements: PaginatedMovements;
    filters: Filters;
}

const currency = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const numberFormat = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(Number(value || 0));

const dateFormat = (value: string) =>
    new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));

const movementLabels: Record<string, string> = {
    IN: "Stock In",
    OUT: "Stock Out",
    RETURN: "Stock Return",
    ADJUSTMENT: "Adjustment",
    DAMAGE: "Damage",
};

const movementColors: Record<string, string> = {
    IN: "bg-emerald-500/10 text-emerald-600",
    OUT: "bg-blue-500/10 text-blue-600",
    RETURN: "bg-violet-500/10 text-violet-600",
    ADJUSTMENT: "bg-amber-500/10 text-amber-600",
    DAMAGE: "bg-red-500/10 text-red-600",
};

function getStockStatus(product: Product) {
    const stock = Number(product.stock);
    const minimum = Number(product.minimum_stock);

    if (stock <= 0) {
        return {
            label: "Out of Stock",
            className: "bg-red-500/10 text-red-600",
            icon: XCircle,
        };
    }

    if (stock <= minimum) {
        return {
            label: "Low Stock",
            className: "bg-amber-500/10 text-amber-600",
            icon: AlertTriangle,
        };
    }

    return {
        label: "Stock Available",
        className: "bg-emerald-500/10 text-emerald-600",
        icon: CheckCircle2,
    };
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    iconClass,
}: {
    title: string;
    value: string;
    description: string;
    icon: React.ElementType;
    iconClass: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight">
                        {value}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className={`rounded-xl p-3 ${iconClass}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default function ProductShow({
    product,
    summary,
    movements,
    filters,
}: Props) {
    const [movementType, setMovementType] = useState(
        filters.movement_type ?? "",
    );

    const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
    const [dateTo, setDateTo] = useState(filters.date_to ?? "");

    const stockStatus = getStockStatus(product);
    const StatusIcon = stockStatus.icon;

    const stock = Number(product.stock);
    const minimumStock = Number(product.minimum_stock);

    const stockValue = stock * Number(product.purchase_price);
    const potentialSalesValue = stock * Number(product.selling_price);

    const applyFilters = () => {
        router.get(
            `/master-data/products/${product.id}`,
            {
                movement_type: movementType || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        setMovementType("");
        setDateFrom("");
        setDateTo("");

        router.get(
            `/master-data/products/${product.id}`,
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

        router.get(
            url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <DashboardLayout>
            <Head title={`Detail Produk - ${product.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Link
                            href="/master-data/products"
                            className="mt-1 rounded-xl border border-border p-2 transition hover:bg-muted"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Detail Produk
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Informasi lengkap dan riwayat stok produk.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/master-data/products"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                        <Pencil className="h-4 w-4" />
                        Kelola Produk
                    </Link>
                </div>

                {/* Product Information */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                                <Package className="h-8 w-8" />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold">
                                    {product.name}
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    SKU: {product.sku}
                                </p>

                                <p className="text-sm text-muted-foreground">
                                    Barcode: {product.barcode || "-"}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${stockStatus.className}`}
                                    >
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        {stockStatus.label}
                                    </span>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                                            product.is_active
                                                ? "bg-emerald-500/10 text-emerald-600"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {product.is_active
                                            ? "Produk Aktif"
                                            : "Produk Nonaktif"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-left sm:text-right">
                            <p className="text-sm text-muted-foreground">
                                Nilai Persediaan
                            </p>

                            <h3 className="mt-1 text-2xl font-bold">
                                {currency(stockValue)}
                            </h3>

                            <p className="mt-1 text-xs text-muted-foreground">
                                Berdasarkan harga beli
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Kategori
                            </p>
                            <p className="mt-1 font-medium">
                                {product.category?.name ?? "Tanpa kategori"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Satuan
                            </p>
                            <p className="mt-1 font-medium">
                                {product.unit
                                    ? `${product.unit.name} (${product.unit.symbol})`
                                    : "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Harga Beli
                            </p>
                            <p className="mt-1 font-medium">
                                {currency(product.purchase_price)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Harga Jual
                            </p>
                            <p className="mt-1 font-medium">
                                {currency(product.selling_price)}
                            </p>
                        </div>
                    </div>

                    {product.description && (
                        <div className="mt-5 border-t border-border pt-5">
                            <p className="text-xs text-muted-foreground">
                                Deskripsi
                            </p>
                            <p className="mt-2 whitespace-pre-line text-sm">
                                {product.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* KPI */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Stok Saat Ini"
                        value={`${numberFormat(stock)} ${product.unit?.symbol ?? ""}`}
                        description={`Minimum ${numberFormat(minimumStock)} ${product.unit?.symbol ?? ""}`}
                        icon={Boxes}
                        iconClass="bg-blue-500/10 text-blue-600"
                    />

                    <StatCard
                        title="Total Stock In"
                        value={numberFormat(summary.total_in)}
                        description="Total barang masuk"
                        icon={TrendingUp}
                        iconClass="bg-emerald-500/10 text-emerald-600"
                    />

                    <StatCard
                        title="Total Stock Out"
                        value={numberFormat(summary.total_out)}
                        description="Total barang keluar"
                        icon={TrendingDown}
                        iconClass="bg-red-500/10 text-red-600"
                    />

                    <StatCard
                        title="Total Transaksi"
                        value={numberFormat(summary.total_transactions)}
                        description="Seluruh movement produk"
                        icon={ClipboardList}
                        iconClass="bg-violet-500/10 text-violet-600"
                    />
                </div>

                {/* Stock Values */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <p className="text-sm text-muted-foreground">
                            Potensi Nilai Penjualan
                        </p>

                        <h3 className="mt-2 text-xl font-bold">
                            {currency(potentialSalesValue)}
                        </h3>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Stok saat ini × harga jual
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <p className="text-sm text-muted-foreground">
                            Selisih Harga
                        </p>

                        <h3 className="mt-2 text-xl font-bold text-emerald-600">
                            {currency(
                                Number(product.selling_price) -
                                    Number(product.purchase_price),
                            )}
                        </h3>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Margin per unit (belum memperhitungkan biaya
                            lainnya)
                        </p>
                    </div>
                </div>

                {/* Movement Summary */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Stock Return
                            </p>
                            <RotateCcw className="h-4 w-4 text-violet-500" />
                        </div>
                        <p className="mt-2 text-lg font-semibold">
                            {numberFormat(summary.total_return)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Adjustment
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                            {numberFormat(summary.total_adjustment)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Damage</p>
                        <p className="mt-2 text-lg font-semibold text-red-600">
                            {numberFormat(summary.total_damage)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Minimum Stok
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                            {numberFormat(minimumStock)}{" "}
                            {product.unit?.symbol ?? ""}
                        </p>
                    </div>
                </div>

                {/* Movement History */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-5">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Riwayat Pergerakan Stok
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Seluruh transaksi stok untuk produk ini.
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium">
                                    Tipe Movement
                                </label>

                                <select
                                    value={movementType}
                                    onChange={(e) =>
                                        setMovementType(e.target.value)
                                    }
                                    className="form-input"
                                >
                                    <option value="">Semua Movement</option>
                                    <option value="IN">Stock In</option>
                                    <option value="OUT">Stock Out</option>
                                    <option value="RETURN">Stock Return</option>
                                    <option value="ADJUSTMENT">
                                        Adjustment
                                    </option>
                                    <option value="DAMAGE">Damage</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium">
                                    Tanggal Mulai
                                </label>

                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(e.target.value)
                                    }
                                    className="form-input"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium">
                                    Tanggal Akhir
                                </label>

                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="flex items-end gap-2">
                                <button
                                    type="button"
                                    onClick={applyFilters}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </button>

                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-muted"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Tanggal
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Tipe
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Referensi
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Qty
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Supplier
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Catatan
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                                {movements.data.length > 0 ? (
                                    movements.data.map((movement) => {
                                        const isNegative = [
                                            "OUT",
                                            "DAMAGE",
                                        ].includes(movement.movement_type);

                                        return (
                                            <tr
                                                key={movement.id}
                                                className="transition hover:bg-muted/30"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {dateFormat(
                                                        movement.created_at,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            movementColors[
                                                                movement
                                                                    .movement_type
                                                            ] ??
                                                            "bg-muted text-muted-foreground"
                                                        }`}
                                                    >
                                                        {movementLabels[
                                                            movement
                                                                .movement_type
                                                        ] ??
                                                            movement.movement_type}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 font-medium">
                                                    {movement.reference_number ??
                                                        movement.reference ??
                                                        "-"}
                                                </td>

                                                <td
                                                    className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                                                        isNegative
                                                            ? "text-red-600"
                                                            : "text-emerald-600"
                                                    }`}
                                                >
                                                    {isNegative ? "-" : "+"}
                                                    {numberFormat(
                                                        movement.quantity,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {movement.supplier?.name ??
                                                        "-"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {movement.user?.name ?? "-"}
                                                </td>

                                                <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                                                    {movement.notes ?? "-"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <ClipboardList className="h-8 w-8 opacity-50" />
                                                <p>
                                                    Belum ada riwayat movement
                                                    untuk produk ini.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Menampilkan {movements.from ?? 0}–
                            {movements.to ?? 0} dari {movements.total} transaksi
                        </p>

                        <div className="flex flex-wrap gap-1">
                            {movements.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => goToPage(link.url)}
                                    className={`min-w-9 rounded-lg border px-3 py-2 text-sm ${
                                        link.active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border hover:bg-muted"
                                    } disabled:cursor-not-allowed disabled:opacity-40`}
                                >
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
