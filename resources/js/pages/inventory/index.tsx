import { useMemo, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import {
    ArrowDownToLine,
    ArrowLeftRight,
    ArrowUpFromLine,
    ClipboardList,
    Plus,
    Search,
    TriangleAlert,
} from "lucide-react";
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

type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "DAMAGE";

interface ProductOption {
    id: number;
    sku: string;
    name: string;
    stock: string | number;
}

interface SupplierOption {
    id: number;
    code: string;
    name: string;
}

interface Movement {
    id: number;
    product_id: number;
    supplier_id: number | null;
    user_id: number | null;
    movement_type: MovementType;
    quantity: string | number;
    reference_number: string | null;
    notes: string | null;
    created_at: string;
    product: {
        id: number;
        sku: string;
        name: string;
        stock: string | number;
    } | null;
    supplier: SupplierOption | null;
    user: {
        id: number;
        name: string;
    } | null;
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

interface InventoryPageProps {
    movements: PaginatedData<Movement>;
    products: ProductOption[];
    suppliers: SupplierOption[];
    filters: {
        search: string;
        movement_type: string | null;
        date_from: string;
        date_to: string;
        sort: string;
        direction: "asc" | "desc";
        per_page: number;
    };
}

const columnHelper = createColumnHelper<Movement>();

const movementLabels: Record<MovementType, string> = {
    IN: "Stok Masuk",
    OUT: "Stok Keluar",
    ADJUSTMENT: "Penyesuaian",
    DAMAGE: "Barang Rusak",
};

function formatNumber(value: string | number) {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(Number(value));
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function getMovementStyle(type: MovementType) {
    switch (type) {
        case "IN":
            return "bg-green-500/10 text-green-600";
        case "OUT":
            return "bg-blue-500/10 text-blue-600";
        case "DAMAGE":
            return "bg-red-500/10 text-red-600";
        default:
            return "bg-amber-500/10 text-amber-600";
    }
}

export default function InventoryIndex({
    movements,
    products,
    suppliers,
    filters,
}: InventoryPageProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [movementType, setMovementType] = useState(
        filters.movement_type ?? "",
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
    const [dateTo, setDateTo] = useState(filters.date_to ?? "");
    const [modalOpen, setModalOpen] = useState(false);

    const form = useForm({
        product_id: "",
        supplier_id: "",
        movement_type: "IN" as MovementType,
        quantity: "",
        reference_number: "",
        notes: "",
    });

    function applyFilters(overrides: Record<string, unknown> = {}) {
        router.get(
            "/inventory",
            {
                search,
                movement_type: movementType,
                date_from: dateFrom,
                date_to: dateTo,
                sort: filters.sort,
                direction: filters.direction,
                per_page: filters.per_page,
                ...overrides,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function handleSearch(value: string) {
        setSearch(value);
        router.get(
            "/inventory",
            {
                search: value,
                movement_type: movementType,
                date_from: dateFrom,
                date_to: dateTo,
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

    function submitMovement(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        form.post("/inventory", {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                form.reset();
                form.setData("movement_type", "IN");
            },
        });
    }

    const columns = useMemo<ColumnDef<Movement, any>[]>(
        () => [
            columnHelper.accessor("created_at", {
                header: "Tanggal",
                cell: ({ getValue }) => (
                    <span className="whitespace-nowrap text-sm">
                        {formatDate(getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor((row) => row.product?.name ?? "-", {
                id: "product",
                header: "Produk",
                cell: ({ row }) => (
                    <div className="min-w-40">
                        <p className="font-medium text-foreground">
                            {row.original.product?.name ?? "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.product?.sku ?? "-"}
                        </p>
                    </div>
                ),
            }),
            columnHelper.accessor("movement_type", {
                header: "Jenis",
                cell: ({ row }) => {
                    const type: MovementType = row.original.movement_type;

                    return (
                        <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getMovementStyle(type)}`}
                        >
                            {movementLabels[type]}
                        </span>
                    );
                },
            }),
            columnHelper.accessor("quantity", {
                header: "Perubahan",
                cell: ({ row }) => {
                    const quantity = Number(row.original.quantity);
                    const positive = quantity > 0;

                    return (
                        <span
                            className={`font-semibold tabular-nums ${
                                positive
                                    ? "text-green-600"
                                    : quantity < 0
                                      ? "text-red-600"
                                      : "text-muted-foreground"
                            }`}
                        >
                            {positive ? "+" : ""}
                            {formatNumber(quantity)}
                        </span>
                    );
                },
            }),
            columnHelper.accessor((row) => row.supplier?.name ?? "-", {
                id: "supplier",
                header: "Supplier",
            }),
            columnHelper.accessor("reference_number", {
                header: "Referensi",
                cell: ({ getValue }) => (
                    <span className="text-sm text-muted-foreground">
                        {getValue() || "-"}
                    </span>
                ),
            }),
            columnHelper.accessor((row) => row.user?.name ?? "-", {
                id: "user",
                header: "Petugas",
            }),
        ],
        [],
    );

    return (
        <>
            <Head title="Inventory" />

            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Inventory
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Kelola stok dan pantau seluruh pergerakan
                                barang.
                            </p>
                        </div>

                        <Button onClick={() => setModalOpen(true)}>
                            <Plus className="mr-2 size-4" />
                            Catat Pergerakan Stok
                        </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-green-500/10 p-2">
                                    <ArrowDownToLine className="size-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Jenis Transaksi
                                    </p>
                                    <p className="text-xl font-bold">
                                        {movements.total}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <ArrowLeftRight className="size-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Halaman Saat Ini
                                    </p>
                                    <p className="text-xl font-bold">
                                        {movements.current_page} /{" "}
                                        {movements.last_page}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-500/10 p-2">
                                    <ArrowUpFromLine className="size-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Data Ditampilkan
                                    </p>
                                    <p className="text-xl font-bold">
                                        {movements.data.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-amber-500/10 p-2">
                                    <ClipboardList className="size-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Data
                                    </p>
                                    <p className="text-xl font-bold">
                                        {movements.total}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) =>
                                        handleSearch(e.target.value)
                                    }
                                    placeholder="Cari produk atau referensi..."
                                    className="pl-9"
                                />
                            </div>

                            <select
                                value={movementType}
                                onChange={(e) => {
                                    setMovementType(e.target.value);
                                    applyFilters({
                                        movement_type: e.target.value,
                                        page: 1,
                                    });
                                }}
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">Semua jenis transaksi</option>
                                <option value="IN">Stok Masuk</option>
                                <option value="OUT">Stok Keluar</option>
                                <option value="ADJUSTMENT">Penyesuaian</option>
                                <option value="DAMAGE">Barang Rusak</option>
                            </select>

                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    applyFilters({
                                        date_from: e.target.value,
                                        page: 1,
                                    });
                                }}
                            />

                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    applyFilters({
                                        date_to: e.target.value,
                                        page: 1,
                                    });
                                }}
                            />
                        </div>

                        <DataTable
                            data={movements.data}
                            columns={columns}
                            pagination={movements}
                            search={search}
                            onSearchChange={handleSearch}
                            onPaginationChange={(pagination) =>
                                applyFilters({
                                    page: pagination.pageIndex + 1,
                                    per_page: pagination.pageSize,
                                })
                            }
                            onSortingChange={(sorting) => {
                                const first = sorting[0];

                                applyFilters({
                                    sort: first?.id ?? "created_at",
                                    direction: first?.desc ? "desc" : "asc",
                                    page: 1,
                                });
                            }}
                        />
                    </div>
                </div>

                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Catat Pergerakan Stok</DialogTitle>
                            <DialogDescription>
                                Catat transaksi stok masuk, keluar, penyesuaian,
                                atau barang rusak.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitMovement} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="movement_type">
                                    Jenis Transaksi
                                </Label>
                                <select
                                    id="movement_type"
                                    value={form.data.movement_type}
                                    onChange={(e) =>
                                        form.setData(
                                            "movement_type",
                                            e.target.value as MovementType,
                                        )
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="IN">Stok Masuk</option>
                                    <option value="OUT">Stok Keluar</option>
                                    <option value="ADJUSTMENT">
                                        Penyesuaian Stok
                                    </option>
                                    <option value="DAMAGE">Barang Rusak</option>
                                </select>
                                {form.errors.movement_type && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.movement_type}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="product_id">Produk</Label>
                                <select
                                    id="product_id"
                                    value={form.data.product_id}
                                    onChange={(e) =>
                                        form.setData(
                                            "product_id",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Pilih produk</option>
                                    {products.map((product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                        >
                                            {product.sku} - {product.name}{" "}
                                            (Stok: {formatNumber(product.stock)}
                                            )
                                        </option>
                                    ))}
                                </select>
                                {form.errors.product_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.product_id}
                                    </p>
                                )}
                            </div>

                            {form.data.movement_type === "IN" && (
                                <div className="space-y-2">
                                    <Label htmlFor="supplier_id">
                                        Supplier
                                    </Label>
                                    <select
                                        id="supplier_id"
                                        value={form.data.supplier_id}
                                        onChange={(e) =>
                                            form.setData(
                                                "supplier_id",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="">Pilih supplier</option>
                                        {suppliers.map((supplier) => (
                                            <option
                                                key={supplier.id}
                                                value={supplier.id}
                                            >
                                                {supplier.code} -{" "}
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.supplier_id && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.supplier_id}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="quantity">
                                    {form.data.movement_type === "ADJUSTMENT"
                                        ? "Perubahan Stok (+/-)"
                                        : "Jumlah"}
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    step="0.001"
                                    min={
                                        form.data.movement_type === "ADJUSTMENT"
                                            ? undefined
                                            : "0.001"
                                    }
                                    value={form.data.quantity}
                                    onChange={(e) =>
                                        form.setData("quantity", e.target.value)
                                    }
                                    placeholder={
                                        form.data.movement_type === "ADJUSTMENT"
                                            ? "Contoh: -2 atau 5"
                                            : "Masukkan jumlah"
                                    }
                                    required
                                />
                                {form.data.movement_type === "ADJUSTMENT" && (
                                    <p className="text-xs text-muted-foreground">
                                        Gunakan angka positif untuk menambah
                                        stok dan negatif untuk mengurangi stok.
                                    </p>
                                )}
                                {form.errors.quantity && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.quantity}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reference_number">
                                    Nomor Referensi
                                </Label>
                                <Input
                                    id="reference_number"
                                    value={form.data.reference_number}
                                    onChange={(e) =>
                                        form.setData(
                                            "reference_number",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: INV/2026/001"
                                />
                                {form.errors.reference_number && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.reference_number}
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
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Catatan tambahan..."
                                />
                                {form.errors.notes && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.notes}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
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
                                        : "Simpan Transaksi"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </>
    );
}
