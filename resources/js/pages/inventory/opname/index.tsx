import { Head, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck, Eye, Plus, Search } from "lucide-react";

import { DataTable } from "@/components/master-data/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/layouts/dashboard-layout";
import { toast } from "sonner";

interface Opname {
    id: number;
    code: string;
    opname_date: string;
    status: "DRAFT" | "POSTED";
    notes: string | null;
    items_count: number;
    created_at: string;
    creator: {
        id: number;
        name: string;
    } | null;
}

interface PaginationData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Props {
    opnames: PaginationData<Opname>;
}

const formatDate = (date: string) =>
    new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
    }).format(new Date(date));

export default function StockOpnameIndex({ opnames }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const form = useForm({
        opname_date: new Date().toISOString().slice(0, 10),
        notes: "",
    });

    const columns = useMemo<ColumnDef<Opname, any>[]>(
        () => [
            {
                accessorKey: "code",
                header: "Nomor Opname",
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.code}</span>
                ),
            },
            {
                accessorKey: "opname_date",
                header: "Tanggal",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDate(row.original.opname_date)}
                    </span>
                ),
            },
            {
                accessorKey: "items_count",
                header: "Jumlah Produk",
                cell: ({ row }) => (
                    <span>{row.original.items_count} produk</span>
                ),
            },
            {
                accessorKey: "creator.name",
                header: "Dibuat Oleh",
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.creator?.name ?? "-"}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => {
                    const status = row.original.status;

                    return (
                        <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                status === "POSTED"
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-amber-500/10 text-amber-600"
                            }`}
                        >
                            {status === "POSTED" ? "Posted" : "Draft"}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: "Aksi",
                cell: ({ row }) => (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            router.visit(`/inventory/opname/${row.original.id}`)
                        }
                    >
                        <Eye className="mr-2 size-4" />
                        Detail
                    </Button>
                ),
            },
        ],
        [],
    );

    function handleSearch(value: string) {
        setSearch(value);

        router.get(
            "/inventory/opname",
            { search: value },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function submit() {
        form.post("/inventory/opname", {
            preserveScroll: true,

            onSuccess: () => {
                toast.success("Berhasil ditambahkan", {
                    description: "Stock opname berhasil dibuat.",
                });

                setModalOpen(false);
                form.reset();
                form.clearErrors();
            },

            onError: () => {
                toast.error("Gagal menyimpan", {
                    description:
                        "Periksa kembali data stock opname yang kamu masukkan.",
                });
            },
        });
    }

    return (
        <>
            <Head title="Stock Opname" />

            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Stock Opname
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Pencocokan stok fisik dengan stok sistem.
                            </p>
                        </div>

                        <Button onClick={() => setModalOpen(true)}>
                            <Plus className="mr-2 size-4" />
                            Buat Stock Opname
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Total Sesi
                            </p>
                            <p className="mt-2 text-2xl font-bold">
                                {opnames.total}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Draft
                            </p>
                            <p className="mt-2 text-2xl font-bold">
                                {
                                    opnames.data.filter(
                                        (item) => item.status === "DRAFT",
                                    ).length
                                }
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Posted
                            </p>
                            <p className="mt-2 text-2xl font-bold">
                                {
                                    opnames.data.filter(
                                        (item) => item.status === "POSTED",
                                    ).length
                                }
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                        <DataTable
                            data={opnames.data}
                            columns={columns}
                            pagination={opnames}
                            search={search}
                            onSearchChange={handleSearch}
                            onPaginationChange={(pagination) =>
                                router.get(
                                    "/inventory/opname",
                                    {
                                        search,
                                        page: pagination.pageIndex + 1,
                                        per_page: pagination.pageSize,
                                    },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                )
                            }
                            onSortingChange={() => {}}
                        />
                    </div>
                </div>

                <Dialog
                    open={modalOpen}
                    onOpenChange={(open) => {
                        if (!form.processing) {
                            setModalOpen(open);
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Buat Stock Opname</DialogTitle>
                            <DialogDescription>
                                Membuat sesi pemeriksaan stok seluruh produk
                                aktif.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submit();
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="opname_date">
                                    Tanggal Stock Opname
                                </Label>
                                <Input
                                    id="opname_date"
                                    type="date"
                                    value={form.data.opname_date}
                                    onChange={(e) =>
                                        form.setData(
                                            "opname_date",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {form.errors.opname_date && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.opname_date}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <textarea
                                    id="notes"
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData("notes", e.target.value)
                                    }
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Contoh: Opname gudang utama..."
                                />
                            </div>

                            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                                <ClipboardCheck className="mb-2 size-4" />
                                Sistem akan membuat snapshot stok awal dari
                                semua produk aktif. Jumlah produk akan disiapkan
                                otomatis.
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Batal
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {form.processing
                                        ? "Menyimpan..."
                                        : "Buat Stock Opname"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </>
    );
}
