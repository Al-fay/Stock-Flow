import { Head, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { ArrowLeft, Package, RotateCcw, Search, Trash2 } from "lucide-react";

import DashboardLayout from "@/layouts/dashboard-layout";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
    returned_quantity: number | string;
    remaining_quantity: number | string;
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
    items: StockOutItem[];
    returnable: boolean;
}

interface Props {
    stockOuts: StockOut[];
}

interface ReturnItemForm {
    stock_out_item_id: number;
    product_id: number;
    product_name: string;
    sku: string;
    unit: string;
    original_quantity: number;
    returned_quantity: number;
    remaining_quantity: number;
    quantity: number;
    restock_quantity: number;
    unit_price: number;
    notes: string;
}

interface FormData {
    stock_out_id: number | "";
    return_date: string;
    reason: string;
    items: {
        stock_out_item_id: number;
        quantity: number;
        restock_quantity: number;
        notes: string;
    }[];
}

const formatNumber = (value: number | string) =>
    Number(value ?? 0).toLocaleString("id-ID", {
        maximumFractionDigits: 3,
    });

const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));

const today = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export default function StockReturnCreate({ stockOuts }: Props) {
    const [selectedStockOut, setSelectedStockOut] = useState<StockOut | null>(
        null,
    );

    const [returnItems, setReturnItems] = useState<ReturnItemForm[]>([]);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        stock_out_id: "",
        return_date: today(),
        reason: "",
        items: [],
    });

    const availableStockOuts = stockOuts.filter(
        (stockOut) => stockOut.returnable,
    );

    const totalReturnQuantity = useMemo(
        () => returnItems.reduce((sum, item) => sum + item.quantity, 0),
        [returnItems],
    );

    const totalRestockQuantity = useMemo(
        () => returnItems.reduce((sum, item) => sum + item.restock_quantity, 0),
        [returnItems],
    );

    const totalDamagedQuantity = useMemo(
        () =>
            returnItems.reduce(
                (sum, item) => sum + item.quantity - item.restock_quantity,
                0,
            ),
        [returnItems],
    );

    const totalAmount = useMemo(
        () =>
            returnItems.reduce(
                (sum, item) =>
                    sum +
                    Math.round(item.quantity * item.unit_price * 100) / 100,
                0,
            ),
        [returnItems],
    );

    const selectStockOut = (id: string) => {
        const stockOut =
            availableStockOuts.find((item) => String(item.id) === id) ?? null;

        setSelectedStockOut(stockOut);
        setData("stock_out_id", stockOut?.id ?? "");

        if (!stockOut) {
            setReturnItems([]);
            setData("items", []);
            return;
        }

        setReturnItems([]);

        setData("items", []);
    };

    const addItem = (item: StockOutItem) => {
        const exists = returnItems.some(
            (returnItem) => returnItem.stock_out_item_id === item.id,
        );

        if (exists) return;

        const remainingQuantity = Number(item.remaining_quantity);

        if (remainingQuantity <= 0) return;

        const newItem: ReturnItemForm = {
            stock_out_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product?.name ?? "Produk",
            sku: item.product?.sku ?? "-",
            unit: item.product?.unit?.symbol ?? item.product?.unit?.name ?? "-",
            original_quantity: Number(item.quantity),
            returned_quantity: Number(item.returned_quantity),
            remaining_quantity: remainingQuantity,
            quantity: 0,
            restock_quantity: 0,
            unit_price: Number(item.unit_price),
            notes: "",
        };

        updateItems([...returnItems, newItem]);
    };

    const removeItem = (id: number) => {
        updateItems(
            returnItems.filter((item) => item.stock_out_item_id !== id),
        );
    };

    const updateItem = (
        id: number,
        field: keyof ReturnItemForm,
        value: number | string,
    ) => {
        const updatedItems = returnItems.map((item) => {
            if (item.stock_out_item_id !== id) return item;

            const updated = { ...item, [field]: value };

            if (field === "quantity") {
                const quantity = Math.max(
                    0,
                    Math.min(Number(value) || 0, item.remaining_quantity),
                );

                updated.quantity = quantity;

                // Default barang retur dianggap layak masuk stok.
                updated.restock_quantity = quantity;
            }

            if (field === "restock_quantity") {
                updated.restock_quantity = Math.max(
                    0,
                    Math.min(Number(value) || 0, item.quantity),
                );
            }

            return updated;
        });

        updateItems(updatedItems);
    };

    const updateItems = (items: ReturnItemForm[]) => {
        setReturnItems(items);

        setData(
            "items",
            items
                .filter((item) => item.quantity > 0)
                .map((item) => ({
                    stock_out_item_id: item.stock_out_item_id,
                    quantity: item.quantity,
                    restock_quantity: item.restock_quantity,
                    notes: item.notes,
                })),
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.stock_out_id) {
            toast.error("Silakan pilih transaksi Stock Out.");
            return;
        }

        const validItems = returnItems.filter((item) => item.quantity > 0);

        if (validItems.length === 0) {
            toast.error("Tambahkan minimal satu item retur.");
            return;
        }

        const invalidItem = validItems.some(
            (item) =>
                item.quantity > item.remaining_quantity ||
                item.restock_quantity > item.quantity ||
                item.restock_quantity < 0,
        );

        if (invalidItem) {
            toast.error("Periksa kembali kuantitas item retur.");
            return;
        }

        post("/inventory/stock-return", {
            preserveScroll: true,

            onSuccess: () => {
                toast.success("Stock Return berhasil ditambahkan.");
            },

            onError: (errors) => {
                console.error("Stock Return validation errors:", errors);

                toast.error(
                    "Gagal menyimpan Stock Return. Periksa kembali data yang diinput.",
                );
            },
        });
    };

    return (
        <>
            <Head title="Stock Return Baru" />

            <form onSubmit={submit} className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                                router.visit("/inventory/stock-return")
                            }
                        >
                            <ArrowLeft className="size-4" />
                        </Button>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Stock Return
                            </h1>

                            <p className="text-sm text-muted-foreground">
                                Buat transaksi retur barang.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.visit("/inventory/stock-return")
                            }
                        >
                            Batal
                        </Button>

                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                !data.stock_out_id ||
                                data.items.length === 0
                            }
                        >
                            <RotateCcw className="mr-2 size-4" />
                            {processing ? "Menyimpan..." : "Simpan Retur"}
                        </Button>
                    </div>
                </div>

                {/* Transaction Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Retur</CardTitle>
                    </CardHeader>

                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Referensi Stock Out
                            </label>

                            <select
                                value={String(data.stock_out_id)}
                                onChange={(e) => selectStockOut(e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">
                                    Pilih transaksi Stock Out
                                </option>

                                {availableStockOuts.map((stockOut) => (
                                    <option
                                        key={stockOut.id}
                                        value={stockOut.id}
                                    >
                                        {stockOut.reference_number} —{" "}
                                        {stockOut.transaction_date}
                                    </option>
                                ))}
                            </select>

                            {errors.stock_out_id && (
                                <p className="text-sm text-destructive">
                                    {errors.stock_out_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Tanggal Retur
                            </label>

                            <Input
                                type="date"
                                value={data.return_date}
                                onChange={(e) =>
                                    setData("return_date", e.target.value)
                                }
                            />

                            {errors.return_date && (
                                <p className="text-sm text-destructive">
                                    {errors.return_date}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">
                                Alasan Retur
                            </label>

                            <textarea
                                value={data.reason}
                                onChange={(e) =>
                                    setData("reason", e.target.value)
                                }
                                placeholder="Masukkan alasan pengembalian barang..."
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Selected Stock Out */}
                {selectedStockOut && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Barang dari Stock Out</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <div className="flex flex-wrap justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Referensi
                                        </p>

                                        <p className="font-semibold">
                                            {selectedStockOut.reference_number}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Tanggal Transaksi
                                        </p>

                                        <p className="font-medium">
                                            {selectedStockOut.transaction_date}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Total Transaksi
                                        </p>

                                        <p className="font-medium">
                                            {formatCurrency(
                                                selectedStockOut.total_amount,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/40">
                                        <tr>
                                            <th className="px-3 py-3 text-left">
                                                Produk
                                            </th>

                                            <th className="px-3 py-3 text-right">
                                                Qty Keluar
                                            </th>

                                            <th className="px-3 py-3 text-right">
                                                Qty Retur
                                            </th>

                                            <th className="px-3 py-3 text-right">
                                                Sisa Retur
                                            </th>

                                            <th className="px-3 py-3 text-right">
                                                Harga
                                            </th>

                                            <th className="px-3 py-3 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {selectedStockOut.items.map((item) => {
                                            const added = returnItems.some(
                                                (returnItem) =>
                                                    returnItem.stock_out_item_id ===
                                                    item.id,
                                            );

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="border-b"
                                                >
                                                    <td className="px-3 py-3">
                                                        <p className="font-medium">
                                                            {item.product?.name}
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {item.product?.sku}
                                                        </p>
                                                    </td>

                                                    <td className="px-3 py-3 text-right">
                                                        {formatNumber(
                                                            item.quantity,
                                                        )}
                                                    </td>

                                                    <td className="px-3 py-3 text-right">
                                                        {formatNumber(
                                                            item.returned_quantity,
                                                        )}
                                                    </td>

                                                    <td className="px-3 py-3 text-right">
                                                        <Badge variant="outline">
                                                            {formatNumber(
                                                                item.remaining_quantity,
                                                            )}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-3 py-3 text-right whitespace-nowrap">
                                                        {formatCurrency(
                                                            item.unit_price,
                                                        )}
                                                    </td>

                                                    <td className="px-3 py-3 text-center">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={
                                                                added
                                                                    ? "secondary"
                                                                    : "outline"
                                                            }
                                                            disabled={
                                                                added ||
                                                                Number(
                                                                    item.remaining_quantity,
                                                                ) <= 0
                                                            }
                                                            onClick={() =>
                                                                addItem(item)
                                                            }
                                                        >
                                                            {added
                                                                ? "Ditambahkan"
                                                                : "Pilih"}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Return Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Item Retur</CardTitle>
                    </CardHeader>

                    <CardContent>
                        {returnItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/40">
                                        <tr>
                                            <th className="px-3 py-3 text-left">
                                                Produk
                                            </th>

                                            <th className="px-3 py-3 text-right">
                                                Qty Retur
                                            </th>

                                            <th className="px-3 py-3 text-right">
                                                Qty Layak
                                            </th>

                                            <th className="px-3 py-3 text-right">
                                                Qty Rusak
                                            </th>

                                            <th className="px-3 py-3 text-right">
                                                Subtotal
                                            </th>

                                            <th className="px-3 py-3 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {returnItems.map((item) => {
                                            const damaged =
                                                item.quantity -
                                                item.restock_quantity;

                                            return (
                                                <tr
                                                    key={item.stock_out_item_id}
                                                    className="border-b"
                                                >
                                                    <td className="px-3 py-3">
                                                        <p className="font-medium">
                                                            {item.product_name}
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {item.sku} ·{" "}
                                                            {item.unit}
                                                        </p>

                                                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                                            <p>
                                                                Qty keluar:{" "}
                                                                {formatNumber(
                                                                    item.original_quantity,
                                                                )}
                                                            </p>
                                                            <p>
                                                                Sudah diretur:{" "}
                                                                {formatNumber(
                                                                    item.returned_quantity,
                                                                )}
                                                            </p>
                                                            <p>
                                                                Sisa dapat
                                                                diretur:{" "}
                                                                {formatNumber(
                                                                    item.remaining_quantity,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="px-3 py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={
                                                                item.remaining_quantity
                                                            }
                                                            step="0.001"
                                                            value={
                                                                item.quantity
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.stock_out_item_id,
                                                                    "quantity",
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                            className="w-28 text-right"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={item.quantity}
                                                            step="0.001"
                                                            value={
                                                                item.restock_quantity
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.stock_out_item_id,
                                                                    "restock_quantity",
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                            className="w-28 text-right"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-3 text-right">
                                                        <span
                                                            className={
                                                                damaged > 0
                                                                    ? "font-medium text-destructive"
                                                                    : ""
                                                            }
                                                        >
                                                            {formatNumber(
                                                                damaged,
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="px-3 py-3 text-right font-medium whitespace-nowrap">
                                                        {formatCurrency(
                                                            item.quantity *
                                                                item.unit_price,
                                                        )}
                                                    </td>

                                                    <td className="px-3 py-3 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                removeItem(
                                                                    item.stock_out_item_id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-4 text-destructive" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                                <div className="rounded-full bg-muted p-4">
                                    <Package className="size-6 text-muted-foreground" />
                                </div>

                                <div>
                                    <p className="font-medium">
                                        Belum ada item retur
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        Pilih barang dari transaksi Stock Out di
                                        atas.
                                    </p>
                                </div>
                            </div>
                        )}

                        {Object.entries(errors).filter(([key]) =>
                            key.startsWith("items."),
                        ).length > 0 && (
                            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                                <p className="text-sm font-medium text-destructive">
                                    Periksa kembali item retur:
                                </p>

                                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-destructive">
                                    {Object.entries(errors)
                                        .filter(([key]) =>
                                            key.startsWith("items."),
                                        )
                                        .map(([key, message]) => (
                                            <li key={key}>{message}</li>
                                        ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ringkasan Retur</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-lg border p-4">
                                <p className="text-sm text-muted-foreground">
                                    Total Qty Retur
                                </p>

                                <p className="mt-1 text-xl font-bold">
                                    {formatNumber(totalReturnQuantity)}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="text-sm text-muted-foreground">
                                    Layak Masuk Stok
                                </p>

                                <p className="mt-1 text-xl font-bold text-emerald-600">
                                    {formatNumber(totalRestockQuantity)}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="text-sm text-muted-foreground">
                                    Barang Rusak
                                </p>

                                <p className="mt-1 text-xl font-bold text-destructive">
                                    {formatNumber(totalDamagedQuantity)}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="text-sm text-muted-foreground">
                                    Nilai Retur
                                </p>

                                <p className="mt-1 text-xl font-bold">
                                    {formatCurrency(totalAmount)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit("/inventory/stock-return")}
                    >
                        Batal
                    </Button>

                    <Button
                        type="submit"
                        disabled={
                            processing ||
                            !data.stock_out_id ||
                            data.items.length === 0
                        }
                    >
                        <RotateCcw className="mr-2 size-4" />
                        {processing ? "Menyimpan..." : "Simpan Retur"}
                    </Button>
                </div>
            </form>
        </>
    );
}

StockReturnCreate.layout = (page: React.ReactNode) => (
    <DashboardLayout>{page}</DashboardLayout>
);
