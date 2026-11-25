import { Head, router } from "@inertiajs/react";
import DashboardLayout from "@/layouts/dashboard-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
    ArrowLeft,
    ArrowDownToLine,
    ArrowUpFromLine,
    RefreshCcw,
    AlertTriangle,
    FileText,
    Package,
    UserRound,
    CalendarDays,
    Hash,
} from "lucide-react";

interface Unit {
    id: number;
    name: string;
    symbol: string;
}

interface Product {
    id: number;
    sku: string;
    name: string;
    unit?: Unit | null;
}

interface Supplier {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "DAMAGE" | string;

interface StockMovement {
    id: number;
    product_id: number;
    supplier_id?: number | null;
    user_id?: number | null;
    movement_type: MovementType;
    quantity: string | number;
    reference_number?: string | null;
    notes?: string | null;
    created_at: string;
    product?: Product | null;
    supplier?: Supplier | null;
    user?: User | null;
}

interface StockInItem {
    id: number;
    product_id: number;
    quantity: string | number;
    unit_cost: string | number;
    subtotal: string | number;
    product?: Product | null;
}

interface StockOutItem {
    id: number;
    product_id: number;
    quantity: string | number;
    unit_price: string | number;
    subtotal: string | number;
    product?: Product | null;
}

interface StockInTransaction {
    reference_number: string;
    transaction_date: string;
    total_quantity: string | number;
    total_amount: string | number;
    payment_method: string;
    status: string;
    notes?: string | null;
    supplier?: Supplier | null;
    creator?: User | null;
    items?: StockInItem[];
}

interface StockOutTransaction {
    reference_number: string;
    transaction_date: string;
    transaction_type: string;
    destination?: string | null;
    total_quantity: string | number;
    total_amount: string | number;
    status: string;
    notes?: string | null;
    creator?: User | null;
    items?: StockOutItem[];
}

interface StockOpnameItem {
    id: number;
    system_stock: string | number;
    physical_stock: string | number;
    difference: string | number;
    notes?: string | null;
    product?: Product | null;
}

interface StockOpnameTransaction {
    code: string;
    opname_date: string;
    status: string;
    notes?: string | null;
    creator?: User | null;
    poster?: User | null;
    posted_at?: string | null;
    items?: StockOpnameItem[];
}

interface Transaction {
    type: "STOCK_IN" | "STOCK_OUT" | "STOCK_OPNAME" | "MOVEMENT";
    stockIn: StockInTransaction | null;
    stockOut: StockOutTransaction | null;
    stockOpname: StockOpnameTransaction | null;
}

interface Props {
    movement: StockMovement;
    relatedMovements: StockMovement[];
    transaction: Transaction;
}

function parseNumber(value: string | number | null | undefined) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: string | number) {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(parseNumber(value));
}

function formatCurrency(value: string | number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 2,
    }).format(parseNumber(value));
}

function formatDate(value?: string | null) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
    }).format(date);
}

function formatDateTime(value?: string | null) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function movementLabel(type: MovementType) {
    switch (type) {
        case "IN":
            return "Stock In";
        case "OUT":
            return "Stock Out";
        case "ADJUSTMENT":
            return "Adjustment";
        case "DAMAGE":
            return "Damage";
        default:
            return type;
    }
}

function movementIcon(type: MovementType) {
    switch (type) {
        case "IN":
            return ArrowDownToLine;
        case "OUT":
            return ArrowUpFromLine;
        case "ADJUSTMENT":
            return RefreshCcw;
        case "DAMAGE":
            return AlertTriangle;
        default:
            return Package;
    }
}

function quantityClass(type: MovementType, quantity: number) {
    if (type === "IN" || quantity > 0) {
        return "text-emerald-600 dark:text-emerald-400";
    }

    if (type === "OUT" || type === "DAMAGE" || quantity < 0) {
        return "text-destructive";
    }

    return "text-muted-foreground";
}

function transactionLabel(type: Transaction["type"]) {
    switch (type) {
        case "STOCK_IN":
            return "Penerimaan Barang";
        case "STOCK_OUT":
            return "Pengeluaran Barang";
        case "STOCK_OPNAME":
            return "Stock Opname";
        default:
            return "Pergerakan Stok";
    }
}

