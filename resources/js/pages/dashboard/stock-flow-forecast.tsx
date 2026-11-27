import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Package,
    PackageCheck,
    PackageMinus,
    PackagePlus,
    TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

export interface ForecastProduct {
    id: number;
    name: string;
    sku: string;
    category: string;
    unit: string;
    stock: number;
    minimum_stock: number;
    total_out: number;
    average_daily_out: number;
    coverage_days: number | null;
    target_stock: number;
    recommended_quantity: number;
    status: "out_of_stock" | "critical" | "low" | "below_minimum" | "healthy";
    priority: number;
}

export interface StockFlowForecast {
    meta: {
        analysis_days: number;
        target_coverage_days: number;
        critical_days: number;
        low_stock_days: number;
        start_date: string;
        end_date: string;
    };

    summary: {
        total_products_analyzed: number;
        out_of_stock: number;
        critical: number;
        low_stock: number;
        below_minimum: number;
        healthy: number;
        products_to_restock: number;
        total_recommended_quantity: number;
    };

    restockRecommendations: ForecastProduct[];
    fastMovingProducts: ForecastProduct[];
    products: ForecastProduct[];
}

interface Props {
    data: StockFlowForecast;
}

const numberFormat = (value: number) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(value ?? 0);

const statusConfig: Record<
    ForecastProduct["status"],
    {
        label: string;
        className: string;
    }
> = {
    out_of_stock: {
        label: "Out of Stock",
        className: "border-red-500/30 bg-red-500/10 text-red-600",
    },
    critical: {
        label: "Critical",
        className: "border-red-500/30 bg-red-500/10 text-red-600",
    },
    low: {
        label: "Low Stock",
        className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    },
    below_minimum: {
        label: "Below Minimum",
        className: "border-orange-500/30 bg-orange-500/10 text-orange-600",
    },
    healthy: {
        label: "Healthy",
        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    },
};

function StatusBadge({ status }: { status: ForecastProduct["status"] }) {
    const config = statusConfig[status];

    return (
        <Badge variant="outline" className={config.className}>
            {config.label}
        </Badge>
    );
}

function CoverageBadge({
    days,
    status,
}: {
    days: number | null;
    status: ForecastProduct["status"];
}) {
    if (days === null) {
        return (
            <span className="text-xs text-muted-foreground">
                No demand data
            </span>
        );
    }

    const color =
        status === "critical" || status === "out_of_stock"
            ? "text-red-600"
            : status === "low"
              ? "text-amber-600"
              : "text-emerald-600";

    return (
        <span className={`font-medium ${color}`}>
            {numberFormat(days)} days
        </span>
    );
}

