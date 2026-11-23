import DashboardLayout from "@/layouts/dashboard-layout";
import { Head } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowDownToLine,
    ArrowLeftRight,
    Boxes,
    Package,
    Wallet,
} from "lucide-react";

interface Summary {
    total_products: number;
    total_stock: number | string;
    inventory_value: number | string;
    low_stock_count: number;
    out_of_stock_count: number;
}
interface LowStockProduct {
    id: number;
    sku: string;
    name: string;
    stock: number | string;
    minimum_stock: number | string;
    category: {
        id: number;
        name: string;
    } | null;
    unit: {
        id: number;
        name: string;
        symbol: string;
    } | null;
}

interface MovementChartItem {
    date: string;
    label: string;
    stock_in: number;
    stock_out: number;
}

interface RecentMovement {
    id: number;
    movement_type: "IN" | "OUT" | "ADJUSTMENT" | "DAMAGE";
    quantity: number | string;
    reference_number: string | null;
    notes: string | null;
    created_at: string;
    product: {
        id: number;
        sku: string;
        name: string;
    } | null;
    supplier: {
        id: number;
        code: string;
        name: string;
    } | null;
    user: {
        id: number;
        name: string;
    } | null;
}

interface OverviewProps {
    summary: Summary;
    lowStockProducts: LowStockProduct[];
    movementChart: MovementChartItem[];
    recentMovements: RecentMovement[];
}

const formatNumber = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(Number(value));

const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value));

const formatDate = (value: string) =>
    new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

const movementLabels = {
    IN: "Stok Masuk",
    OUT: "Stok Keluar",
    ADJUSTMENT: "Penyesuaian",
    DAMAGE: "Barang Rusak",
};

