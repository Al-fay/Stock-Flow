import { Head, Link } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowDownLeft,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    ExternalLink,
    FileText,
    RotateCcw,
    User,
    Warehouse,
    type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import DashboardLayout from "@/layouts/dashboard-layout";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

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

interface StockOut {
    id: number;
    reference_number: string;
    transaction_date?: string | null;
}

interface Creator {
    id: number;
    name: string;
}

interface StockReturnItem {
    id: number;
    stock_out_item_id: number;
    product_id: number;
    quantity: string | number;
    unit_price: string | number;
    subtotal: string | number;
    restock_quantity: string | number;
    damaged_quantity: string | number;
    notes?: string | null;
    product?: Product | null;
}

interface StockMovement {
    id: number;
    product_id: number;
    movement_type: string;
    quantity: string | number;
    reference_number: string;
    notes?: string | null;
    created_at: string;
    product?: Product | null;
    user?: Creator | null;
}

interface StockReturn {
    id: number;
    reference_number: string;
    stock_out_id: number;
    return_date: string;
    total_quantity: string | number;
    total_amount: string | number;
    status: string;
    reason?: string | null;
    created_by?: number | null;
    created_at: string;
    creator?: Creator | null;
    stock_out?: StockOut | null;
    items: StockReturnItem[];
}

interface Props {
    stockReturn: StockReturn;
    movements: StockMovement[];
}

/* -------------------------------------------------------------------------- */
/*                                  Formatters                                */
/* -------------------------------------------------------------------------- */

const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const formatNumber = (value: number | string) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(
        Number(value || 0),
    );

const formatDate = (date?: string | null) =>
    date
        ? new Intl.DateTimeFormat("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
          }).format(new Date(date))
        : "-";