export default function StockMovementShow({
    movement,
    relatedMovements,
    transaction,
}: Props) {
    const stockIn = transaction.stockIn;
    const stockOut = transaction.stockOut;
    const opname = transaction.stockOpname;

    const totalIn = relatedMovements
        .filter((item) => item.movement_type === "IN")
        .reduce(
            (total, item) => total + Math.abs(parseNumber(item.quantity)),
            0,
        );

    const totalOut = relatedMovements
        .filter((item) => item.movement_type === "OUT")
        .reduce(
            (total, item) => total + Math.abs(parseNumber(item.quantity)),
            0,
        );

    const totalAdjustment = relatedMovements
        .filter((item) => item.movement_type === "ADJUSTMENT")
        .reduce((total, item) => total + parseNumber(item.quantity), 0);

    const totalDamage = relatedMovements
        .filter((item) => item.movement_type === "DAMAGE")
        .reduce(
            (total, item) => total + Math.abs(parseNumber(item.quantity)),
            0,
        );

    const headerReference =
        stockIn?.reference_number ??
        stockOut?.reference_number ??
        opname?.code ??
        movement.reference_number ??
        `MOV-${movement.id}`;

    const transactionDate =
        stockIn?.transaction_date ??
        stockOut?.transaction_date ??
        opname?.opname_date ??
        movement.created_at;

    const transactionNotes =
        stockIn?.notes ?? stockOut?.notes ?? opname?.notes ?? movement.notes;

    const createdBy =
        stockIn?.creator?.name ??
        stockOut?.creator?.name ??
        opname?.creator?.name ??
        movement.user?.name ??
        "-";

    const itemCount =
        stockIn?.items?.length ??
        stockOut?.items?.length ??
        opname?.items?.length ??
        relatedMovements.length;

    return (
        <>
            <Head title={`Movement ${headerReference}`} />

            <div className="space-y-6">
                {/* Page header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => router.visit("/inventory/movements")}
                        >
                            <ArrowLeft className="size-4" />
                        </Button>

                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Detail Stock Movement
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Detail transaksi dan riwayat perubahan stok.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reference / transaction information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="size-5" />
                            Informasi Transaksi
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Referensi
                                </p>
                                <p className="font-semibold break-all">
                                    {headerReference}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Jenis Transaksi
                                </p>
                                <p className="font-medium">
                                    {transactionLabel(transaction.type)}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Tanggal
                                </p>
                                <p className="font-medium">
                                    {formatDate(transactionDate)}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Dibuat oleh
                                </p>
                                <p className="font-medium">{createdBy}</p>
                            </div>

                            {stockIn && (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Supplier
                                        </p>
                                        <p className="font-medium">
                                            {stockIn.supplier?.name ?? "-"}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Pembayaran
                                        </p>
                                        <p className="font-medium">
                                            {stockIn.payment_method}
                                        </p>
                                    </div>
                                </>
                            )}

                            {stockOut && (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Tipe Pengeluaran
                                        </p>
                                        <p className="font-medium">
                                            {stockOut.transaction_type}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Tujuan
                                        </p>
                                        <p className="font-medium">
                                            {stockOut.destination || "-"}
                                        </p>
                                    </div>
                                </>
                            )}

                            {opname && (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Status Opname
                                        </p>
                                        <p className="font-medium">
                                            {opname.status}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Diposting oleh
                                        </p>
                                        <p className="font-medium">
                                            {opname.poster?.name ?? "-"}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {transactionNotes && (
                            <div className="mt-5 rounded-lg bg-muted/50 p-4">
                                <p className="mb-1 text-sm font-medium">
                                    Catatan
                                </p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {transactionNotes}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Barang Masuk
                                </p>
                                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    +{formatNumber(totalIn)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                                <ArrowDownToLine className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Barang Keluar
                                </p>
                                <p className="mt-1 text-2xl font-bold text-destructive">
                                    -{formatNumber(totalOut)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
                                <ArrowUpFromLine className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Adjustment
                                </p>
                                <p className="mt-1 text-2xl font-bold">
                                    {totalAdjustment > 0 ? "+" : ""}
                                    {formatNumber(totalAdjustment)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-primary/10 p-3 text-primary">
                                <RefreshCcw className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Damage
                                </p>
                                <p className="mt-1 text-2xl font-bold text-destructive">
                                    -{formatNumber(totalDamage)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
                                <AlertTriangle className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction items for Stock In / Out */}
                {(stockIn?.items || stockOut?.items) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Item Transaksi</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                Produk
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Quantity
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Harga
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(
                                            stockIn?.items ??
                                            stockOut?.items ??
                                            []
                                        ).map((item) => {
                                            const product = item.product;
                                            const isIn = Boolean(stockIn);
                                            const quantity = parseNumber(
                                                item.quantity,
                                            );
                                            const price = isIn
                                                ? parseNumber(
                                                      (item as StockInItem)
                                                          .unit_cost,
                                                  )
                                                : parseNumber(
                                                      (item as StockOutItem)
                                                          .unit_price,
                                                  );
                                            const subtotal = parseNumber(
                                                item.subtotal,
                                            );

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="border-t"
                                                >
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium">
                                                            {product?.name ??
                                                                "-"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {product?.sku ??
                                                                "-"}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        {formatNumber(quantity)}{" "}
                                                        {product?.unit
                                                            ?.symbol ?? ""}
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        {formatCurrency(price)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                        {formatCurrency(
                                                            subtotal,
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <div className="w-full max-w-xs space-y-2 border-t pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Total Quantity
                                        </span>
                                        <span className="font-medium">
                                            {formatNumber(
                                                stockIn?.total_quantity ??
                                                    stockOut?.total_quantity ??
                                                    0,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">
                                            Total
                                        </span>
                                        <span className="text-lg font-bold">
                                            {formatCurrency(
                                                stockIn?.total_amount ??
                                                    stockOut?.total_amount ??
                                                    0,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stock opname items */}
                {opname?.items && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Stock Opname</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                Produk
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Stok Sistem
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Stok Fisik
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Selisih
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {opname.items.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-t"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-medium">
                                                        {item.product?.name ??
                                                            "-"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.product?.sku ??
                                                            "-"}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {formatNumber(
                                                        item.system_stock,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {formatNumber(
                                                        item.physical_stock,
                                                    )}
                                                </td>
                                                <td
                                                    className={`px-4 py-3 text-right font-medium ${
                                                        parseNumber(
                                                            item.difference,
                                                        ) < 0
                                                            ? "text-destructive"
                                                            : parseNumber(
                                                                    item.difference,
                                                                ) > 0
                                                              ? "text-emerald-600 dark:text-emerald-400"
                                                              : ""
                                                    }`}
                                                >
                                                    {parseNumber(
                                                        item.difference,
                                                    ) > 0
                                                        ? "+"
                                                        : ""}
                                                    {formatNumber(
                                                        item.difference,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Ledger entries */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="size-5" />
                            Ledger Pergerakan Stok
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="mb-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <Hash className="size-4" />
                                {relatedMovements.length} pergerakan
                            </span>
                            <span className="flex items-center gap-2">
                                <CalendarDays className="size-4" />
                                {formatDateTime(movement.created_at)}
                            </span>
                            <span className="flex items-center gap-2">
                                <UserRound className="size-4" />
                                {movement.user?.name ?? "-"}
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Tanggal
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Produk
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Tipe
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Quantity
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            User
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Catatan
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {relatedMovements.map((item) => {
                                        const Icon = movementIcon(
                                            item.movement_type,
                                        );
                                        const quantity = parseNumber(
                                            item.quantity,
                                        );

                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-t"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {formatDateTime(
                                                        item.created_at,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium">
                                                        {item.product?.name ??
                                                            "-"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.product?.sku ??
                                                            "-"}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-2">
                                                        <Icon className="size-4" />
                                                        {movementLabel(
                                                            item.movement_type,
                                                        )}
                                                    </span>
                                                </td>
                                                <td
                                                    className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${quantityClass(
                                                        item.movement_type,
                                                        quantity,
                                                    )}`}
                                                >
                                                    {quantity > 0 ? "+" : ""}
                                                    {formatNumber(
                                                        quantity,
                                                    )}{" "}
                                                    {item.product?.unit
                                                        ?.symbol ?? ""}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.user?.name ?? "-"}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {item.notes || "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit("/inventory/movements")}
                    >
                        Kembali ke Stock Movement
                    </Button>
                </div>
            </div>
        </>
    );
}

StockMovementShow.layout = (page: React.ReactNode) => (
    <DashboardLayout>{page}</DashboardLayout>
);