function SummaryCard({
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
        <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-2 wrap-break-word text-2xl font-bold tracking-tight">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className={`rounded-xl p-3 ${iconClass}`}>
                    <Icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

function MovementChart({ data }: { data: MovementChartItem[] }) {
    const maxValue = Math.max(
        1,
        ...data.flatMap((item) => [item.stock_in, item.stock_out]),
    );

    return (
        <div>
            <div className="mb-5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full bg-primary" />
                    Stok Masuk
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full bg-orange-500" />
                    Stok Keluar
                </div>
            </div>

            <div className="flex h-64 items-end gap-2 sm:gap-4">
                {data.map((item) => (
                    <div
                        key={item.date}
                        className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    >
                        <div className="flex h-52 w-full items-end justify-center gap-1">
                            <div
                                title={`Masuk: ${formatNumber(item.stock_in)}`}
                                className="w-full max-w-7 rounded-t-md bg-primary transition-all"
                                style={{
                                    height: `${Math.max(
                                        item.stock_in > 0 ? 3 : 0,
                                        (item.stock_in / maxValue) * 100,
                                    )}%`,
                                }}
                            />
                            <div
                                title={`Keluar: ${formatNumber(item.stock_out)}`}
                                className="w-full max-w-7 rounded-t-md bg-orange-500 transition-all"
                                style={{
                                    height: `${Math.max(
                                        item.stock_out > 0 ? 3 : 0,
                                        (item.stock_out / maxValue) * 100,
                                    )}%`,
                                }}
                            />
                        </div>

                        <span className="text-center text-[11px] text-muted-foreground sm:text-xs">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {data.length === 0 && (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                    Belum ada data pergerakan stok.
                </div>
            )}
        </div>
    );
}

export default function InventoryOverview({
    summary,
    lowStockProducts,
    movementChart,
    recentMovements,
}: OverviewProps) {
    return (
        <>
            <Head title="Stock Overview" />

            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Stock Overview
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Pantau kondisi persediaan dan aktivitas stok secara
                            keseluruhan.
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            title="Total Produk Aktif"
                            value={formatNumber(summary.total_products)}
                            description="Jumlah produk aktif"
                            icon={Package}
                            iconClass="bg-primary/10 text-primary"
                        />

                        <SummaryCard
                            title="Total Stok"
                            value={formatNumber(summary.total_stock)}
                            description="Akumulasi kuantitas persediaan"
                            icon={Boxes}
                            iconClass="bg-blue-500/10 text-blue-600"
                        />

                        <SummaryCard
                            title="Nilai Persediaan"
                            value={formatCurrency(summary.inventory_value)}
                            description="Berdasarkan harga beli"
                            icon={Wallet}
                            iconClass="bg-green-500/10 text-green-600"
                        />

                        <SummaryCard
                            title="Stok Menipis"
                            value={formatNumber(summary.low_stock_count)}
                            description="Produk pada atau di bawah stok minimum"
                            icon={AlertTriangle}
                            iconClass="bg-amber-500/10 text-amber-600"
                        />
                    </div>

                    {/* Stock Status */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-red-500/10 p-3">
                                    <ArrowDownToLine className="size-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Produk Habis
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {formatNumber(
                                            summary.out_of_stock_count,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <ArrowLeftRight className="size-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Transaksi Terbaru
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {recentMovements.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Movement Chart */}
                    <section className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-6">
                            <h2 className="font-semibold">Pergerakan Stok</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Perbandingan stok masuk dan keluar selama 7 hari
                                terakhir.
                            </p>
                        </div>

                        <MovementChart data={movementChart} />
                    </section>

                    {/* Low Stock Products */}
                    <section className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                            <div>
                                <h2 className="font-semibold">
                                    Produk Stok Menipis
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Produk yang perlu segera diperhatikan.
                                </p>
                            </div>

                            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
                                {lowStockProducts.length} produk
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                                        <th className="px-5 py-3 font-medium">
                                            Produk
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Kategori
                                        </th>
                                        <th className="px-5 py-3 text-right font-medium">
                                            Stok
                                        </th>
                                        <th className="px-5 py-3 text-right font-medium">
                                            Minimum
                                        </th>
                                        <th className="px-5 py-3 text-right font-medium">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {lowStockProducts.map((product) => {
                                        const stock = Number(product.stock);
                                        const minimum = Number(
                                            product.minimum_stock,
                                        );

                                        return (
                                            <tr
                                                key={product.id}
                                                className="border-b border-border last:border-0"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-medium">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {product.sku}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 text-muted-foreground">
                                                    {product.category?.name ??
                                                        "-"}
                                                </td>

                                                <td className="px-5 py-4 text-right font-semibold tabular-nums">
                                                    {formatNumber(stock)}{" "}
                                                    {product.unit?.symbol ?? ""}
                                                </td>

                                                <td className="px-5 py-4 text-right tabular-nums text-muted-foreground">
                                                    {formatNumber(minimum)}
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            stock <= 0
                                                                ? "bg-red-500/10 text-red-600"
                                                                : "bg-amber-500/10 text-amber-600"
                                                        }`}
                                                    >
                                                        {stock <= 0
                                                            ? "Habis"
                                                            : "Menipis"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {lowStockProducts.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-5 py-10 text-center text-muted-foreground"
                                            >
                                                Semua produk memiliki stok di
                                                atas batas minimum.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Recent Movements */}
                    <section className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="border-b border-border p-5">
                            <h2 className="font-semibold">
                                Transaksi Stok Terbaru
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Aktivitas pergerakan stok yang terakhir dicatat.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                                        <th className="px-5 py-3 font-medium">
                                            Tanggal
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Produk
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Jenis
                                        </th>
                                        <th className="px-5 py-3 text-right font-medium">
                                            Perubahan
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Petugas
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recentMovements.map((movement) => {
                                        const quantity = Number(
                                            movement.quantity,
                                        );

                                        return (
                                            <tr
                                                key={movement.id}
                                                className="border-b border-border last:border-0"
                                            >
                                                <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                                                    {formatDate(
                                                        movement.created_at,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-medium">
                                                        {movement.product
                                                            ?.name ?? "-"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {movement.product
                                                            ?.sku ?? "-"}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="text-muted-foreground">
                                                        {
                                                            movementLabels[
                                                                movement
                                                                    .movement_type
                                                            ]
                                                        }
                                                    </span>
                                                </td>

                                                <td
                                                    className={`px-5 py-4 text-right font-semibold tabular-nums ${
                                                        quantity > 0
                                                            ? "text-green-600"
                                                            : quantity < 0
                                                              ? "text-red-600"
                                                              : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {quantity > 0 ? "+" : ""}
                                                    {formatNumber(quantity)}
                                                </td>

                                                <td className="px-5 py-4 text-muted-foreground">
                                                    {movement.user?.name ?? "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {recentMovements.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-5 py-10 text-center text-muted-foreground"
                                            >
                                                Belum ada transaksi stok.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </DashboardLayout>
        </>
    );
}