const formatDateTime = (date?: string | null) =>
    date
        ? new Intl.DateTimeFormat("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          }).format(new Date(date))
        : "-";

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

/* -------------------------------------------------------------------------- */
/*                              Small components                              */
/* -------------------------------------------------------------------------- */

const tableHead =
    "px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground";

function InfoItem({
    label,
    icon: Icon,
    children,
}: {
    label: string;
    icon?: LucideIcon;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </dt>
            <dd className="flex items-center gap-2 text-sm font-medium">
                {Icon && (
                    <Icon
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                    />
                )}
                {children}
            </dd>
        </div>
    );
}

function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    valueClassName = "",
    iconClassName,
}: {
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
    valueClassName?: string;
    iconClassName: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0 space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p
                        className={`truncate text-2xl font-bold tabular-nums ${valueClassName}`}
                    >
                        {value}
                    </p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                </div>

                <div className={`shrink-0 rounded-lg p-2.5 ${iconClassName}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function StockReturnShow({ stockReturn, movements }: Props) {
    const { items, stock_out: stockOut } = stockReturn;

    const totalReturned = Number(stockReturn.total_quantity || 0);
    const totalRestocked = items.reduce(
        (sum, item) => sum + Number(item.restock_quantity || 0),
        0,
    );
    const totalDamaged = items.reduce(
        (sum, item) => sum + Number(item.damaged_quantity || 0),
        0,
    );

    return (
        <DashboardLayout>
            <Head title={`Retur ${stockReturn.reference_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="mt-0.5 shrink-0"
                        >
                            <Link
                                href="/inventory/stock-return"
                                aria-label="Kembali ke daftar retur"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>

                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Detail Stock Return
                                </h1>
                                <Badge
                                    variant={getStatusVariant(
                                        stockReturn.status,
                                    )}
                                >
                                    {stockReturn.status}
                                </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                <span className="font-mono font-medium text-foreground">
                                    {stockReturn.reference_number}
                                </span>
                                {" · "}
                                Retur barang dari transaksi Stock Out
                            </p>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full sm:w-auto">
                        <Link href="/inventory/stock-return">Daftar Retur</Link>
                    </Button>
                </div>

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Nilai Retur"
                        value={formatCurrency(stockReturn.total_amount)}
                        hint="Total nilai barang yang diretur"
                        icon={FileText}
                        iconClassName="bg-primary/10 text-primary"
                    />
                    <StatCard
                        label="Total Retur"
                        value={formatNumber(totalReturned)}
                        hint="Jumlah barang dikembalikan"
                        icon={RotateCcw}
                        iconClassName="bg-blue-500/10 text-blue-600"
                    />
                    <StatCard
                        label="Masuk Kembali"
                        value={formatNumber(totalRestocked)}
                        hint="Barang layak masuk stok"
                        icon={Warehouse}
                        valueClassName="text-emerald-600"
                        iconClassName="bg-emerald-500/10 text-emerald-600"
                    />
                    <StatCard
                        label="Barang Rusak"
                        value={formatNumber(totalDamaged)}
                        hint="Tidak ditambahkan ke stok"
                        icon={AlertTriangle}
                        valueClassName="text-amber-600"
                        iconClassName="bg-amber-500/10 text-amber-600"
                    />
                </div>

                {/* Transaction info + source */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                />
                                Informasi Transaksi
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            <dl className="grid gap-5 sm:grid-cols-2">
                                <InfoItem label="Nomor Retur">
                                    <span className="font-mono">
                                        {stockReturn.reference_number}
                                    </span>
                                </InfoItem>

                                <InfoItem
                                    label="Tanggal Retur"
                                    icon={CalendarDays}
                                >
                                    {formatDate(stockReturn.return_date)}
                                </InfoItem>

                                <InfoItem label="Dibuat Oleh" icon={User}>
                                    {stockReturn.creator?.name ?? "-"}
                                </InfoItem>

                                <InfoItem label="Waktu Transaksi">
                                    {formatDateTime(stockReturn.created_at)}
                                </InfoItem>
                            </dl>

                            {stockReturn.reason && (
                                <div className="rounded-lg bg-muted/50 p-4">
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Alasan Retur
                                    </p>
                                    <p className="text-sm leading-relaxed">
                                        {stockReturn.reason}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ClipboardList
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                />
                                Stock Out Asal
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <dl className="space-y-4">
                                <InfoItem label="Referensi">
                                    <span className="font-mono">
                                        {stockOut?.reference_number ?? "-"}
                                    </span>
                                </InfoItem>

                                <InfoItem
                                    label="Tanggal Transaksi"
                                    icon={CalendarDays}
                                >
                                    {formatDate(stockOut?.transaction_date)}
                                </InfoItem>
                            </dl>

                            {stockOut?.reference_number && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                >
                                    <Link
                                        href={`/inventory/stock-out/${stockOut.reference_number}`}
                                    >
                                        Lihat Stock Out
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Detail Barang Retur
                        </CardTitle>
                        <CardDescription>
                            Rincian jumlah barang, kondisi, dan nominal retur.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full min-w-[860px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-left`}
                                        >
                                            Produk
                                        </th>
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-right`}
                                        >
                                            Qty Retur
                                        </th>
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-right`}
                                        >
                                            Masuk Stok
                                        </th>
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-right`}
                                        >
                                            Rusak
                                        </th>
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-right`}
                                        >
                                            Harga
                                        </th>
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-right`}
                                        >
                                            Subtotal
                                        </th>
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-left`}
                                        >
                                            Catatan
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {items.map((item) => {
                                        const unit =
                                            item.product?.unit?.symbol ??
                                            item.product?.unit?.name;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">
                                                        {item.product?.name ??
                                                            "-"}
                                                    </div>
                                                    <div className="font-mono text-xs text-muted-foreground">
                                                        {item.product?.sku ??
                                                            "-"}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-right font-medium tabular-nums">
                                                    {formatNumber(
                                                        item.quantity,
                                                    )}
                                                    {unit && (
                                                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                                                            {unit}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums text-emerald-600">
                                                    {formatNumber(
                                                        item.restock_quantity,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums text-amber-600">
                                                    {formatNumber(
                                                        item.damaged_quantity,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatCurrency(
                                                        item.unit_price,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right font-medium tabular-nums">
                                                    {formatCurrency(
                                                        item.subtotal,
                                                    )}
                                                </td>

                                                <td className="max-w-[200px] px-4 py-3 text-muted-foreground">
                                                    {item.notes || "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {items.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-10 text-center text-muted-foreground"
                                            >
                                                Tidak ada item retur.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                                {items.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t bg-muted/40 font-semibold">
                                            <td className="px-4 py-3 text-right">
                                                Total
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {formatNumber(totalReturned)}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-emerald-600">
                                                {formatNumber(totalRestocked)}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-amber-600">
                                                {formatNumber(totalDamaged)}
                                            </td>
                                            <td />
                                            <td className="px-4 py-3 text-right font-bold tabular-nums">
                                                {formatCurrency(
                                                    stockReturn.total_amount,
                                                )}
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Stock movement */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ArrowDownLeft
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                            Stock Movement
                        </CardTitle>
                        <CardDescription>
                            Pergerakan stok aktual yang dihasilkan transaksi
                            retur.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-left`}
                                        >
                                            Produk
                                        </th>
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-left`}
                                        >
                                            Tipe
                                        </th>
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-right`}
                                        >
                                            Qty
                                        </th>
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-left`}
                                        >
                                            User
                                        </th>
                                        <th
                                            scope="col"
                                            className={`${tableHead} text-left`}
                                        >
                                            Tanggal
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {movements.map((movement) => {
                                        const qty = Number(movement.quantity);

                                        return (
                                            <tr
                                                key={movement.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">
                                                        {movement.product
                                                            ?.name ?? "-"}
                                                    </div>
                                                    <div className="font-mono text-xs text-muted-foreground">
                                                        {movement.product
                                                            ?.sku ?? "-"}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Badge variant="outline">
                                                        {movement.movement_type}
                                                    </Badge>
                                                </td>

                                                <td
                                                    className={`px-4 py-3 text-right font-semibold tabular-nums ${
                                                        qty >= 0
                                                            ? "text-emerald-600"
                                                            : "text-destructive"
                                                    }`}
                                                >
                                                    {qty > 0 ? "+" : ""}
                                                    {formatNumber(qty)}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {movement.user?.name ?? "-"}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                                    {formatDateTime(
                                                        movement.created_at,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {movements.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-10 text-center text-muted-foreground"
                                            >
                                                <p>
                                                    Tidak ada pergerakan stok.
                                                </p>
                                                <p className="mt-1 text-xs">
                                                    Barang retur mungkin
                                                    seluruhnya berstatus rusak.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {movements.length > 0 && (
                            <p className="flex items-center gap-2 text-sm text-emerald-600">
                                <CheckCircle2
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                {movements.length} pergerakan stok tercatat.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
