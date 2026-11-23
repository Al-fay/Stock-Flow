import { useEffect, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import type {
    ColumnDef,
    PaginationState,
    SortingState,
} from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";

import DashboardLayout from "@/layouts/dashboard-layout";
import { DataTable } from "@/components/master-data/data-table";
import { Switch } from "@/components/ui/switch";

interface Customer {
    id: number;
    code: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
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
}

interface CustomerPageProps {
    customers: PaginatedData<Customer>;
    filters: {
        search: string;
        sort: string;
        direction: "asc" | "desc";
        per_page: number;
    };
}

interface CustomerForm {
    code: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    is_active: boolean;
}

const initialForm: CustomerForm = {
    code: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    is_active: true,
};

export default function CustomersIndex({
    customers,
    filters,
}: CustomerPageProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
        null,
    );

    const form = useForm<CustomerForm>(initialForm);

    // Debounced server-side search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (search !== filters.search) {
                router.get(
                    "/master-data/customers",
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
        setEditingCustomer(null);
        form.reset();
        form.clearErrors();
        form.setData(initialForm);
        setModalOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        form.clearErrors();

        form.setData({
            code: customer.code,
            name: customer.name,
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            address: customer.address ?? "",
            notes: customer.notes ?? "",
            is_active: customer.is_active,
        });

        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingCustomer(null);
        form.reset();
        form.clearErrors();
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        };

        if (editingCustomer) {
            form.put(`/master-data/customers/${editingCustomer.id}`, options);
        } else {
            form.post("/master-data/customers", options);
        }
    };

    const deleteCustomer = (customer: Customer) => {
        const confirmed = window.confirm(
            `Yakin ingin menghapus pelanggan "${customer.name}"?`,
        );

        if (!confirmed) return;

        router.delete(`/master-data/customers/${customer.id}`, {
            preserveScroll: true,
        });
    };

    const handlePaginationChange = (pagination: PaginationState) => {
        router.get(
            "/master-data/customers",
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
            "/master-data/customers",
            {
                search: search || undefined,
                sort: currentSort?.id ?? "created_at",
                direction: currentSort?.desc ? "desc" : "asc",
                per_page: filters.per_page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const columns: ColumnDef<Customer>[] = [
        {
            accessorKey: "code",
            header: "Kode",
            enableSorting: true,
        },
        {
            accessorKey: "name",
            header: "Nama Pelanggan",
            enableSorting: true,
            cell: ({ row }) => (
                <div className="min-w-[160px]">
                    <p className="font-medium text-foreground">
                        {row.original.name}
                    </p>
                    {row.original.email && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.email}
                        </p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "phone",
            header: "Telepon",
            enableSorting: false,
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.phone || "-"}
                </span>
            ),
        },
        {
            accessorKey: "address",
            header: "Alamat",
            enableSorting: false,
            cell: ({ row }) => (
                <span className="line-clamp-2 max-w-[220px] text-muted-foreground">
                    {row.original.address || "-"}
                </span>
            ),
        },
        {
            accessorKey: "is_active",
            header: "Status",
            enableSorting: false,
            cell: ({ row }) => (
                <span
                    className={
                        row.original.is_active
                            ? "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                            : "inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    }
                >
                    {row.original.is_active ? "Aktif" : "Nonaktif"}
                </span>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Tanggal Dibuat",
            enableSorting: true,
            cell: ({ row }) =>
                new Date(row.original.created_at).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }),
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
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Edit pelanggan"
                    >
                        <Pencil className="size-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => deleteCustomer(row.original)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        title="Hapus pelanggan"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Customers" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Customers
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Kelola data pelanggan dan informasi kontak.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                    >
                        <Plus className="size-4" />
                        Tambah Pelanggan
                    </button>
                </div>

                {/* Data Table */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                    <DataTable
                        data={customers.data}
                        columns={columns}
                        pagination={customers}
                        search={search}
                        onSearchChange={setSearch}
                        onPaginationChange={handlePaginationChange}
                        onSortingChange={handleSortingChange}
                    />
                </div>
            </div>

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {editingCustomer
                                        ? "Edit Pelanggan"
                                        : "Tambah Pelanggan"}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Lengkapi informasi pelanggan.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label="Tutup modal"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-5 p-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    label="Kode Pelanggan"
                                    error={form.errors.code}
                                >
                                    <input
                                        value={form.data.code}
                                        onChange={(e) =>
                                            form.setData("code", e.target.value)
                                        }
                                        placeholder="CUS-001"
                                        className="form-input"
                                    />
                                </FormField>

                                <FormField
                                    label="Nama Pelanggan"
                                    error={form.errors.name}
                                >
                                    <input
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData("name", e.target.value)
                                        }
                                        placeholder="Nama pelanggan"
                                        className="form-input"
                                    />
                                </FormField>

                                <FormField
                                    label="Email"
                                    error={form.errors.email}
                                >
                                    <input
                                        type="email"
                                        value={form.data.email}
                                        onChange={(e) =>
                                            form.setData(
                                                "email",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="pelanggan@email.com"
                                        className="form-input"
                                    />
                                </FormField>

                                <FormField
                                    label="Nomor Telepon"
                                    error={form.errors.phone}
                                >
                                    <input
                                        value={form.data.phone}
                                        onChange={(e) =>
                                            form.setData(
                                                "phone",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="08xxxxxxxxxx"
                                        className="form-input"
                                    />
                                </FormField>
                            </div>

                            <FormField
                                label="Alamat"
                                error={form.errors.address}
                            >
                                <textarea
                                    rows={3}
                                    value={form.data.address}
                                    onChange={(e) =>
                                        form.setData("address", e.target.value)
                                    }
                                    placeholder="Alamat lengkap pelanggan"
                                    className="form-input resize-y"
                                />
                            </FormField>

                            <FormField
                                label="Catatan"
                                error={form.errors.notes}
                            >
                                <textarea
                                    rows={3}
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData("notes", e.target.value)
                                    }
                                    placeholder="Catatan tambahan (opsional)"
                                    className="form-input resize-y"
                                />
                            </FormField>

                            <div className="flex items-center justify-between rounded-xl border border-border p-4">
                                <div>
                                    <p className="text-sm font-medium">
                                        Status Pelanggan
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Aktifkan jika pelanggan masih digunakan.
                                    </p>
                                </div>

                                <Switch
                                    checked={form.data.is_active}
                                    onCheckedChange={(checked) =>
                                        form.setData("is_active", checked)
                                    }
                                />
                            </div>

                            <div className="flex justify-end gap-3 border-t border-border pt-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
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
                                        : editingCustomer
                                          ? "Simpan Perubahan"
                                          : "Simpan Pelanggan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function FormField({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
                {label}
            </label>

            {children}

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
