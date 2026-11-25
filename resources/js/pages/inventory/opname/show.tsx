import { Head, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    AlertTriangleIcon,
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    Save,
    Search,
    Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/layouts/dashboard-layout";
import { ConfirmDialog } from "@/components/my-components/confirm-dialog";

interface Product {
    id: number;
    sku: string;
    name: string;
    stock: string | number;
    minimum_stock: string | number;
    unit: {
        id: number;
        name: string;
        symbol: string;
    } | null;
}

interface OpnameItem {
    id: number;
    product_id: number;
    system_stock: string | number;
    physical_stock: string | number;
    difference: string | number;
    is_counted: boolean;
    notes: string | null;
    product: Product | null;
}

interface Opname {
    id: number;
    code: string;
    opname_date: string;
    status: "DRAFT" | "POSTED";
    notes: string | null;
    created_at: string;
    posted_at: string | null;
    creator: {
        id: number;
        name: string;
    } | null;
    poster: {
        id: number;
        name: string;
    } | null;
    items: OpnameItem[];
}

interface Props {
    opname: Opname;
}

interface FormItem {
    id: number;
    physical_stock: string;
    is_counted: boolean;
    notes: string;
}

const formatNumber = (value: number | string) =>
    Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    });

const formatDate = (date: string) =>
    new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
    }).format(new Date(date));

