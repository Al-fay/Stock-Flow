import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    CheckCircle2,
    Wallet,
    AlertTriangle,
    MoreHorizontal,
    LogOut,
    Plus,
    Filter,
    CalendarDays,
    Minus,
    TrendingUp,
    TrendingDown,
    PackagePlus,
    ArrowDownToLine,
    ArrowUpFromLine,
    ClipboardList,
    Activity,
} from "lucide-react";
import StockFlowForecast, {
    type StockFlowForecast as StockFlowForecastData,
} from "@/pages/dashboard/stock-flow-forecast";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    initialForm,
    ProductForm,
    ProductPageProps,
} from "../master-data/products";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { SharedPropsUser } from "@/types/user";

interface KpiComparisonItem {
    current: number;
    previous: number;
    change_value: number;
    change: number;
    trend: "up" | "down" | "neutral";
}

interface KpiComparisonProps {
    new_products: KpiComparisonItem;
    stock_in: KpiComparisonItem;
    stock_out: KpiComparisonItem;
    stock_adjustments: KpiComparisonItem;
    stock_movements: KpiComparisonItem;
}

interface DashboardProps extends Pick<
    ProductPageProps,
    "categories" | "units"
> {
    periodFilter: {
        period: string;
        date_from: string | null;
        date_to: string | null;
    };
    kpiComparison: KpiComparisonProps;
    stockFlowForecast: StockFlowForecastData;
    stats: {
        total_products: number;
        active_products: number;
        stock_value: number;
        low_stock: number;
    };
    inventorySummary: { name: string; value: number; color: string }[];
    chart: { day: string; value: number }[];
    movementChart: {
        day: string;
        date: string;
        in: number;
        out: number;
        adjustment_in: number;
        adjustment_out: number;
    }[];
    categoryInventory: {
        id: number;
        name: string;
        products_count: number;
        total_stock: number;
        inventory_value: number;
    }[];
    criticalProducts: {
        id: number;
        name: string;
        sku: string;
        category: string;
        unit: string | null;
        stock: number;
        minimum_stock: number;
        status: "Low Stock" | "Out of Stock";
    }[];
    topProducts: {
        id: number;
        name: string;
        sku: string;
        category: string;
        unit: string | null;
        stock: number;
        inventory_value: number;
    }[];
    recentProducts: {
        id: number;
        name: string;
        sku: string;
        category: string;
        unit: string | null;
        stock: number;
        price: number;
        status: "In Stock" | "Low Stock" | "Out of Stock";
    }[];
    recentMovements: {
        id: number;
        reference_number: string;
        movement_type: string;
        quantity: number;
        notes: string | null;
        created_at: string | null;
        product: {
            name: string;
            sku: string;
        };
        user: string;
    }[];
}

type ComparisonMetric = {
    title: string;
    description: string;
    icon: React.ElementType;
    data: KpiComparisonItem;
    format?: "number" | "quantity";
    inverse?: boolean;
};