function SummaryCard({
    title,
    value,
    description,
    icon: Icon,
    color,
}: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <Card>
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">
                            {title}
                        </p>

                        <p className="mt-2 text-2xl font-bold tracking-tight">
                            {value}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <div className={`rounded-xl bg-muted p-2.5 ${color}`}>
                        <Icon className="size-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RecommendationTable({ products }: { products: ForecastProduct[] }) {
    if (products.length === 0) {
        return (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                <CheckCircle2 className="mx-auto size-9 text-emerald-500" />

                <p className="mt-3 font-medium">
                    Tidak ada rekomendasi restock
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                    Seluruh produk memiliki stok yang cukup berdasarkan
                    perhitungan forecast saat ini.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
                <thead>
                    <tr className="border-b text-left text-muted-foreground">
                        <th className="p-3">Product</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Current Stock</th>
                        <th className="p-3">Daily Demand</th>
                        <th className="p-3">Coverage</th>
                        <th className="p-3">Target Stock</th>
                        <th className="p-3">Recommended Qty</th>
                        <th className="p-3">Status</th>
                    </tr>
                </thead>

                <tbody>
                    {products.map((product) => (
                        <tr
                            key={product.id}
                            className="border-b last:border-0 hover:bg-muted/40"
                        >
                            <td className="p-3">
                                <div className="font-medium">
                                    {product.name}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    {product.sku}
                                </div>
                            </td>

                            <td className="p-3">{product.category}</td>

                            <td className="p-3 font-semibold">
                                {numberFormat(product.stock)} {product.unit}
                            </td>

                            <td className="p-3">
                                {numberFormat(product.average_daily_out)}{" "}
                                {product.unit}/day
                            </td>

                            <td className="p-3">
                                <CoverageBadge
                                    days={product.coverage_days}
                                    status={product.status}
                                />
                            </td>

                            <td className="p-3">
                                {numberFormat(product.target_stock)}{" "}
                                {product.unit}
                            </td>

                            <td className="p-3">
                                <span className="font-semibold text-primary">
                                    +
                                    {numberFormat(product.recommended_quantity)}{" "}
                                    {product.unit}
                                </span>
                            </td>

                            <td className="p-3">
                                <StatusBadge status={product.status} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function FastMovingList({ products }: { products: ForecastProduct[] }) {
    if (products.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                Belum terdapat pergerakan Stock Out pada periode analisis.
            </div>
        );
    }

    const maxOut = Math.max(...products.map((product) => product.total_out), 1);

    return (
        <div className="space-y-4">
            {products.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                        {index + 1}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {product.name}
                                </p>

                                <p className="truncate text-xs text-muted-foreground">
                                    {product.sku} · {product.category}
                                </p>
                            </div>

                            <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold">
                                    {numberFormat(product.total_out)}{" "}
                                    {product.unit}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    {numberFormat(product.average_daily_out)}
                                    /day
                                </p>
                            </div>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                    width: `${(product.total_out / maxOut) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ForecastStatusOverview({ data }: { data: StockFlowForecast }) {
    const statuses = [
        {
            label: "Out of Stock",
            value: data.summary.out_of_stock,
            color: "bg-red-500",
        },
        {
            label: "Critical",
            value: data.summary.critical,
            color: "bg-rose-500",
        },
        {
            label: "Low Stock",
            value: data.summary.low_stock,
            color: "bg-amber-500",
        },
        {
            label: "Below Minimum",
            value: data.summary.below_minimum,
            color: "bg-orange-500",
        },
        {
            label: "Healthy",
            value: data.summary.healthy,
            color: "bg-emerald-500",
        },
    ];

    const total = Math.max(data.summary.total_products_analyzed, 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Forecast Status Overview</CardTitle>

                <p className="text-sm text-muted-foreground">
                    Kondisi produk berdasarkan stock coverage
                </p>
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                    {statuses.map(
                        (status) =>
                            status.value > 0 && (
                                <div
                                    key={status.label}
                                    className={`${status.color} transition-all`}
                                    style={{
                                        width: `${(status.value / total) * 100}%`,
                                    }}
                                    title={`${status.label}: ${status.value}`}
                                />
                            ),
                    )}
                </div>

                <div className="space-y-3">
                    {statuses.map((status) => (
                        <div
                            key={status.label}
                            className="flex items-center justify-between gap-3"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`size-2.5 rounded-full ${status.color}`}
                                />

                                <span className="text-sm">{status.label}</span>
                            </div>

                            <span className="text-sm font-semibold">
                                {status.value.toLocaleString("id-ID")}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function StockFlowForecast({ data }: Props) {
    const summary = data.summary;

    return (
        <section className="space-y-5">
            {/* HEADER */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                        Stock Flow Forecast
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Trend analysis, stock coverage, dan rekomendasi restock
                        berbasis histori Stock Out.
                    </p>
                </div>

                <Badge variant="outline" className="w-fit">
                    {data.meta.analysis_days} Days Analysis
                </Badge>
            </div>

            {/* FORECAST KPI */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    title="Products Analyzed"
                    value={summary.total_products_analyzed.toLocaleString(
                        "id-ID",
                    )}
                    description="Active products"
                    icon={Package}
                    color="text-primary"
                />

                <SummaryCard
                    title="Out of Stock"
                    value={summary.out_of_stock.toLocaleString("id-ID")}
                    description="Produk tanpa stok"
                    icon={PackageMinus}
                    color="text-red-600"
                />

                <SummaryCard
                    title="Critical Stock"
                    value={summary.critical.toLocaleString("id-ID")}
                    description={`Coverage ≤ ${data.meta.critical_days} days`}
                    icon={AlertTriangle}
                    color="text-red-600"
                />

                <SummaryCard
                    title="Low Stock"
                    value={summary.low_stock.toLocaleString("id-ID")}
                    description={`Coverage ≤ ${data.meta.low_stock_days} days`}
                    icon={Clock}
                    color="text-amber-600"
                />

                <SummaryCard
                    title="Need Restock"
                    value={summary.products_to_restock.toLocaleString("id-ID")}
                    description="Products requiring replenishment"
                    icon={PackagePlus}
                    color="text-primary"
                />
            </div>

            {/* RESTOCK + STATUS */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-7">
                <Card className="xl:col-span-4">
                    <CardHeader>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <PackagePlus className="size-5 text-primary" />
                                    Restock Recommendations
                                </CardTitle>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Produk dengan kebutuhan replenishment
                                    tertinggi.
                                </p>
                            </div>

                            <Badge variant="outline">
                                {data.restockRecommendations.length} Products
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <RecommendationTable
                            products={data.restockRecommendations}
                        />
                    </CardContent>
                </Card>

                <div className="xl:col-span-3">
                    <ForecastStatusOverview data={data} />
                </div>
            </div>

            {/* FAST MOVING */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="size-5 text-primary" />
                            Fast Moving Products
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Produk dengan Stock Out terbanyak selama{" "}
                            {data.meta.analysis_days} hari terakhir.
                        </p>
                    </CardHeader>

                    <CardContent>
                        <FastMovingList products={data.fastMovingProducts} />
                    </CardContent>
                </Card>

                {/* COVERAGE */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PackageCheck className="size-5 text-primary" />
                            Stock Coverage
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Estimasi ketahanan stok berdasarkan rata-rata demand
                            harian.
                        </p>
                    </CardHeader>

                    <CardContent>
                        {data.products.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Belum ada data forecast.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.products
                                    .filter(
                                        (product) =>
                                            product.coverage_days !== null,
                                    )
                                    .slice(0, 8)
                                    .map((product) => {
                                        const coverage =
                                            product.coverage_days ?? 0;

                                        const width = Math.min(
                                            (coverage /
                                                data.meta
                                                    .target_coverage_days) *
                                                100,
                                            100,
                                        );

                                        const color =
                                            coverage <= data.meta.critical_days
                                                ? "bg-red-500"
                                                : coverage <=
                                                    data.meta.low_stock_days
                                                  ? "bg-amber-500"
                                                  : "bg-emerald-500";

                                        return (
                                            <div
                                                key={product.id}
                                                className="space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="min-w-0 truncate text-sm font-medium">
                                                        {product.name}
                                                    </p>

                                                    <span className="shrink-0 text-xs font-semibold">
                                                        {numberFormat(coverage)}{" "}
                                                        days
                                                    </span>
                                                </div>

                                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className={`h-full rounded-full ${color}`}
                                                        style={{
                                                            width: `${width}%`,
                                                        }}
                                                    />
                                                </div>

                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        Stock:{" "}
                                                        {numberFormat(
                                                            product.stock,
                                                        )}{" "}
                                                        {product.unit}
                                                    </span>

                                                    <span>
                                                        Target:{" "}
                                                        {
                                                            data.meta
                                                                .target_coverage_days
                                                        }{" "}
                                                        days
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ALL FORECAST PRODUCTS */}
            <Card>
                <CardHeader>
                    <CardTitle>Complete Forecast Analysis</CardTitle>

                    <p className="text-sm text-muted-foreground">
                        Detail hasil analisis seluruh produk aktif.
                    </p>
                </CardHeader>

                <CardContent>
                    {data.products.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Tidak ada produk untuk dianalisis.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="p-3">Product</th>
                                        <th className="p-3">Stock</th>
                                        <th className="p-3">Min. Stock</th>
                                        <th className="p-3">30D Out</th>
                                        <th className="p-3">Daily Demand</th>
                                        <th className="p-3">Coverage</th>
                                        <th className="p-3">Target</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.products.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="border-b last:border-0 hover:bg-muted/40"
                                        >
                                            <td className="p-3">
                                                <div className="font-medium">
                                                    {product.name}
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    {product.sku}
                                                </div>
                                            </td>

                                            <td className="p-3 font-medium">
                                                {numberFormat(product.stock)}{" "}
                                                {product.unit}
                                            </td>

                                            <td className="p-3">
                                                {numberFormat(
                                                    product.minimum_stock,
                                                )}
                                            </td>

                                            <td className="p-3">
                                                {numberFormat(
                                                    product.total_out,
                                                )}
                                            </td>

                                            <td className="p-3">
                                                {numberFormat(
                                                    product.average_daily_out,
                                                )}
                                            </td>

                                            <td className="p-3">
                                                <CoverageBadge
                                                    days={product.coverage_days}
                                                    status={product.status}
                                                />
                                            </td>

                                            <td className="p-3">
                                                {numberFormat(
                                                    product.target_stock,
                                                )}
                                            </td>

                                            <td className="p-3">
                                                <StatusBadge
                                                    status={product.status}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* FORECAST NOTE */}
            <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            Forecast Calculation
                        </p>

                        <p className="text-xs leading-relaxed text-muted-foreground">
                            Demand dihitung dari histori Stock Out selama{" "}
                            {data.meta.analysis_days} hari. Rekomendasi restock
                            menggunakan target coverage{" "}
                            {data.meta.target_coverage_days} hari atau minimum
                            stock, mana yang lebih tinggi. Forecast merupakan
                            estimasi berdasarkan histori pergerakan, bukan
                            jaminan demand masa depan.
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Analysis period: {data.meta.start_date} —{" "}
                            {data.meta.end_date}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
