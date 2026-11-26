import { Head, router } from "@inertiajs/react";
import { useMemo } from "react";
import {
    ArrowLeft,
    ArrowDownToLine,
    ArrowUpFromLine,
    RefreshCcw,
    AlertTriangle,
    Package,
    FileText,
    CalendarDays,
    User,
    Truck,
} from "lucide-react";

import DashboardLayout from "@/layouts/dashboard-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

interface Movement {
    id: number;
    product: Product | null;
    supplier?: Supplier | null;
    user?: User | null;
    movement_type: "IN" | "OUT" | "ADJUSTMENT" | "DAMAGE";
    quantity: string | number;
    reference_number?: string | null;
    notes?: string | null;
    created_at: string;
}

interface TransactionItem {
    id: number;
    product_id: number;
    product?: Product | null;
    quantity?: string | number;
    system_stock?: string | number;
    physical_stock?: string | number;
    difference?: string | number;
    unit_cost?: string | number;
    unit_price?: string | number;
    subtotal?: string | number;
    notes?: string | null;
    is_counted?: boolean;
}

interface Transaction {
    id: number;
    reference_number?: string;
    code?: string;
    transaction_date?: string;
    opname_date?: string;
    status?: string;
    transaction_type?: string;
    destination?: string | null;
    payment_method?: string;
    total_quantity?: string | number;
    total_amount?: string | number;
    notes?: string | null;
    supplier?: Supplier | null;
    creator?: User | null;
    poster?: User | null;
    posted_at?: string | null;
    items?: TransactionItem[];
}

interface Props {
    reference: string;
    movements: Movement[];
    transaction: Transaction | null;
    transaction_type: string;
}

function formatNumber(value: string | number | null | undefined) {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(Number(value ?? 0));
}