export default function StockOpnameShow({ opname }: Props) {
    const [search, setSearch] = useState("");
    const [confirmPostOpen, setConfirmPostOpen] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    const form = useForm<{ items: FormItem[] }>({
        items: opname.items.map((item) => ({
            id: item.id,
            physical_stock: String(item.physical_stock),
            is_counted: item.is_counted ?? false,
            notes: item.notes ?? "",
        })),
    });

    const isPosted = opname.status === "POSTED";

    const itemForm = form.data.items;

    const summary = useMemo(() => {
        const counted = itemForm.filter((item) => item.is_counted);

        const totalDifference = counted.reduce((total, item) => {
            const original = opname.items.find(
                (source) => source.id === item.id,
            );

            if (!original) return total;

            return (
                total +
                Number(item.physical_stock || 0) -
                Number(original.system_stock || 0)
            );
        }, 0);

        return {
            total: itemForm.length,
            counted: counted.length,
            uncounted: itemForm.length - counted.length,
            difference: totalDifference,
        };
    }, [itemForm, opname.items]);

    const filteredItems = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        return opname.items.filter((item) => {
            const product = item.product;

            if (!product) return false;

            return (
                product.name.toLowerCase().includes(keyword) ||
                product.sku.toLowerCase().includes(keyword)
            );
        });
    }, [opname.items, search]);

    const updateItem = (
        itemId: number,
        field: keyof FormItem,
        value: string | boolean,
    ) => {
        form.setData(
            "items",
            form.data.items.map((item) =>
                item.id === itemId
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item,
            ),
        );
    };

    const handleSave = () => {
        form.put(`/inventory/opname/${opname.id}`, {
            preserveScroll: true,
        });
    };

    function handlePost() {
        setConfirmPostOpen(true);
    }

    function confirmPost() {
        if (form.processing || isPosting) return;

        setIsPosting(true);

        form.put(`/inventory/opname/${opname.id}`, {
            preserveScroll: true,

            onSuccess: () => {
                router.post(
                    `/inventory/opname/${opname.id}/post`,
                    {},
                    {
                        preserveScroll: true,

                        onSuccess: () => {
                            setConfirmPostOpen(false);
                        },

                        onError: () => {
                            setConfirmPostOpen(false);
                        },

                        onFinish: () => {
                            setIsPosting(false);
                        },
                    },
                );
            },

            onError: () => {
                setIsPosting(false);
            },
        });
    }

    return (
        <>
            <Head title={`Stock Opname ${opname.code}`} />

            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                    router.visit("/inventory/opname")
                                }
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Stock Opname
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {opname.code}
                                </p>
                            </div>
                        </div>

                        <div>
                            {isPosted ? (
                                <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-600">
                                    <CheckCircle2 className="mr-2 size-4" />
                                    Posted
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-600">
                                    Draft
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Informasi opname */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Tanggal Opname
                            </p>
                            <p className="mt-2 font-semibold">
                                {formatDate(opname.opname_date)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Dibuat Oleh
                            </p>
                            <p className="mt-2 font-semibold">
                                {opname.creator?.name ?? "-"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>
                            <p className="mt-2 font-semibold">
                                {isPosted
                                    ? "Stock Opname Selesai"
                                    : "Belum Diposting"}
                            </p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Total Produk
                            </p>
                            <p className="mt-2 text-2xl font-bold">
                                {summary.total}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Sudah Dihitung
                            </p>
                            <p className="mt-2 text-2xl font-bold text-green-600">
                                {summary.counted}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Belum Dihitung
                            </p>
                            <p className="mt-2 text-2xl font-bold text-amber-600">
                                {summary.uncounted}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Total Selisih
                            </p>
                            <p
                                className={`mt-2 text-2xl font-bold ${
                                    summary.difference < 0
                                        ? "text-red-600"
                                        : summary.difference > 0
                                          ? "text-green-600"
                                          : ""
                                }`}
                            >
                                {summary.difference > 0 ? "+" : ""}
                                {formatNumber(summary.difference)}
                            </p>
                        </div>
                    </div>

                    {/* Catatan */}
                    {opname.notes && (
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="mb-1 text-sm font-medium">
                                Catatan Opname
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {opname.notes}
                            </p>
                        </div>
                    )}

                    {/* Produk */}
                    <div className="rounded-xl border border-border bg-card">
                        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold">Daftar Produk</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Masukkan jumlah stok fisik hasil
                                    perhitungan.
                                </p>
                            </div>

                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari SKU atau nama produk..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="border-b border-border">
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
                                        <th className="px-4 py-3 text-center">
                                            Status Hitung
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Catatan
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredItems.map((item) => {
                                        const product = item.product;

                                        if (!product) return null;

                                        const data = form.data.items.find(
                                            (row) => row.id === item.id,
                                        );

                                        if (!data) return null;

                                        const physical = Number(
                                            data.physical_stock || 0,
                                        );

                                        const system = Number(
                                            item.system_stock || 0,
                                        );

                                        const difference =
                                            Math.round(
                                                (physical - system) * 1000,
                                            ) / 1000;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-b border-border last:border-0"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {product.sku}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    {formatNumber(system)}{" "}
                                                    {product.unit?.symbol}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.001"
                                                        value={
                                                            data.physical_stock
                                                        }
                                                        disabled={isPosted}
                                                        className="ml-auto w-32 text-right"
                                                        onChange={(e) =>
                                                            updateItem(
                                                                item.id,
                                                                "physical_stock",
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <span
                                                        className={`font-medium ${
                                                            difference < 0
                                                                ? "text-red-600"
                                                                : difference > 0
                                                                  ? "text-green-600"
                                                                  : "text-muted-foreground"
                                                        }`}
                                                    >
                                                        {difference > 0
                                                            ? "+"
                                                            : ""}
                                                        {formatNumber(
                                                            difference,
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <label className="inline-flex items-center justify-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                data.is_counted
                                                            }
                                                            disabled={isPosted}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    "is_counted",
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                            className="size-4 accent-primary"
                                                        />

                                                        <span className="text-xs">
                                                            {data.is_counted
                                                                ? "Dihitung"
                                                                : "Belum"}
                                                        </span>
                                                    </label>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Input
                                                        value={data.notes}
                                                        disabled={isPosted}
                                                        placeholder="Catatan..."
                                                        onChange={(e) =>
                                                            updateItem(
                                                                item.id,
                                                                "notes",
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-12 text-center text-muted-foreground"
                                            >
                                                Produk tidak ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        {!isPosted && (
                            <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.visit("/inventory/opname")
                                    }
                                >
                                    Kembali
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleSave}
                                    disabled={form.processing}
                                >
                                    <Save className="mr-2 size-4" />
                                    {form.processing
                                        ? "Menyimpan..."
                                        : "Simpan Draft"}
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handlePost}
                                    disabled={
                                        form.processing ||
                                        isPosting ||
                                        summary.uncounted > 0
                                    }
                                    className="cursor-pointer"
                                >
                                    <Send className="mr-2 size-4" />

                                    {isPosting
                                        ? "Memproses Posting..."
                                        : "Posting Opname"}
                                </Button>
                            </div>
                        )}

                        {isPosted && (
                            <div className="border-t border-border p-4">
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle2 className="size-4" />
                                    Opname sudah diposting dan stok telah
                                    diperbarui.
                                </div>

                                <p className="mt-2 text-sm text-muted-foreground">
                                    Diposting oleh: {opname.poster?.name ?? "-"}
                                </p>

                                {opname.posted_at && (
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(
                                            opname.posted_at,
                                        ).toLocaleString("id-ID")}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {Object.keys(form.errors).length > 0 && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            <div className="font-medium">
                                Gagal menyimpan Stock Opname
                            </div>

                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                {Object.entries(form.errors).map(
                                    ([key, message]) => (
                                        <li key={key}>{message}</li>
                                    ),
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                <ConfirmDialog
                    open={confirmPostOpen}
                    onOpenChange={setConfirmPostOpen}
                    onConfirm={confirmPost}
                    title="Posting Stock Opname?"
                    description="Stock opname akan diposting dan stok produk akan disesuaikan dengan hasil perhitungan fisik. Setelah diposting, data opname tidak dapat diubah kembali."
                    confirmText="Ya, Posting"
                    cancelText="Batal"
                    loading={form.processing || isPosting}
                    variant="default"
                    icon={<AlertTriangleIcon />}
                />
            </DashboardLayout>
        </>
    );
}
