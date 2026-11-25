import { Head, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
    ArrowLeft,
    PackageMinus,
    Search,
    Trash2,
    ShoppingCart,
    CalendarDays,
    FileText,
    Warehouse,
    AlertTriangle,
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
    selling_price: string | number;
    purchase_price: string | number;
    stock: string | number;
    unit?: Unit | null;
}

interface Props {
    products: Product[];
}

type StockOutType = "SALE" | "USAGE" | "DISTRIBUTION" | "OTHER";

interface StockOutItem {
    product_id: number;
    quantity: string;
    unit_price: string;
}

interface StockOutForm {
    transaction_date: string;
    transaction_type: StockOutType;
    destination: string;
    notes: string;
    items: StockOutItem[];
}

function getTodayDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseNumber(value: string | number | null | undefined) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 2,
    }).format(value);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(value);
}

function getTypeLabel(type: StockOutType) {
    const labels: Record<StockOutType, string> = {
        SALE: "Penjualan",
        USAGE: "Pemakaian Internal",
        DISTRIBUTION: "Distribusi",
        OTHER: "Lainnya",
    };

    return labels[type];
}

export default function StockOutCreate({ products }: Props) {
    const form = useForm<StockOutForm>({
        transaction_date: getTodayDate(),
        transaction_type: "SALE",
        destination: "",
        notes: "",
        items: [],
    });

    const [productSearch, setProductSearch] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");

    const selectedProducts = useMemo(() => {
        const addedIds = form.data.items.map((item) => item.product_id);
        const search = productSearch.trim().toLowerCase();

        return products.filter((product) => {
            const matchesSearch =
                product.name.toLowerCase().includes(search) ||
                product.sku.toLowerCase().includes(search);

            const notAdded = !addedIds.includes(product.id);
            const hasStock = parseNumber(product.stock) > 0;

            return matchesSearch && notAdded && hasStock;
        });
    }, [products, productSearch, form.data.items]);

    const totalQuantity = useMemo(
        () =>
            form.data.items.reduce(
                (total, item) => total + parseNumber(item.quantity),
                0,
            ),
        [form.data.items],
    );

    const totalAmount = useMemo(
        () =>
            form.data.items.reduce(
                (total, item) =>
                    total +
                    parseNumber(item.quantity) * parseNumber(item.unit_price),
                0,
            ),
        [form.data.items],
    );

    const hasStockErrors = useMemo(() => {
        return form.data.items.some((item) => {
            const product = products.find(
                (product) => product.id === item.product_id,
            );

            return (
                !product ||
                parseNumber(item.quantity) <= 0 ||
                parseNumber(item.quantity) > parseNumber(product.stock)
            );
        });
    }, [form.data.items, products]);

    function getProduct(productId: number) {
        return products.find((product) => product.id === productId);
    }

    function addProduct() {
        if (!selectedProductId) return;

        const product = getProduct(Number(selectedProductId));
        if (!product) return;

        if (parseNumber(product.stock) <= 0) {
            toast.error("Produk tidak memiliki stok tersedia.");
            return;
        }

        if (form.data.items.some((item) => item.product_id === product.id)) {
            toast.error("Produk sudah ditambahkan.");
            return;
        }

        form.setData("items", [
            ...form.data.items,
            {
                product_id: product.id,
                quantity: "1",
                unit_price: String(product.selling_price ?? 0),
            },
        ]);

        setSelectedProductId("");
        setProductSearch("");
    }

    function updateItem(
        index: number,
        field: "quantity" | "unit_price",
        value: string,
    ) {
        const items = [...form.data.items];

        items[index] = {
            ...items[index],
            [field]: value,
        };

        form.setData("items", items);
    }

    function removeProduct(index: number) {
        form.setData(
            "items",
            form.data.items.filter((_, itemIndex) => itemIndex !== index),
        );
    }

    function getSubtotal(item: StockOutItem) {
        return parseNumber(item.quantity) * parseNumber(item.unit_price);
    }

    function getQuantityError(index: number) {
        const item = form.data.items[index];
        const product = getProduct(item.product_id);

        if (!product) return "Produk tidak ditemukan.";
        if (item.quantity.trim() === "") return "Quantity wajib diisi.";

        const quantity = parseNumber(item.quantity);
        const stock = parseNumber(product.stock);

        if (quantity <= 0) return "Quantity harus lebih dari 0.";
        if (quantity > stock) return "Melebihi stok tersedia.";

        return null;
    }

    function submit() {
        if (form.data.items.length === 0) {
            toast.error("Tambahkan minimal satu produk.");
            return;
        }

        if (hasStockErrors) {
            toast.error("Periksa quantity. Ada produk yang melebihi stok.");
            return;
        }

        form.post("/inventory/stock-out", {
            preserveScroll: true,

            onSuccess: () => {
                form.reset();
                form.clearErrors();

                setProductSearch("");
                setSelectedProductId("");

                toast.success("Stock Out berhasil disimpan", {
                    description: "Stok produk telah diperbarui.",
                });
            },

            onError: () => {
                toast.error("Gagal menyimpan Stock Out", {
                    description: "Periksa kembali data transaksi.",
                });
            },
        });
    }

    return (
        <>
            <Head title="Stock Out" />

            <div className="space-y-6">
                {/* Header */}
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
                                Stock Out
                            </h1>

                            <p className="text-sm text-muted-foreground">
                                Catat pengeluaran barang dan perbarui stok.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transaction information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="size-5" />
                            Informasi Transaksi
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {/* Transaction type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Jenis Transaksi
                                    <span className="text-destructive"> *</span>
                                </label>

                                <select
                                    value={form.data.transaction_type}
                                    onChange={(e) =>
                                        form.setData(
                                            "transaction_type",
                                            e.target.value as StockOutType,
                                        )
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="SALE">Penjualan</option>
                                    <option value="USAGE">
                                        Pemakaian Internal
                                    </option>
                                    <option value="DISTRIBUTION">
                                        Distribusi
                                    </option>
                                    <option value="OTHER">Lainnya</option>
                                </select>

                                {form.errors.transaction_type && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.transaction_type}
                                    </p>
                                )}
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Tanggal Transaksi
                                    <span className="text-destructive"> *</span>
                                </label>

                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <Input
                                        type="date"
                                        className="pl-9"
                                        value={form.data.transaction_date}
                                        onChange={(e) =>
                                            form.setData(
                                                "transaction_date",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                {form.errors.transaction_date && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.transaction_date}
                                    </p>
                                )}
                            </div>

                            {/* Destination */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Tujuan / Penerima
                                </label>

                                <div className="relative">
                                    <Warehouse className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <Input
                                        className="pl-9"
                                        value={form.data.destination}
                                        onChange={(e) =>
                                            form.setData(
                                                "destination",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Nama customer, departemen, lokasi..."
                                    />
                                </div>

                                {form.errors.destination && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.destination}
                                    </p>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2 md:col-span-2 xl:col-span-3">
                                <label className="text-sm font-medium">
                                    Catatan
                                </label>

                                <textarea
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData("notes", e.target.value)
                                    }
                                    placeholder="Catatan transaksi (opsional)"
                                    rows={3}
                                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />

                                {form.errors.notes && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Product selector */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PackageMinus className="size-5" />
                            Tambah Produk
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    className="pl-9"
                                    placeholder="Cari SKU atau nama produk..."
                                    value={productSearch}
                                    onChange={(e) =>
                                        setProductSearch(e.target.value)
                                    }
                                />
                            </div>

                            <select
                                value={selectedProductId}
                                onChange={(e) =>
                                    setSelectedProductId(e.target.value)
                                }
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">Pilih produk</option>

                                {selectedProducts.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.sku} - {product.name} (Stok:{" "}
                                        {formatNumber(
                                            parseNumber(product.stock),
                                        )}{" "}
                                        {product.unit?.symbol ?? ""})
                                    </option>
                                ))}
                            </select>

                            <Button
                                type="button"
                                onClick={addProduct}
                                disabled={!selectedProductId}
                            >
                                <PackageMinus className="mr-2 size-4" />
                                Tambah
                            </Button>
                        </div>

                        {form.errors.items && (
                            <p className="text-sm text-destructive">
                                {form.errors.items}
                            </p>
                        )}

                        {/* Items */}
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Produk
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Stok Tersedia
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Quantity Keluar
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Harga
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Subtotal
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {form.data.items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-12 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <ShoppingCart className="size-8" />
                                                    <p>Belum ada produk.</p>
                                                    <p className="text-xs">
                                                        Pilih produk yang akan
                                                        dikeluarkan.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        form.data.items.map((item, index) => {
                                            const product = getProduct(
                                                item.product_id,
                                            );
                                            if (!product) return null;

                                            const quantityError =
                                                getQuantityError(index);
                                            const stock = parseNumber(
                                                product.stock,
                                            );

                                            return (
                                                <tr
                                                    key={product.id}
                                                    className="border-t"
                                                >
                                                    {/* Product */}
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">
                                                            {product.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {product.sku}
                                                        </div>
                                                    </td>

                                                    {/* Stock */}
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <span
                                                            className={
                                                                stock <= 0
                                                                    ? "font-medium text-destructive"
                                                                    : "font-medium"
                                                            }
                                                        >
                                                            {formatNumber(
                                                                stock,
                                                            )}
                                                        </span>
                                                        <span className="ml-1 text-xs text-muted-foreground">
                                                            {
                                                                product.unit
                                                                    ?.symbol
                                                            }
                                                        </span>
                                                    </td>

                                                    {/* Quantity */}
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            type="number"
                                                            min="0.001"
                                                            max={stock}
                                                            step="0.001"
                                                            className="w-28 text-right"
                                                            value={
                                                                item.quantity
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    "quantity",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />

                                                        {quantityError && (
                                                            <p className="mt-1 text-xs text-destructive">
                                                                {quantityError}
                                                            </p>
                                                        )}

                                                        {form.errors[
                                                            `items.${index}.quantity`
                                                        ] && (
                                                            <p className="mt-1 text-xs text-destructive">
                                                                {
                                                                    form.errors[
                                                                        `items.${index}.quantity`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Price */}
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="w-36 text-right"
                                                            value={
                                                                item.unit_price
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    "unit_price",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />

                                                        {form.errors[
                                                            `items.${index}.unit_price`
                                                        ] && (
                                                            <p className="mt-1 text-xs text-destructive">
                                                                {
                                                                    form.errors[
                                                                        `items.${index}.unit_price`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Subtotal */}
                                                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                        {formatCurrency(
                                                            getSubtotal(item),
                                                        )}
                                                    </td>

                                                    {/* Remove */}
                                                    <td className="px-4 py-3 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                removeProduct(
                                                                    index,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary */}
                <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                    <Card>
                        <CardContent className="flex gap-3 p-5">
                            <div className="rounded-lg bg-primary/10 p-3 text-primary">
                                <AlertTriangle className="size-5" />
                            </div>

                            <div>
                                <h3 className="font-medium">
                                    Konfirmasi Barang Keluar
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Stok akan langsung berkurang setelah
                                    transaksi disimpan. Pastikan quantity sudah
                                    sesuai. Transaksi tercatat di Stock
                                    Movement.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan Transaksi</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Jenis Transaksi
                                </span>
                                <span className="font-medium">
                                    {getTypeLabel(form.data.transaction_type)}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Total Produk
                                </span>
                                <span className="font-medium">
                                    {form.data.items.length} item
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Qty Gabungan
                                </span>
                                <span className="font-medium">
                                    {formatNumber(totalQuantity)}
                                </span>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between gap-4">
                                    <span className="font-medium">
                                        Total Transaksi
                                    </span>
                                    <span className="text-xl font-bold tracking-tight">
                                        {formatCurrency(totalAmount)}
                                    </span>
                                </div>
                            </div>

                            <Button
                                className="w-full"
                                onClick={submit}
                                disabled={
                                    form.processing ||
                                    form.data.items.length === 0 ||
                                    hasStockErrors
                                }
                            >
                                {form.processing
                                    ? "Menyimpan transaksi..."
                                    : "Simpan Stock Out"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={form.processing}
                                onClick={() =>
                                    router.visit("/inventory/movements")
                                }
                            >
                                Batal
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

StockOutCreate.layout = (page: React.ReactNode) => (
    <DashboardLayout>{page}</DashboardLayout>
);