function KpiComparisonCard({
    title,
    description,
    icon: Icon,
    data,
    format = "number",
    inverse = false,
}: ComparisonMetric) {
    const isPositive = inverse ? data.change < 0 : data.change > 0;

    const isNegative = inverse ? data.change > 0 : data.change < 0;

    const isNeutral = data.change === 0;

    const trendColor = isNeutral
        ? "text-muted-foreground"
        : isPositive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400";

    const trendBg = isNeutral
        ? "bg-muted"
        : isPositive
          ? "bg-emerald-500/10"
          : "bg-red-500/10";

    const TrendIcon = isNeutral
        ? Minus
        : data.change > 0
          ? TrendingUp
          : TrendingDown;

    const formatValue = (value: number) => {
        if (format === "quantity") {
            return new Intl.NumberFormat("id-ID", {
                maximumFractionDigits: 3,
            }).format(value);
        }

        return new Intl.NumberFormat("id-ID", {
            maximumFractionDigits: 0,
        }).format(value);
    };

    const changePrefix = data.change > 0 ? "+" : "";

    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                            {title}
                        </p>

                        <p className="text-xs text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                        <Icon className="size-5" />
                    </div>
                </div>

                <div className="mt-5">
                    <p className="text-2xl font-bold tracking-tight">
                        {formatValue(data.current)}
                    </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${trendBg} ${trendColor}`}
                    >
                        <TrendIcon className="size-3.5" />

                        <span>
                            {changePrefix}
                            {data.change.toLocaleString("id-ID", {
                                maximumFractionDigits: 2,
                            })}
                            %
                        </span>
                    </div>

                    <span className="text-xs text-muted-foreground">
                        vs {formatValue(data.previous)} previous
                    </span>
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                    Difference:{" "}
                    <span className={trendColor}>
                        {data.change_value > 0 ? "+" : ""}
                        {formatValue(data.change_value)}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

const rupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n);

const statusClass: Record<string, string> = {
    "In Stock": "border-emerald-500/30 text-emerald-600",
    "Low Stock": "border-amber-500/30 text-amber-600",
    "Out of Stock": "border-red-500/30 text-red-600",
};

export default function Dashboard({
    periodFilter,
    categories = [],
    units = [],
    stats,
    inventorySummary,
    chart,
    movementChart,
    categoryInventory,
    topProducts,
    criticalProducts,
    recentProducts,
    recentMovements,
    kpiComparison,
    stockFlowForecast,
}: DashboardProps) {
    const { auth } = usePage<SharedPropsUser>().props;
    const form = useForm<ProductForm>(initialForm);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(periodFilter.period);
    const [dateFrom, setDateFrom] = useState(periodFilter.date_from ?? "");
    const [dateTo, setDateTo] = useState(periodFilter.date_to ?? "");

    const statCards = [
        {
            title: "Total Products",
            value: stats.total_products.toLocaleString("id-ID"),
            note: "Semua produk",
            icon: Package,
        },
        {
            title: "Active Products",
            value: stats.active_products.toLocaleString("id-ID"),
            note: "Produk aktif",
            icon: CheckCircle2,
        },
        {
            title: "Stock Value",
            value: rupiah(stats.stock_value),
            note: "Stok × harga beli",
            icon: Wallet,
        },
        {
            title: "Low Stock",
            value: stats.low_stock.toLocaleString("id-ID"),
            note: "Needs attention",
            icon: AlertTriangle,
        },
    ];

    const maxChart = Math.max(...chart.map((c) => c.value), 1);

    const maxMovement = Math.max(
        ...movementChart.flatMap((item) => [
            item.in,
            item.out,
            item.adjustment_in,
            item.adjustment_out,
        ]),
        1,
    );

    const maxCategoryValue = Math.max(
        ...categoryInventory.map((category) => category.inventory_value),
        1,
    );

    const maxProductStock = Math.max(
        ...topProducts.map((product) => product.stock),
        1,
    );

    const handleLogout = () => {
        router.post("/logout");
    };

    const handlePeriodChange = (value: string) => {
        setSelectedPeriod(value);

        if (value !== "custom") {
            setDateFrom("");
            setDateTo("");
        }
    };

    const applyPeriodFilter = () => {
        if (selectedPeriod === "custom") {
            if (!dateFrom || !dateTo) {
                toast.error("Tanggal belum lengkap", {
                    description: "Silakan pilih tanggal awal dan akhir.",
                });

                return;
            }

            if (dateFrom > dateTo) {
                toast.error("Rentang tanggal tidak valid", {
                    description:
                        "Tanggal awal tidak boleh melebihi tanggal akhir.",
                });

                return;
            }
        }

        router.get(
            "/dashboard",
            {
                period: selectedPeriod,
                ...(selectedPeriod === "custom"
                    ? {
                          date_from: dateFrom,
                          date_to: dateTo,
                      }
                    : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleAddProduct = () => {
        form.reset();
        form.clearErrors();
        form.setData(initialForm);
        setModalOpen(true);
    };

    const closeModal = () => {
        if (form.processing) return;

        setModalOpen(false);
        form.reset();
        form.clearErrors();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Berhasil ditambahkan", {
                    description: "Produk baru berhasil ditambahkan.",
                });

                setModalOpen(false);
                form.reset();
            },
            onError: () => {
                toast.error("Gagal menyimpan", {
                    description:
                        "Periksa kembali data produk yang kamu masukkan.",
                });
            },
        };

        form.post("/master-data/products", options);
    };

    return (
        <>
            <Head title="Dashboard" />

            <DashboardLayout>
                <div className="space-y-8">
                    {/* PAGE HEADER */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Dashboard
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Selamat datang, {auth.user?.name ?? "User"}!
                                Berikut ringkasan dashboard Anda.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* LOGOUT */}
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-lg"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 size-4" />
                                Logout
                            </Button>

                            {/* ADD PRODUCT */}
                            <Button
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                                onClick={handleAddProduct}
                            >
                                <Plus className="mr-2 size-4" />
                                Add Product
                            </Button>
                        </div>
                    </div>

                    {/* DASHBOARD PERIOD FILTER */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="size-5 text-muted-foreground" />

                                    <div>
                                        <p className="text-sm font-semibold">
                                            Dashboard Period
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Filter periode data analytics
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                    <div className="w-full sm:w-48">
                                        <label className="mb-1.5 block text-xs font-medium">
                                            Periode
                                        </label>

                                        <select
                                            className="form-input"
                                            value={selectedPeriod}
                                            onChange={(e) =>
                                                handlePeriodChange(
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="today">Today</option>
                                            <option value="7days">
                                                Last 7 Days
                                            </option>
                                            <option value="30days">
                                                Last 30 Days
                                            </option>
                                            <option value="this_month">
                                                This Month
                                            </option>
                                            <option value="this_year">
                                                This Year
                                            </option>
                                            <option value="custom">
                                                Custom Range
                                            </option>
                                        </select>
                                    </div>

                                    {selectedPeriod === "custom" && (
                                        <>
                                            <div className="w-full sm:w-40">
                                                <label className="mb-1.5 block text-xs font-medium">
                                                    Start Date
                                                </label>

                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={dateFrom}
                                                    onChange={(e) =>
                                                        setDateFrom(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="w-full sm:w-40">
                                                <label className="mb-1.5 block text-xs font-medium">
                                                    End Date
                                                </label>

                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={dateTo}
                                                    min={dateFrom || undefined}
                                                    onChange={(e) =>
                                                        setDateTo(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}

                                    <Button
                                        type="button"
                                        onClick={applyPeriodFilter}
                                        className="w-full sm:w-auto"
                                    >
                                        <Filter className="mr-2 size-4" />
                                        Apply Filter
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KPI COMPARISON */}
                    <section className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold tracking-tight">
                                KPI Comparison
                            </h2>

                            <p className="text-sm text-muted-foreground">
                                Compare performance with the previous period.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <KpiComparisonCard
                                title="New Products"
                                description="Newly registered products"
                                icon={PackagePlus}
                                data={kpiComparison.new_products}
                            />

                            <KpiComparisonCard
                                title="Stock In"
                                description="Incoming stock quantity"
                                icon={ArrowDownToLine}
                                data={kpiComparison.stock_in}
                                format="quantity"
                            />

                            <KpiComparisonCard
                                title="Stock Out"
                                description="Outgoing stock quantity"
                                icon={ArrowUpFromLine}
                                data={kpiComparison.stock_out}
                                format="quantity"
                                inverse
                            />

                            <KpiComparisonCard
                                title="Stock Adjustments"
                                description="Net adjustment quantity"
                                icon={ClipboardList}
                                data={kpiComparison.stock_adjustments}
                                format="quantity"
                            />

                            <KpiComparisonCard
                                title="Stock Movements"
                                description="Total movement transactions"
                                icon={Activity}
                                data={kpiComparison.stock_movements}
                            />
                        </div>
                    </section>

                    {/* STATISTICS */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {statCards.map((stat) => {
                            const Icon = stat.icon;

                            return (
                                <Card key={stat.title}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            {stat.title}
                                        </CardTitle>

                                        <Icon className="size-5 text-muted-foreground" />
                                    </CardHeader>

                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {stat.value}
                                        </div>

                                        <div className="mt-2 text-xs text-muted-foreground">
                                            {stat.note}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* STOCK FLOW FORECAST */}
                    <StockFlowForecast data={stockFlowForecast} />

                    {/* ANALYTICS */}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-7">
                        {/* NEW PRODUCTS CHART */}
                        <Card className="xl:col-span-4">
                            <CardHeader>
                                <CardTitle>New Products</CardTitle>

                                <p className="text-sm text-muted-foreground">
                                    Produk ditambahkan 7 hari terakhir
                                </p>
                            </CardHeader>

                            <CardContent>
                                <div className="flex h-64 items-end justify-around gap-4 border-b pb-2">
                                    {chart.map((item) => (
                                        <div
                                            key={item.day}
                                            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                                        >
                                            <span className="text-xs font-medium">
                                                {item.value}
                                            </span>

                                            <div
                                                className="w-full max-w-12 rounded-t-md bg-primary transition-all hover:opacity-70"
                                                style={{
                                                    height: `${(item.value / maxChart) * 80}%`,
                                                    minHeight: item.value
                                                        ? 4
                                                        : 0,
                                                }}
                                                title={`${item.value} produk`}
                                            />

                                            <span className="text-xs text-muted-foreground">
                                                {item.day}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* INVENTORY SUMMARY */}
                        <Card className="xl:col-span-3">
                            <CardHeader>
                                <CardTitle>Inventory Summary</CardTitle>

                                <p className="text-sm text-muted-foreground">
                                    Current stock distribution
                                </p>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {inventorySummary.map((item) => (
                                    <div key={item.name} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>{item.name}</span>

                                            <span className="font-semibold">
                                                {item.value}%
                                            </span>
                                        </div>

                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={`h-full rounded-full ${item.color}`}
                                                style={{
                                                    width: `${item.value}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* CATEGORY & TOP PRODUCTS ANALYTICS */}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {/* INVENTORY VALUE BY CATEGORY */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Inventory by Category</CardTitle>

                                <p className="text-sm text-muted-foreground">
                                    Nilai persediaan berdasarkan kategori
                                </p>
                            </CardHeader>

                            <CardContent>
                                {categoryInventory.length === 0 ? (
                                    <div className="py-10 text-center text-sm text-muted-foreground">
                                        Belum ada data kategori.
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {categoryInventory
                                            .slice(0, 8)
                                            .map((category) => (
                                                <div
                                                    key={category.id}
                                                    className="space-y-2"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">
                                                                {category.name}
                                                            </p>

                                                            <p className="text-xs text-muted-foreground">
                                                                {category.products_count.toLocaleString(
                                                                    "id-ID",
                                                                )}{" "}
                                                                produk ·{" "}
                                                                {category.total_stock.toLocaleString(
                                                                    "id-ID",
                                                                )}{" "}
                                                                stok
                                                            </p>
                                                        </div>

                                                        <span className="shrink-0 text-sm font-semibold">
                                                            {rupiah(
                                                                category.inventory_value,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all"
                                                            style={{
                                                                width: `${
                                                                    (category.inventory_value /
                                                                        maxCategoryValue) *
                                                                    100
                                                                }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* TOP 10 PRODUCTS */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top 10 Products</CardTitle>

                                <p className="text-sm text-muted-foreground">
                                    Produk dengan jumlah stok terbanyak
                                </p>
                            </CardHeader>

                            <CardContent>
                                {topProducts.length === 0 ? (
                                    <div className="py-10 text-center text-sm text-muted-foreground">
                                        Belum ada data produk.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {topProducts.map((product, index) => (
                                            <div
                                                key={product.id}
                                                className="flex items-center gap-3"
                                            >
                                                {/* RANK */}
                                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                                                    {index + 1}
                                                </div>

                                                {/* PRODUCT INFO */}
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">
                                                                {product.name}
                                                            </p>

                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {product.sku} ·{" "}
                                                                {
                                                                    product.category
                                                                }
                                                            </p>
                                                        </div>

                                                        <div className="shrink-0 text-right">
                                                            <p className="text-sm font-semibold">
                                                                {product.stock.toLocaleString(
                                                                    "id-ID",
                                                                )}{" "}
                                                                {product.unit}
                                                            </p>

                                                            <p className="text-xs text-muted-foreground">
                                                                {rupiah(
                                                                    product.inventory_value,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* STOCK BAR */}
                                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary"
                                                            style={{
                                                                width: `${
                                                                    (product.stock /
                                                                        maxProductStock) *
                                                                    100
                                                                }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* STOCK ALERTS */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="size-5 text-amber-500" />
                                    Stock Alerts
                                </CardTitle>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Produk yang membutuhkan perhatian
                                </p>
                            </div>

                            <Badge
                                variant="outline"
                                className="border-amber-500/30 text-amber-600"
                            >
                                {criticalProducts.length} Products
                            </Badge>
                        </CardHeader>

                        <CardContent>
                            {criticalProducts.length === 0 ? (
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                                    <CheckCircle2 className="mx-auto size-8 text-emerald-500" />

                                    <p className="mt-2 text-sm font-medium">
                                        Semua stok dalam kondisi aman
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Tidak ada produk yang mencapai batas
                                        minimum.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[650px] text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="p-3">Product</th>
                                                <th className="p-3">SKU</th>
                                                <th className="p-3">
                                                    Category
                                                </th>
                                                <th className="p-3">
                                                    Current Stock
                                                </th>
                                                <th className="p-3">
                                                    Minimum Stock
                                                </th>
                                                <th className="p-3">Status</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {criticalProducts.map((product) => (
                                                <tr
                                                    key={product.id}
                                                    className="border-b last:border-0 hover:bg-muted/40"
                                                >
                                                    <td className="p-3 font-medium">
                                                        {product.name}
                                                    </td>

                                                    <td className="p-3 text-muted-foreground">
                                                        {product.sku}
                                                    </td>

                                                    <td className="p-3">
                                                        {product.category}
                                                    </td>

                                                    <td className="p-3 font-semibold">
                                                        {product.stock.toLocaleString(
                                                            "id-ID",
                                                        )}{" "}
                                                        {product.unit}
                                                    </td>

                                                    <td className="p-3">
                                                        {product.minimum_stock.toLocaleString(
                                                            "id-ID",
                                                        )}{" "}
                                                        {product.unit}
                                                    </td>

                                                    <td className="p-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                product.status ===
                                                                "Out of Stock"
                                                                    ? statusClass[
                                                                          "Out of Stock"
                                                                      ]
                                                                    : statusClass[
                                                                          "Low Stock"
                                                                      ]
                                                            }
                                                        >
                                                            {product.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* RECENT STOCK MOVEMENTS */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Stock Movements</CardTitle>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Aktivitas inventory terbaru
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.get("/inventory/stock-movement")
                                }
                            >
                                View All
                            </Button>
                        </CardHeader>

                        <CardContent>
                            {recentMovements.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    Belum ada aktivitas inventory.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[750px] text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="p-3">Date</th>
                                                <th className="p-3">
                                                    Reference
                                                </th>
                                                <th className="p-3">Product</th>
                                                <th className="p-3">Type</th>
                                                <th className="p-3">
                                                    Quantity
                                                </th>
                                                <th className="p-3">User</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {recentMovements.map((movement) => {
                                                const movementColors: Record<
                                                    string,
                                                    string
                                                > = {
                                                    IN: "border-emerald-500/30 text-emerald-600",
                                                    OUT: "border-blue-500/30 text-blue-600",
                                                    RETURN: "border-cyan-500/30 text-cyan-600",
                                                    ADJUSTMENT:
                                                        "border-amber-500/30 text-amber-600",
                                                    DAMAGE: "border-red-500/30 text-red-600",
                                                };

                                                return (
                                                    <tr
                                                        key={movement.id}
                                                        className="border-b last:border-0 hover:bg-muted/40"
                                                    >
                                                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                                                            {movement.created_at ??
                                                                "-"}
                                                        </td>

                                                        <td className="p-3 font-medium">
                                                            {movement.reference_number ||
                                                                "-"}
                                                        </td>

                                                        <td className="p-3">
                                                            <div className="font-medium">
                                                                {
                                                                    movement
                                                                        .product
                                                                        .name
                                                                }
                                                            </div>

                                                            <div className="text-xs text-muted-foreground">
                                                                {
                                                                    movement
                                                                        .product
                                                                        .sku
                                                                }
                                                            </div>
                                                        </td>

                                                        <td className="p-3">
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    movementColors[
                                                                        movement
                                                                            .movement_type
                                                                    ] ??
                                                                    "border-border text-muted-foreground"
                                                                }
                                                            >
                                                                {
                                                                    movement.movement_type
                                                                }
                                                            </Badge>
                                                        </td>

                                                        <td className="p-3 font-semibold">
                                                            {movement.quantity >
                                                            0
                                                                ? "+"
                                                                : ""}
                                                            {movement.quantity.toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </td>

                                                        <td className="p-3">
                                                            {movement.user}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* STOCK MOVEMENT ANALYTICS */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Stock Movement</CardTitle>

                            <p className="text-sm text-muted-foreground">
                                Pergerakan stok selama 7 hari terakhir
                            </p>
                        </CardHeader>

                        <CardContent>
                            {/* LEGEND */}
                            <div className="mb-6 flex flex-wrap gap-4">
                                {[
                                    {
                                        label: "Stock In",
                                        color: "bg-emerald-500",
                                    },
                                    {
                                        label: "Stock Out",
                                        color: "bg-blue-500",
                                    },
                                    {
                                        label: "Adjustment In",
                                        color: "bg-amber-500",
                                    },
                                    {
                                        label: "Adjustment Out",
                                        color: "bg-red-500",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center gap-2 text-xs text-muted-foreground"
                                    >
                                        <span
                                            className={`size-2.5 rounded-full ${item.color}`}
                                        />
                                        {item.label}
                                    </div>
                                ))}
                            </div>

                            {/* CHART */}
                            <div className="flex h-64 items-end justify-between gap-2 border-b pb-2 sm:gap-4">
                                {movementChart.map((item) => {
                                    const movements = [
                                        {
                                            key: "in",
                                            value: item.in,
                                            color: "bg-emerald-500",
                                        },
                                        {
                                            key: "out",
                                            value: item.out,
                                            color: "bg-blue-500",
                                        },
                                        {
                                            key: "adjustment_in",
                                            value: item.adjustment_in,
                                            color: "bg-amber-500",
                                        },
                                        {
                                            key: "adjustment_out",
                                            value: item.adjustment_out,
                                            color: "bg-red-500",
                                        },
                                    ];

                                    return (
                                        <div
                                            key={item.date}
                                            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                                        >
                                            {/* BARS */}
                                            <div className="flex h-full w-full items-end justify-center gap-1">
                                                {movements.map((movement) => (
                                                    <div
                                                        key={movement.key}
                                                        className={`w-full max-w-5 rounded-t-sm transition-all hover:opacity-70 ${movement.color}`}
                                                        style={{
                                                            height:
                                                                movement.value >
                                                                0
                                                                    ? `${(movement.value / maxMovement) * 85}%`
                                                                    : "0%",
                                                            minHeight:
                                                                movement.value >
                                                                0
                                                                    ? 3
                                                                    : 0,
                                                        }}
                                                        title={`${movement.key}: ${movement.value}`}
                                                    />
                                                ))}
                                            </div>

                                            {/* DAY LABEL */}
                                            <span className="text-xs text-muted-foreground">
                                                {item.day}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* TOTAL SUMMARY */}
                            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                                {[
                                    {
                                        label: "Total Stock In",
                                        value: movementChart.reduce(
                                            (total, item) => total + item.in,
                                            0,
                                        ),
                                        color: "text-emerald-600",
                                    },
                                    {
                                        label: "Total Stock Out",
                                        value: movementChart.reduce(
                                            (total, item) => total + item.out,
                                            0,
                                        ),
                                        color: "text-blue-600",
                                    },
                                    {
                                        label: "Adjustment In",
                                        value: movementChart.reduce(
                                            (total, item) =>
                                                total + item.adjustment_in,
                                            0,
                                        ),
                                        color: "text-amber-600",
                                    },
                                    {
                                        label: "Adjustment Out",
                                        value: movementChart.reduce(
                                            (total, item) =>
                                                total + item.adjustment_out,
                                            0,
                                        ),
                                        color: "text-red-600",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-xl border p-3"
                                    >
                                        <p className="text-xs text-muted-foreground">
                                            {item.label}
                                        </p>

                                        <p
                                            className={`mt-1 text-lg font-semibold ${item.color}`}
                                        >
                                            {item.value.toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* RECENT PRODUCTS */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Products</CardTitle>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Overview of your latest inventory products
                                </p>
                            </div>

                            <button
                                type="button"
                                className="text-sm font-medium text-primary hover:underline cursor-pointer"
                                onClick={() =>
                                    router.get("/master-data/products")
                                }
                            >
                                View all
                            </button>
                        </CardHeader>

                        <CardContent>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full min-w-[800px] text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="p-3">Product</th>
                                            <th className="p-3">SKU</th>
                                            <th className="p-3">Category</th>
                                            <th className="p-3">Stock</th>
                                            <th className="p-3">Price</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentProducts.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="p-6 text-center text-muted-foreground"
                                                >
                                                    Belum ada produk.
                                                </td>
                                            </tr>
                                        )}

                                        {recentProducts.map((product) => (
                                            <tr
                                                key={product.id}
                                                className="border-b last:border-0 hover:bg-muted/40"
                                            >
                                                <td className="p-3 font-medium">
                                                    {product.name}
                                                </td>

                                                <td className="p-3 text-muted-foreground">
                                                    {product.sku}
                                                </td>

                                                <td className="p-3">
                                                    {product.category}
                                                </td>

                                                <td className="p-3">
                                                    {product.stock}{" "}
                                                    {product.unit}
                                                </td>

                                                <td className="p-3">
                                                    {rupiah(product.price)}
                                                </td>

                                                <td className="p-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            statusClass[
                                                                product.status
                                                            ]
                                                        }
                                                    >
                                                        {product.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                        <div className="my-auto w-full max-w-3xl rounded-2xl border border-border bg-card shadow-xl">
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Tambah Produk
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Lengkapi informasi produk di bawah ini.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={form.processing}
                                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={submit}>
                                <div className="grid gap-5 p-6 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">
                                            SKU *
                                        </label>
                                        <input
                                            className="form-input"
                                            value={form.data.sku}
                                            onChange={(e) =>
                                                form.setData(
                                                    "sku",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: PRD-001"
                                            required
                                        />
                                        {form.errors.sku && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {form.errors.sku}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Barcode
                                        </label>
                                        <input
                                            className="form-input"
                                            value={form.data.barcode}
                                            onChange={(e) =>
                                                form.setData(
                                                    "barcode",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Masukkan barcode"
                                        />
                                        {form.errors.barcode && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {form.errors.barcode}
                                            </p>
                                        )}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Nama Produk *
                                        </label>
                                        <input
                                            className="form-input"
                                            value={form.data.name}
                                            onChange={(e) =>
                                                form.setData(
                                                    "name",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Masukkan nama produk"
                                            required
                                        />
                                        {form.errors.name && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {form.errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Kategori
                                        </label>
                                        <select
                                            className="form-input"
                                            value={form.data.category_id}
                                            onChange={(e) =>
                                                form.setData(
                                                    "category_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Tanpa kategori
                                            </option>
                                            {categories.map((category) => (
                                                <option
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        {form.errors.category_id && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {form.errors.category_id}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Satuan *
                                        </label>
                                        <select
                                            className="form-input"
                                            value={form.data.unit_id}
                                            onChange={(e) =>
                                                form.setData(
                                                    "unit_id",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Pilih satuan
                                            </option>
                                            {units.map((unit) => (
                                                <option
                                                    key={unit.id}
                                                    value={unit.id}
                                                >
                                                    {unit.name} ({unit.symbol})
                                                </option>
                                            ))}
                                        </select>
                                        {form.errors.unit_id && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {form.errors.unit_id}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Harga Beli *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-input"
                                            value={form.data.purchase_price}
                                            onChange={(e) =>
                                                form.setData(
                                                    "purchase_price",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        {form.errors.purchase_price && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {form.errors.purchase_price}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Harga Jual *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-input"
                                            value={form.data.selling_price}
                                            onChange={(e) =>
                                                form.setData(
                                                    "selling_price",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        {form.errors.selling_price && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {form.errors.selling_price}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Minimum Stok *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.001"
                                            className="form-input"
                                            value={form.data.minimum_stock}
                                            onChange={(e) =>
                                                form.setData(
                                                    "minimum_stock",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        {form.errors.minimum_stock && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {form.errors.minimum_stock}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Stok Saat Ini
                                        </label>
                                        <input
                                            className="form-input cursor-not-allowed bg-muted"
                                            value={"0"}
                                            disabled
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Stok diubah melalui modul Inventory.
                                        </p>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Deskripsi
                                        </label>
                                        <textarea
                                            className="form-input min-h-24 resize-y"
                                            value={form.data.description}
                                            onChange={(e) =>
                                                form.setData(
                                                    "description",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Deskripsi produk (opsional)"
                                        />
                                        {form.errors.description && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {form.errors.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl border border-border p-4 sm:col-span-2">
                                        <div>
                                            <p className="text-sm font-medium">
                                                Status Produk
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Aktifkan jika produk dapat
                                                digunakan.
                                            </p>
                                        </div>

                                        <Switch
                                            checked={form.data.is_active}
                                            onCheckedChange={(checked) =>
                                                form.setData(
                                                    "is_active",
                                                    checked,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={form.processing}
                                        className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                                    >
                                        Batal
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {form.processing
                                            ? "Menyimpan..."
                                            : "Tambah Produk"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </DashboardLayout>
        </>
    );
}
