import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import {
    createColumnHelper,
    type ColumnDef,
    type PaginationState,
    type SortingState,
} from "@tanstack/react-table";
import DashboardLayout from "@/layouts/dashboard-layout";
import { DataTable } from "@/components/master-data/data-table";
import { Switch } from "@/components/ui/switch";

interface CategoryOption {
    id: number;
    name: string;
}

interface UnitOption {
    id: number;
    name: string;
    symbol: string;
}

interface Product {
    id: number;
    category_id: number | null;
    unit_id: number;
    sku: string;
    barcode: string | null;
    name: string;
    description: string | null;
    purchase_price: string | number;
    selling_price: string | number;
    stock: string | number;
    minimum_stock: string | number;
    is_active: boolean;
    created_at: string;
    category: CategoryOption | null;
    unit: UnitOption | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface ProductPageProps {
    products: PaginatedData<Product>;
    categories: CategoryOption[];
    units: UnitOption[];
    filters: {
        search: string;
        sort: string;
        direction: "asc" | "desc";
        per_page: number;
    };
}

interface ProductForm {
    category_id: string;
    unit_id: string;
    sku: string;
    barcode: string;
    name: string;
    description: string;
    purchase_price: string;
    selling_price: string;
    minimum_stock: string;
    is_active: boolean;
}

const initialForm: ProductForm = {
    category_id: "",
    unit_id: "",
    sku: "",
    barcode: "",
    name: "",
    description: "",
    purchase_price: "0",
    selling_price: "0",
    minimum_stock: "0",
    is_active: true,
};

const columnHelper = createColumnHelper<Product>();

function formatCurrency(value: string | number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value));
}

function formatNumber(value: string | number) {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(Number(value));
}

export default function ProductsIndex({
    products,
    categories,
    units,
    filters,
}: ProductPageProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [search, setSearch] = useState(filters.search ?? "");

    const form = useForm<ProductForm>(initialForm);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                "/master-data/products",
                {
                    search,
                    sort: filters.sort,
                    direction: filters.direction,
                    per_page: filters.per_page,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 400);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const openCreateModal = () => {
        setEditingProduct(null);
        form.reset();
        form.clearErrors();
        form.setData(initialForm);
        setModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        form.clearErrors();

        form.setData({
            category_id: product.category_id ? String(product.category_id) : "",
            unit_id: String(product.unit_id),
            sku: product.sku,
            barcode: product.barcode ?? "",
            name: product.name,
            description: product.description ?? "",
            purchase_price: String(product.purchase_price),
            selling_price: String(product.selling_price),
            minimum_stock: String(product.minimum_stock),
            is_active: product.is_active,
        });

        setModalOpen(true);
    };

    const closeModal = () => {
        if (form.processing) return;

        setModalOpen(false);
        setEditingProduct(null);
        form.reset();
        form.clearErrors();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                setEditingProduct(null);
                form.reset();
            },
        };

        if (editingProduct) {
            form.put(`/master-data/products/${editingProduct.id}`, options);
        } else {
            form.post("/master-data/products", options);
        }
    };

    const deleteProduct = (product: Product) => {
        const confirmed = window.confirm(
            `Apakah kamu yakin ingin menghapus produk "${product.name}"?`,
        );

        if (!confirmed) return;

        router.delete(`/master-data/products/${product.id}`, {
            preserveScroll: true,
        });
    };

    const columns = useMemo<ColumnDef<Product, any>[]>(
        () => [
            columnHelper.accessor("sku", {
                header: "SKU",
                cell: (info) => (
                    <span className="font-medium text-foreground">
                        {info.getValue()}
                    </span>
                ),
            }),

            columnHelper.accessor("name", {
                header: "Produk",
                cell: ({ row }) => (
                    <div className="min-w-40">
                        <p className="font-medium text-foreground">
                            {row.original.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.barcode || "Tanpa barcode"}
                        </p>
                    </div>
                ),
            }),

            columnHelper.display({
                id: "category",
                header: "Kategori",
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.category?.name ?? "-"}
                    </span>
                ),
            }),

            columnHelper.display({
                id: "unit",
                header: "Satuan",
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.unit
                            ? `${row.original.unit.name} (${row.original.unit.symbol})`
                            : "-"}
                    </span>
                ),
            }),

            columnHelper.accessor("purchase_price", {
                header: "Harga Beli",
                cell: (info) => (
                    <span className="whitespace-nowrap">
                        {formatCurrency(info.getValue())}
                    </span>
                ),
            }),

            columnHelper.accessor("selling_price", {
                header: "Harga Jual",
                cell: (info) => (
                    <span className="whitespace-nowrap font-medium">
                        {formatCurrency(info.getValue())}
                    </span>
                ),
            }),

            columnHelper.accessor("stock", {
                header: "Stok",
                cell: ({ row }) => {
                    const stock = Number(row.original.stock);
                    const minimum = Number(row.original.minimum_stock);
                    const isLow = stock <= minimum;

                    return (
                        <div>
                            <span
                                className={
                                    isLow
                                        ? "font-semibold text-destructive"
                                        : "font-medium text-foreground"
                                }
                            >
                                {formatNumber(stock)}
                            </span>
                            {isLow && (
                                <p className="text-xs text-destructive">
                                    Stok minimum
                                </p>
                            )}
                        </div>
                    );
                },
            }),

            columnHelper.display({
                id: "status",
                header: "Status",
                cell: ({ row }) => (
                    <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            row.original.is_active
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                        }`}
                    >
                        {row.original.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                ),
            }),

            columnHelper.display({
                id: "actions",
                header: "Aksi",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => openEditModal(row.original)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={() => deleteProduct(row.original)}
                            className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                            Hapus
                        </button>
                    </div>
                ),
            }),
        ],
        [],
    );

    const handlePaginationChange = (pagination: PaginationState) => {
        router.get(
            "/master-data/products",
            {
                search,
                sort: filters.sort,
                direction: filters.direction,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSortingChange = (sorting: SortingState) => {
        const firstSort = sorting[0];

        router.get(
            "/master-data/products",
            {
                search,
                sort: firstSort?.id ?? "created_at",
                direction: firstSort?.desc ? "desc" : "asc",
                per_page: filters.per_page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <DashboardLayout>
            <Head title="Produk" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Produk
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kelola data produk, harga, kategori, dan stok.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                        + Tambah Produk
                    </button>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                    <DataTable
                        data={products.data}
                        columns={columns}
                        pagination={products}
                        search={search}
                        onSearchChange={setSearch}
                        onPaginationChange={handlePaginationChange}
                        onSortingChange={handleSortingChange}
                    />
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                    <div className="my-auto w-full max-w-3xl rounded-2xl border border-border bg-card shadow-xl">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {editingProduct
                                        ? "Edit Produk"
                                        : "Tambah Produk"}
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
                                            form.setData("sku", e.target.value)
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
                                            form.setData("name", e.target.value)
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
                                        <option value="">Tanpa kategori</option>
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
                                        <option value="">Pilih satuan</option>
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
                                        value={
                                            editingProduct
                                                ? formatNumber(
                                                      editingProduct.stock,
                                                  )
                                                : "0"
                                        }
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
                                            form.setData("is_active", checked)
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
                                        : editingProduct
                                          ? "Simpan Perubahan"
                                          : "Tambah Produk"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
