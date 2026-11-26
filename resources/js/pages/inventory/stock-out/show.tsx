import { Head, router, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowUpFromLine,
    CalendarDays,
    Package,
    User,
    FileText,
} from "lucide-react";

import DashboardLayout from "@/layouts/dashboard-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserData {
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
    unit_price: number | string;
    subtotal: number | string;
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
    created_at: string;
    creator?: UserData | null;
    items: StockOutItem[];
}

interface StockMovement {
    id: number;
    movement_type: string;
    quantity: number | string;
    reference_number: string;
    notes?: string | null;
    created_at: string;
    product?: Product | null;
    user?: UserData | null;
}

interface Props {
    stockOut: StockOut;
    movements: StockMovement[];
}

const currency = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const number = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(Number(value || 0));

const date = (value?: string | null) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
};

const dateTime = (value?: string | null) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
};

export default function StockOutShow({ stockOut, movements }: Props) {
    return (
        <DashboardLayout>
            <Head title={`Stock Out ${stockOut.reference_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.visit("/inventory/stock-out")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Detail Stock Out
                                </h1>

                                <Badge
                                    variant={
                                        stockOut.status === "POSTED"
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {stockOut.status}
                                </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Detail transaksi pengeluaran barang.
                            </p>
                        </div>
                    </div>

                    <Button variant="outline">
                        <Link href="/inventory/stock-out">
                            Daftar Stock Out
                        </Link>
                    </Button>
                </div>

                {/* Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Transaksi</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Nomor Referensi
                                </p>

                                <p className="mt-1 font-semibold">
                                    {stockOut.reference_number}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Tanggal Transaksi
                                </p>

                                <p className="mt-1 flex items-center gap-2 font-medium">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    {date(stockOut.transaction_date)}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Dibuat Oleh
                                </p>

                                <p className="mt-1 flex items-center gap-2 font-medium">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    {stockOut.creator?.name ?? "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Waktu Dibuat
                                </p>

                                <p className="mt-1 font-medium">
                                    {dateTime(stockOut.created_at)}
                                </p>
                            </div>
                        </div>

                        {stockOut.notes && (
                            <div className="mt-5 border-t pt-4">
                                <p className="mb-1 text-sm text-muted-foreground">
                                    Catatan
                                </p>

                                <p className="text-sm leading-relaxed">
                                    {stockOut.notes}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground">
                                Total Produk
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {stockOut.items.length}
                            </p>

                            <p className="text-xs text-muted-foreground">
                                Jenis produk keluar
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground">
                                Total Quantity
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {number(stockOut.total_quantity)}
                            </p>

                            <p className="text-xs text-muted-foreground">
                                Barang dikeluarkan
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground">
                                Total Nilai
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {currency(stockOut.total_amount)}
                            </p>

                            <p className="text-xs text-muted-foreground">
                                Nilai transaksi
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Item detail */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Barang Keluar</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[750px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
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
                                    {stockOut.items.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-4">
                                                <p className="font-medium">
                                                    {item.product?.name ?? "-"}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    SKU:{" "}
                                                    {item.product?.sku ?? "-"}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4 text-right">
                                                {number(item.quantity)}{" "}
                                                {item.product?.unit?.symbol ??
                                                    ""}
                                            </td>

                                            <td className="px-4 py-4 text-right">
                                                {currency(item.unit_price)}
                                            </td>

                                            <td className="px-4 py-4 text-right font-medium">
                                                {currency(item.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                <tfoot>
                                    <tr className="border-t bg-muted/30">
                                        <td
                                            colSpan={3}
                                            className="px-4 py-4 text-right font-semibold"
                                        >
                                            Total
                                        </td>

                                        <td className="px-4 py-4 text-right font-bold">
                                            {currency(stockOut.total_amount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Movement */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowUpFromLine className="h-5 w-5" />
                            Stock Movement
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[650px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
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
                                            Tanggal
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {movements.map((movement) => (
                                        <tr
                                            key={movement.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-medium">
                                                    {movement.product?.name ??
                                                        "-"}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {movement.product?.sku ??
                                                        "-"}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <Badge variant="outline">
                                                    {movement.movement_type}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-3 text-right font-semibold text-red-500">
                                                {number(movement.quantity)}
                                            </td>

                                            <td className="px-4 py-3">
                                                {movement.user?.name ?? "-"}
                                            </td>

                                            <td className="px-4 py-3">
                                                {dateTime(movement.created_at)}
                                            </td>
                                        </tr>
                                    ))}

                                    {movements.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                Stock movement belum tersedia.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
