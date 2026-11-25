import { Head, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
    ArrowLeft,
    PackagePlus,
    Search,
    Trash2,
    ShoppingCart,
    Truck,
    CalendarDays,
    CreditCard,
    FileText,
    Package,
} from "lucide-react";
import { toast } from "sonner";

interface Supplier {
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
    sku: string;
    name: string;
    purchase_price: string | number;
    stock: string | number;
    unit?: Unit | null;
}

interface Props {
    suppliers: Supplier[];
    products: Product[];
}

interface StockInItem {
    product_id: number;
    quantity: string;
    unit_cost: string;
}

interface StockInForm {
    supplier_id: string;
    transaction_date: string;
    payment_method: string;
    notes: string;
    items: StockInItem[];
}

function getTodayDate() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(value);
}

function parseNumber(value: string | number) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

export default function StockInCreate({ suppliers, products }: Props) {
    const form = useForm<StockInForm>({
        supplier_id: "",
        transaction_date: getTodayDate(),
        payment_method: "CASH",
        notes: "",
        items: [],
    });

    const [productSearch, setProductSearch] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");

    const selectedProducts = useMemo(() => {
        const addedIds = form.data.items.map((item) => item.product_id);

        return products.filter((product) => {
            const search = productSearch.toLowerCase();

            const matchesSearch =
                product.name.toLowerCase().includes(search) ||
                product.sku.toLowerCase().includes(search);

            const notAdded = !addedIds.includes(product.id);

            return matchesSearch && notAdded;
        });
    }, [products, productSearch, form.data.items]);

    const totalQuantity = useMemo(() => {
        return form.data.items.reduce((total, item) => {
            return total + parseNumber(item.quantity);
        }, 0);
    }, [form.data.items]);

    const totalAmount = useMemo(() => {
        return form.data.items.reduce((total, item) => {
            return (
                total + parseNumber(item.quantity) * parseNumber(item.unit_cost)
            );
        }, 0);
    }, [form.data.items]);

    function addProduct() {
        if (!selectedProductId) return;

        const product = products.find(
            (item) => item.id === Number(selectedProductId),
        );

        if (!product) return;

        if (form.data.items.some((item) => item.product_id === product.id)) {
            return;
        }

        form.setData("items", [
            ...form.data.items,
            {
                product_id: product.id,
                quantity: "1",
                unit_cost: String(product.purchase_price ?? 0),
            },
        ]);

        setSelectedProductId("");
        setProductSearch("");
    }

    function updateItem(
        index: number,
        field: "quantity" | "unit_cost",
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
            form.data.items.filter((_, i) => i !== index),
        );
    }

    function getProduct(productId: number) {
        return products.find((product) => product.id === productId);
    }

    function getSubtotal(item: StockInItem) {
        return parseNumber(item.quantity) * parseNumber(item.unit_cost);
    }

    function submit() {
        if (form.data.items.length === 0) {
            toast.error("Tambahkan minimal satu produk.");
            return;
        }

        if (!form.data.supplier_id) {
            toast.error("Supplier wajib dipilih.");
            return;
        }

        form.post("/inventory/stock-in", {
            preserveScroll: true,

            onSuccess: () => {
                form.reset();
                form.clearErrors();

                setProductSearch("");
                setSelectedProductId("");

                toast.success("Stock In berhasil disimpan", {
                    description: "Stok produk telah diperbarui.",
                });
            },

            onError: () => {
                toast.error("Gagal menyimpan Stock In", {
                    description: "Periksa kembali data transaksi.",
                });
            },
        });
    }

    return (
        <>
            <Head title="Stock In" />

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
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Stock In
                            </h1>

                            <p className="text-sm text-muted-foreground">
                                Catat penerimaan barang dari supplier.
                            </p>
                        </div>
                    </div>
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
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {/* Supplier */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Supplier
                                    <span className="text-destructive"> *</span>
                                </label>

                                <select
                                    value={form.data.supplier_id}
                                    onChange={(e) =>
                                        form.setData(
                                            "supplier_id",
                                            e.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Pilih supplier</option>

                                    {suppliers.map((supplier) => (
                                        <option
                                            key={supplier.id}
                                            value={supplier.id}
                                        >
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>

                                {form.errors.supplier_id && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.supplier_id}
                                    </p>
                                )}
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Tanggal Transaksi
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

                            {/* Payment */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Metode Pembayaran
                                </label>

                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <select
                                        value={form.data.payment_method}
                                        onChange={(e) =>
                                            form.setData(
                                                "payment_method",
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                                    >
                                        <option value="CASH">Cash</option>

                                        <option value="TRANSFER">
                                            Transfer
                                        </option>

                                        <option value="QRIS">QRIS</option>

                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>

                                {form.errors.payment_method && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.payment_method}
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

                {/* Product Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PackagePlus className="size-5" />
                            Tambah Produk
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                            {/* Search */}
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

                            {/* Product */}
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
                                        {product.sku} - {product.name}
                                    </option>
                                ))}
                            </select>

                            <Button
                                type="button"
                                onClick={addProduct}
                                disabled={!selectedProductId}
                            >
                                <PackagePlus className="mr-2 size-4" />
                                Tambah
                            </Button>
                        </div>

                        {form.errors.items && (
                            <p className="text-sm text-destructive">
                                {form.errors.items}
                            </p>
                        )}

                        {/* Items Table */}
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Produk
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Stok Saat Ini
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Quantity
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Harga Beli
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
                                                        Pilih produk di atas
                                                        untuk memulai transaksi.
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

                                                    {/* Current Stock */}
                                                    <td className="px-4 py-3 text-right">
                                                        {formatNumber(
                                                            parseNumber(
                                                                product.stock,
                                                            ),
                                                        )}

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

                                                    {/* Unit Cost */}
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="w-36 text-right"
                                                            value={
                                                                item.unit_cost
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    "unit_cost",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />

                                                        {form.errors[
                                                            `items.${index}.unit_cost`
                                                        ] && (
                                                            <p className="mt-1 text-xs text-destructive">
                                                                {
                                                                    form.errors[
                                                                        `items.${index}.unit_cost`
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

                                                    {/* Delete */}
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
                    {/* Information */}
                    <Card>
                        <CardContent className="flex gap-3 p-5">
                            <div className="rounded-lg bg-primary/10 p-3 text-primary">
                                <Truck className="size-5" />
                            </div>

                            <div>
                                <h3 className="font-medium">
                                    Penerimaan Barang
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Setelah transaksi disimpan, stok produk akan
                                    langsung bertambah dan transaksi tercatat di
                                    Stock Movement.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Totals */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan Transaksi</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
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
                                    Total Quantity
                                </span>

                                <span className="font-medium">
                                    {formatNumber(totalQuantity)}
                                </span>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between gap-4">
                                    <span className="font-medium">
                                        Total Pembelian
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
                                    !form.data.supplier_id
                                }
                            >
                                {form.processing
                                    ? "Menyimpan transaksi..."
                                    : "Simpan Stock In"}
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

StockInCreate.layout = (page: React.ReactNode) => (
    <DashboardLayout>{page}</DashboardLayout>
);