function formatCurrency(value: string | number | null | undefined) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatDateOnly(value?: string | null) {
    if (!value) return "-";

    // Date-only values are formatted without timezone conversion.
    const parts = value.substring(0, 10).split("-");

    if (parts.length !== 3) return value;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getMovementLabel(type: string) {
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

function getMovementColor(type: string) {
    switch (type) {
        case "IN":
            return "border-green-500/20 bg-green-500/5 text-green-600";

        case "OUT":
            return "border-blue-500/20 bg-blue-500/5 text-blue-600";

        case "ADJUSTMENT":
            return "border-amber-500/20 bg-amber-500/5 text-amber-600";

        case "DAMAGE":
            return "border-red-500/20 bg-red-500/5 text-red-600";

        default:
            return "border-border bg-muted text-muted-foreground";
    }
}

function getMovementIcon(type: string) {
    switch (type) {
        case "IN":
            return <ArrowDownToLine className="size-4" />;

        case "OUT":
            return <ArrowUpFromLine className="size-4" />;

        case "DAMAGE":
            return <AlertTriangle className="size-4" />;

        default:
            return <RefreshCcw className="size-4" />;
    }
}

function getTransactionLabel(reference: string) {
    if (reference.startsWith("SI-")) return "Penerimaan Barang";
    if (reference.startsWith("SO-")) return "Barang Keluar";
    if (reference.startsWith("OPN-")) return "Stock Opname";

    return "Stock Movement";
}

export default function StockMovementShow({
    reference,
    movements,
    transaction,
    transaction_type,
}: Props) {
    const transactionItems = transaction?.items ?? [];

    const totalMovementQuantity = useMemo(() => {
        return movements.reduce(
            (total, movement) => total + Math.abs(Number(movement.quantity)),
            0,
        );
    }, [movements]);

    const totalItems = transactionItems.length || movements.length;

    const transactionDate =
        transaction?.transaction_date ??
        transaction?.opname_date ??
        movements[0]?.created_at;

    const movementType = transaction_type;

    return (
        <>
            <Head title={`Detail ${reference}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.visit("/inventory/movements")}
                        >
                            <ArrowLeft className="size-4" />
                        </Button>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Detail Stock Movement
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Detail transaksi dan riwayat pergerakan stok.
                            </p>
                        </div>
                    </div>

                    <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${getMovementColor(movementType)}`}
                    >
                        {getMovementIcon(movementType)}
                        {getMovementLabel(movementType)}
                    </span>
                </div>

                {/* Reference */}
                <Card>
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Nomor Referensi
                            </p>

                            <h2 className="mt-1 text-xl font-bold tracking-tight">
                                {reference}
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {getTransactionLabel(reference)}
                            </p>
                        </div>

                        {transaction?.status && (
                            <span className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium">
                                {transaction.status}
                            </span>
                        )}
                    </CardContent>
                </Card>

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                                    <Package className="size-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Produk
                                    </p>

                                    <p className="text-2xl font-bold">
                                        {totalItems}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-500/10 p-3 text-blue-600">
                                    <RefreshCcw className="size-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Pergerakan
                                    </p>

                                    <p className="text-2xl font-bold">
                                        {formatNumber(totalMovementQuantity)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-amber-500/10 p-3 text-amber-600">
                                    <CalendarDays className="size-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Tanggal Transaksi
                                    </p>

                                    <p className="text-sm font-semibold">
                                        {formatDateOnly(transactionDate)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-600">
                                    <User className="size-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Dibuat Oleh
                                    </p>

                                    <p className="text-sm font-semibold">
                                        {transaction?.creator?.name ??
                                            movements[0]?.user?.name ??
                                            "-"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="size-5" />
                            Informasi Transaksi
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Referensi
                                </p>

                                <p className="mt-1 font-medium">{reference}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Jenis Transaksi
                                </p>

                                <p className="mt-1 font-medium">
                                    {transaction?.transaction_type
                                        ? transaction.transaction_type.replace(
                                              "_",
                                              " ",
                                          )
                                        : getMovementLabel(movementType)}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Tanggal
                                </p>

                                <p className="mt-1 font-medium">
                                    {formatDateOnly(transactionDate)}
                                </p>
                            </div>

                            {transaction?.supplier && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Supplier
                                    </p>

                                    <p className="mt-1 flex items-center gap-2 font-medium">
                                        <Truck className="size-4 text-muted-foreground" />
                                        {transaction.supplier.name}
                                    </p>
                                </div>
                            )}

                            {transaction?.destination && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Tujuan
                                    </p>

                                    <p className="mt-1 font-medium">
                                        {transaction.destination}
                                    </p>
                                </div>
                            )}

                            {transaction?.payment_method && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Metode Pembayaran
                                    </p>

                                    <p className="mt-1 font-medium">
                                        {transaction.payment_method}
                                    </p>
                                </div>
                            )}

                            {transaction?.poster && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Diposting Oleh
                                    </p>

                                    <p className="mt-1 font-medium">
                                        {transaction.poster.name}
                                    </p>
                                </div>
                            )}

                            {transaction?.posted_at && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Waktu Posting
                                    </p>

                                    <p className="mt-1 font-medium">
                                        {formatDate(transaction.posted_at)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {transaction?.notes && (
                            <div className="mt-5 border-t pt-4">
                                <p className="text-sm text-muted-foreground">
                                    Catatan
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-sm">
                                    {transaction.notes}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Transaction Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Produk</CardTitle>
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

                                        {transactionItems.some(
                                            (item) =>
                                                item.unit_cost !== undefined ||
                                                item.unit_price !== undefined,
                                        ) && (
                                            <>
                                                <th className="px-4 py-3 text-right">
                                                    Harga
                                                </th>

                                                <th className="px-4 py-3 text-right">
                                                    Subtotal
                                                </th>
                                            </>
                                        )}

                                        {transactionItems.some(
                                            (item) =>
                                                item.system_stock !== undefined,
                                        ) && (
                                            <>
                                                <th className="px-4 py-3 text-right">
                                                    Stok Sistem
                                                </th>

                                                <th className="px-4 py-3 text-right">
                                                    Stok Fisik
                                                </th>

                                                <th className="px-4 py-3 text-right">
                                                    Selisih
                                                </th>
                                            </>
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {transactionItems.length > 0
                                        ? transactionItems.map((item) => {
                                              const product = item.product;

                                              return (
                                                  <tr
                                                      key={item.id}
                                                      className="border-t"
                                                  >
                                                      <td className="px-4 py-3">
                                                          <p className="font-medium">
                                                              {product?.name ??
                                                                  `Product #${item.product_id}`}
                                                          </p>

                                                          <p className="text-xs text-muted-foreground">
                                                              {product?.sku ??
                                                                  "-"}
                                                          </p>
                                                      </td>

                                                      <td className="px-4 py-3 text-right">
                                                          {formatNumber(
                                                              item.quantity ??
                                                                  item.physical_stock ??
                                                                  0,
                                                          )}

                                                          <span className="ml-1 text-xs text-muted-foreground">
                                                              {product?.unit
                                                                  ?.symbol ??
                                                                  ""}
                                                          </span>
                                                      </td>

                                                      {(item.unit_cost !==
                                                          undefined ||
                                                          item.unit_price !==
                                                              undefined) && (
                                                          <>
                                                              <td className="px-4 py-3 text-right">
                                                                  {formatCurrency(
                                                                      item.unit_cost ??
                                                                          item.unit_price,
                                                                  )}
                                                              </td>

                                                              <td className="px-4 py-3 text-right font-medium">
                                                                  {formatCurrency(
                                                                      item.subtotal,
                                                                  )}
                                                              </td>
                                                          </>
                                                      )}

                                                      {item.system_stock !==
                                                          undefined && (
                                                          <>
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
                                                                  className={`px-4 py-3 text-right font-semibold ${
                                                                      Number(
                                                                          item.difference,
                                                                      ) >= 0
                                                                          ? "text-emerald-600"
                                                                          : "text-red-600"
                                                                  }`}
                                                              >
                                                                  {Number(
                                                                      item.difference,
                                                                  ) > 0
                                                                      ? "+"
                                                                      : ""}
                                                                  {formatNumber(
                                                                      item.difference,
                                                                  )}
                                                              </td>
                                                          </>
                                                      )}
                                                  </tr>
                                              );
                                          })
                                        : movements.map((movement) => (
                                              <tr
                                                  key={movement.id}
                                                  className="border-t"
                                              >
                                                  <td className="px-4 py-3">
                                                      <p className="font-medium">
                                                          {movement.product
                                                              ?.name ??
                                                              "Produk tidak tersedia"}
                                                      </p>

                                                      <p className="text-xs text-muted-foreground">
                                                          {movement.product
                                                              ?.sku ?? "-"}
                                                      </p>
                                                  </td>

                                                  <td className="px-4 py-3 text-right">
                                                      <span
                                                          className={`font-semibold ${
                                                              Number(
                                                                  movement.quantity,
                                                              ) >= 0
                                                                  ? "text-emerald-600"
                                                                  : "text-red-600"
                                                          }`}
                                                      >
                                                          {Number(
                                                              movement.quantity,
                                                          ) > 0
                                                              ? "+"
                                                              : ""}
                                                          {formatNumber(
                                                              movement.quantity,
                                                          )}
                                                      </span>

                                                      <span className="ml-1 text-xs text-muted-foreground">
                                                          {movement.product
                                                              ?.unit?.symbol ??
                                                              ""}
                                                      </span>
                                                  </td>
                                              </tr>
                                          ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Total */}
                        {transaction?.total_amount !== undefined && (
                            <div className="mt-4 flex justify-end">
                                <div className="w-full max-w-sm space-y-2 rounded-lg bg-muted/40 p-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Total Quantity
                                        </span>

                                        <span className="font-medium">
                                            {formatNumber(
                                                transaction.total_quantity,
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex justify-between border-t pt-3">
                                        <span className="font-medium">
                                            Total
                                        </span>

                                        <span className="text-lg font-bold">
                                            {formatCurrency(
                                                transaction.total_amount,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Movement Ledger */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ledger Stock Movement</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Produk
                                        </th>

                                        <th className="px-4 py-3 text-left">
                                            Jenis
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Quantity
                                        </th>

                                        <th className="px-4 py-3 text-left">
                                            Supplier
                                        </th>

                                        <th className="px-4 py-3 text-left">
                                            User
                                        </th>

                                        <th className="px-4 py-3 text-left">
                                            Waktu
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {movements.map((movement) => (
                                        <tr
                                            key={movement.id}
                                            className="border-t"
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
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${getMovementColor(
                                                        movement.movement_type,
                                                    )}`}
                                                >
                                                    {getMovementLabel(
                                                        movement.movement_type,
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                                <span
                                                    className={
                                                        Number(
                                                            movement.quantity,
                                                        ) >= 0
                                                            ? "text-emerald-600"
                                                            : "text-red-600"
                                                    }
                                                >
                                                    {Number(movement.quantity) >
                                                    0
                                                        ? "+"
                                                        : ""}
                                                    {formatNumber(
                                                        movement.quantity,
                                                    )}
                                                </span>

                                                <span className="ml-1 text-xs text-muted-foreground">
                                                    {movement.product?.unit
                                                        ?.symbol ?? ""}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-muted-foreground">
                                                {movement.supplier?.name ?? "-"}
                                            </td>

                                            <td className="px-4 py-3 text-muted-foreground">
                                                {movement.user?.name ?? "-"}
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                {formatDate(
                                                    movement.created_at,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={() => router.visit("/inventory/movements")}
                    >
                        <ArrowLeft className="mr-2 size-4" />
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
