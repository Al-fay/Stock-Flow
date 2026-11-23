import { useEffect, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import type {
    ColumnDef,
    PaginationState,
    SortingState,
} from "@tanstack/react-table";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { DataTable } from "@/components/master-data/data-table";
import type { PaginatedData } from "@/types/master-data";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/layouts/dashboard-layout";

interface Category {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

interface CategoryPageProps {
    categories: PaginatedData<Category>;
    filters: {
        search: string;
        sort: string;
        direction: "asc" | "desc";
        per_page: number;
    };
}

interface CategoryForm {
    code: string;
    name: string;
    description: string;
    is_active: boolean;
}

const initialForm: CategoryForm = {
    code: "",
    name: "",
    description: "",
    is_active: true,
};

export default function CategoryIndex({
    categories,
    filters,
}: CategoryPageProps) {
    const [search, setSearch] = useState(filters.search);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );

    const form = useForm<CategoryForm>(initialForm);

    // Search dengan debounce
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (search !== filters.search) {
                router.get(
                    "/master-data/categories",
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
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    // Buka modal tambah
    const openCreateModal = () => {
        setEditingCategory(null);
        form.reset();
        form.clearErrors();
        form.setData(initialForm);
        setModalOpen(true);
    };

    // Buka modal edit
    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        form.clearErrors();

        form.setData({
            code: category.code,
            name: category.name,
            description: category.description ?? "",
            is_active: category.is_active,
        });

        setModalOpen(true);
    };

    // Tutup modal
    const closeModal = () => {
        if (form.processing) return;

        setModalOpen(false);
        setEditingCategory(null);
        form.reset();
        form.clearErrors();
    };

    // Simpan kategori
    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                setEditingCategory(null);
                form.reset();
            },
        };

        if (editingCategory) {
            form.put(`/master-data/categories/${editingCategory.id}`, options);
        } else {
            form.post("/master-data/categories", options);
        }
    };

    // Hapus kategori
    const deleteCategory = (category: Category) => {
        const confirmed = window.confirm(
            `Apakah kamu yakin ingin menghapus kategori "${category.name}"?`,
        );

        if (!confirmed) return;

        router.delete(`/master-data/categories/${category.id}`, {
            preserveScroll: true,
        });
    };

    // Pagination
    const handlePaginationChange = (pagination: PaginationState) => {
        router.get(
            "/master-data/categories",
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

    // Sorting
    const handleSortingChange = (sorting: SortingState) => {
        const currentSort = sorting[0];

        router.get(
            "/master-data/categories",
            {
                search,
                sort: currentSort?.id ?? "created_at",
                direction: currentSort?.desc ? "desc" : "asc",
                per_page: filters.per_page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    // Kolom tabel
    const columns: ColumnDef<Category, unknown>[] = [
        {
            accessorKey: "code",
            header: "Kode",
            enableSorting: true,
            cell: ({ row }) => (
                <span className="font-mono text-sm font-medium">
                    {row.original.code}
                </span>
            ),
        },
        {
            accessorKey: "name",
            header: "Nama Kategori",
            enableSorting: true,
            cell: ({ row }) => (
                <span className="font-medium">{row.original.name}</span>
            ),
        },
        {
            accessorKey: "description",
            header: "Deskripsi",
            enableSorting: false,
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.description || "-"}
                </span>
            ),
        },
        {
            accessorKey: "is_active",
            header: "Status",
            enableSorting: false,
            cell: ({ row }) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        row.original.is_active
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                    }`}
                >
                    {row.original.is_active ? "Aktif" : "Tidak Aktif"}
                </span>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Tanggal Dibuat",
            enableSorting: true,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(row.original.created_at).toLocaleDateString(
                        "id-ID",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        },
                    )}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Aksi",
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => openEditModal(row.original)}
                        title="Edit kategori"
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <Pencil className="size-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => deleteCategory(row.original)}
                        title="Hapus kategori"
                        className="inline-flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Master Data Kategori" />

            <DashboardLayout>
                <div className="min-w-0 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Kategori Produk
                                </h1>
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Kelola kategori produk untuk mengorganisasi
                                inventaris.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <Plus className="size-4" />
                            Tambah Kategori
                        </button>
                    </div>

                    {/* Statistics */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Total Kategori
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {categories.total}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Data Ditampilkan
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {categories.data.length}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Total Halaman
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {categories.last_page}
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card p-3 sm:p-5">
                        <div className="mb-5">
                            <h2 className="font-semibold">Daftar Kategori</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Kelola seluruh kategori produk.
                            </p>
                        </div>

                        <DataTable
                            data={categories.data}
                            columns={columns}
                            pagination={categories}
                            search={search}
                            onSearchChange={setSearch}
                            onPaginationChange={handlePaginationChange}
                            onSortingChange={handleSortingChange}
                        />
                    </div>
                </div>

                {/* Modal Create / Edit */}
                {modalOpen && (
                    <div
                        className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeModal();
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="category-modal-title"
                            className="my-auto w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                                <div>
                                    <h2
                                        id="category-modal-title"
                                        className="text-lg font-semibold"
                                    >
                                        {editingCategory
                                            ? "Edit Kategori"
                                            : "Tambah Kategori"}
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {editingCategory
                                            ? "Perbarui informasi kategori produk."
                                            : "Masukkan informasi kategori produk baru."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={form.processing}
                                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={submit}>
                                <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
                                    {/* Code */}
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="code"
                                            className="text-sm font-medium"
                                        >
                                            Kode Kategori
                                            <span className="text-destructive">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <input
                                            id="code"
                                            type="text"
                                            value={form.data.code}
                                            onChange={(event) =>
                                                form.setData(
                                                    "code",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Contoh: CAT-001"
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                                        />

                                        {form.errors.code && (
                                            <p className="text-xs text-destructive">
                                                {form.errors.code}
                                            </p>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="name"
                                            className="text-sm font-medium"
                                        >
                                            Nama Kategori
                                            <span className="text-destructive">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <input
                                            id="name"
                                            type="text"
                                            value={form.data.name}
                                            onChange={(event) =>
                                                form.setData(
                                                    "name",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Contoh: Elektronik"
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                                        />

                                        {form.errors.name && (
                                            <p className="text-xs text-destructive">
                                                {form.errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="description"
                                            className="text-sm font-medium"
                                        >
                                            Deskripsi
                                        </label>

                                        <textarea
                                            id="description"
                                            rows={3}
                                            value={form.data.description}
                                            onChange={(event) =>
                                                form.setData(
                                                    "description",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Deskripsi kategori (opsional)"
                                            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                                        />

                                        {form.errors.description && (
                                            <p className="text-xs text-destructive">
                                                {form.errors.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                                        <div className="space-y-1">
                                            <label
                                                htmlFor="is_active"
                                                className="text-sm font-medium"
                                            >
                                                Status Kategori
                                            </label>

                                            <p className="text-xs text-muted-foreground">
                                                {form.data.is_active
                                                    ? "Kategori aktif dan dapat digunakan."
                                                    : "Kategori dinonaktifkan."}
                                            </p>
                                        </div>

                                        <Switch
                                            id="is_active"
                                            checked={form.data.is_active}
                                            onCheckedChange={(checked) =>
                                                form.setData(
                                                    "is_active",
                                                    checked,
                                                )
                                            }
                                            disabled={form.processing}
                                        />
                                    </div>

                                    {form.errors.is_active && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.is_active}
                                        </p>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={form.processing}
                                        className="h-10 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                                    >
                                        Batal
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {form.processing
                                            ? "Menyimpan..."
                                            : editingCategory
                                              ? "Simpan Perubahan"
                                              : "Simpan Kategori"}
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
