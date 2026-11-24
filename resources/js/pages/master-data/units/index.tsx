import { useEffect, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/master-data/data-table";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/my-components/confirm-dialog";

interface Unit {
    id: number;
    code: string;
    name: string;
    symbol: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface UnitPageProps {
    units: PaginatedData<Unit>;
    filters: {
        search?: string;
        sort?: string;
        direction?: "asc" | "desc";
        per_page?: number;
    };
    errors?: Record<string, string>;
}

interface UnitFormData {
    code: string;
    name: string;
    symbol: string;
    description: string;
    is_active: boolean;
}

export default function UnitsIndex({ units, filters }: UnitPageProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [search, setSearch] = useState(filters.search ?? "");
    const [deleteError, setDeleteError] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const form = useForm<UnitFormData>({
        code: "",
        name: "",
        symbol: "",
        description: "",
        is_active: true,
    });

    // Search dengan debounce
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (search !== (filters.search ?? "")) {
                router.get(
                    "/master-data/units",
                    {
                        search: search || undefined,
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

    const openCreateModal = () => {
        setEditingUnit(null);
        setDeleteError("");

        form.reset();
        form.clearErrors();
        form.setData({
            code: "",
            name: "",
            symbol: "",
            description: "",
            is_active: true,
        });

        setModalOpen(true);
    };

    const openEditModal = (unit: Unit) => {
        setEditingUnit(unit);
        setDeleteError("");

        form.clearErrors();
        form.setData({
            code: unit.code,
            name: unit.name,
            symbol: unit.symbol,
            description: unit.description ?? "",
            is_active: unit.is_active,
        });

        setModalOpen(true);
    };

    const closeModal = () => {
        if (form.processing) return;

        setModalOpen(false);
        setEditingUnit(null);
        form.clearErrors();
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const isEditing = !!editingUnit;

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
                    {
                        description: isEditing
                            ? "Data satuan berhasil diperbarui."
                            : "Data satuan berhasil ditambahkan.",
                    },
                );

                setModalOpen(false);
                setEditingUnit(null);
                form.reset();
            },
            onError: () => {
                toast.error("Gagal menyimpan", {
                    description:
                        "Periksa kembali data satuan yang kamu masukkan.",
                });
            },
        };

        if (editingUnit) {
            form.put(`/master-data/units/${editingUnit.id}`, options);
        } else {
            form.post("/master-data/units", options);
        }
    };

    const deleteUnit = (unit: Unit) => {
        setDeletingUnit(unit);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteCategory = () => {
        if (!deletingUnit) return;

        setDeleteProcessing(true);

        router.delete(`/master-data/units/${deletingUnit.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Berhasil dihapus", {
                    description: `Satuan "${deletingUnit.name}" berhasil dihapus.`,
                });

                setDeleteDialogOpen(false);
                setDeletingUnit(null);
            },
            onError: () => {
                toast.error("Gagal menghapus", {
                    description: "Terjadi kesalahan saat menghapus satuan.",
                });
            },
            onFinish: () => {
                setDeleteProcessing(false);
            },
        });
    };

    const updateSatuanStatus = (id: number, is_active: boolean) => {
        router.patch(
            `/master-data/units/${id}/status`,
            { is_active },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Berhasil disimpan", {
                        description: `Status satuan berhasil ${
                            is_active ? "diaktifkan" : "dinonaktifkan"
                        }.`,
                    });
                },
                onError: () => {
                    toast.error("Gagal disimpan", {
                        description:
                            "Terjadi kesalahan saat mengubah status satuan.",
                    });
                },
            },
        );
    };

    const handlePaginationChange = (pagination: PaginationState) => {
        router.get(
            "/master-data/units",
            {
                search: search || undefined,
                sort: filters.sort,
                direction: filters.direction,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSortingChange = (sorting: SortingState) => {
        const currentSort = sorting[0];

        router.get(
            "/master-data/units",
            {
                search: search || undefined,
                sort: currentSort?.id ?? "created_at",
                direction: currentSort?.desc ? "desc" : "asc",
                per_page: filters.per_page ?? 10,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const columns = [
        {
            accessorKey: "code",
            header: "Kode",
            cell: ({ row }: any) => (
                <span className="font-medium text-foreground">
                    {row.original.code}
                </span>
            ),
        },
        {
            accessorKey: "name",
            header: "Nama Satuan",
            cell: ({ row }: any) => (
                <span className="text-foreground">{row.original.name}</span>
            ),
        },
        {
            accessorKey: "symbol",
            header: "Simbol",
            cell: ({ row }: any) => (
                <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                    {row.original.symbol}
                </span>
            ),
        },
        {
            accessorKey: "description",
            header: "Deskripsi",
            cell: ({ row }: any) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.description || "-"}
                </span>
            ),
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }: any) => (
                <div className="flex flex-col items-center gap-1.5 cursor-pointer">
                    <Switch
                        checked={row.original.is_active}
                        onCheckedChange={(checked) => {
                            updateSatuanStatus(row.original.id, checked);
                        }}
                    />

                    <span
                        className={`text-xs font-medium  ${
                            row.original.is_active
                                ? "text-primary"
                                : "text-muted-foreground"
                        }`}
                    >
                        {row.original.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Tanggal Dibuat",
            cell: ({ row }: any) => (
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
            cell: ({ row }: any) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => openEditModal(row.original)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Edit satuan"
                    >
                        <Pencil className="size-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => deleteUnit(row.original)}
                        title="Hapus satuan"
                        className="inline-flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Satuan Produk" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Satuan Produk
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Kelola satuan pengukuran untuk produk inventaris.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                    >
                        <Plus className="size-4" />
                        Tambah Satuan
                    </button>
                </div>

                {/* Delete error */}
                {deleteError && (
                    <div className="flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        <span>{deleteError}</span>
                        <button
                            type="button"
                            onClick={() => setDeleteError("")}
                            className="font-semibold"
                        >
                            Tutup
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                    <DataTable
                        data={units.data}
                        columns={columns}
                        pagination={units}
                        search={search}
                        onSearchChange={setSearch}
                        onPaginationChange={handlePaginationChange}
                        onSortingChange={handleSortingChange}
                    />
                </div>
            </div>

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
                    <div className="my-auto w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
                        <div className="border-b border-border px-6 py-5">
                            <h2 className="text-lg font-semibold text-foreground">
                                {editingUnit ? "Edit Satuan" : "Tambah Satuan"}
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {editingUnit
                                    ? "Perbarui informasi satuan produk."
                                    : "Masukkan informasi satuan produk baru."}
                            </p>
                        </div>

                        <form onSubmit={submit}>
                            <div className="space-y-4 px-6 py-5">
                                {/* Code */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Kode Satuan
                                    </label>

                                    <input
                                        type="text"
                                        value={form.data.code}
                                        onChange={(e) =>
                                            form.setData("code", e.target.value)
                                        }
                                        placeholder="Contoh: UNIT"
                                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />

                                    {form.errors.code && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.code}
                                        </p>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Nama Satuan
                                    </label>

                                    <input
                                        type="text"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData("name", e.target.value)
                                        }
                                        placeholder="Contoh: Pieces"
                                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />

                                    {form.errors.name && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Symbol */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Simbol
                                    </label>

                                    <input
                                        type="text"
                                        value={form.data.symbol}
                                        onChange={(e) =>
                                            form.setData(
                                                "symbol",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: pcs"
                                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />

                                    {form.errors.symbol && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.symbol}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Deskripsi
                                        <span className="ml-1 font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </label>

                                    <textarea
                                        value={form.data.description}
                                        onChange={(e) =>
                                            form.setData(
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                        rows={3}
                                        placeholder="Keterangan satuan..."
                                        className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />

                                    {form.errors.description && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.description}
                                        </p>
                                    )}
                                </div>

                                {/* Active status */}
                                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Status Aktif
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Satuan dapat digunakan pada produk.
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

                            {/* Footer */}
                            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={form.processing}
                                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing
                                        ? "Menyimpan..."
                                        : editingUnit
                                          ? "Simpan Perubahan"
                                          : "Simpan Satuan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDeleteCategory}
                title="Hapus Satuan?"
                description={
                    deletingUnit
                        ? `Apakah kamu yakin ingin menghapus satuan "${deletingUnit.name}"? Tindakan ini tidak dapat dibatalkan.`
                        : "Apakah kamu yakin ingin menghapus satuan ini?"
                }
                confirmText="Ya, Hapus"
                cancelText="Batal"
                loading={deleteProcessing}
                variant="destructive"
            />
        </DashboardLayout>
    );
}
