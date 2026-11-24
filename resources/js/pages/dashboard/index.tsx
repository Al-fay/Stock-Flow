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
} from "lucide-react";

import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    initialForm,
    ProductForm,
    ProductPageProps,
} from "../master-data/products";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface SharedProps {
    [key: string]: unknown;
    auth: {
        user: { id: number; name: string; email: string } | null;
    };
}

interface DashboardProps extends Pick<
    ProductPageProps,
    "categories" | "units"
> {
    stats: {
        total_products: number;
        active_products: number;
        stock_value: number;
        low_stock: number;
    };
    inventorySummary: { name: string; value: number; color: string }[];
    chart: { day: string; value: number }[];
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
    categories = [],
    units = [],
    stats,
    inventorySummary,
    chart,
    recentProducts,
}: DashboardProps) {
    const { auth } = usePage<SharedProps>().props;
    const form = useForm<ProductForm>(initialForm);
    const [modalOpen, setModalOpen] = useState(false);

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

    const handleLogout = () => {
        router.post("/logout");
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
