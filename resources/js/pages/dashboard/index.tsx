import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    ShoppingCart,
    Wallet,
    AlertTriangle,
    ArrowUpRight,
    MoreHorizontal,
    LogOut,
} from "lucide-react";

import { Head, router, usePage } from "@inertiajs/react";

interface SharedProps {
    [key: string]: unknown;

    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
}

const stats = [
    {
        title: "Total Products",
        value: "1,284",
        change: "+12.5%",
        icon: Package,
    },
    {
        title: "Total Sales",
        value: "Rp 48.5M",
        change: "+8.2%",
        icon: ShoppingCart,
    },
    {
        title: "Revenue",
        value: "Rp 12.8M",
        change: "+15.3%",
        icon: Wallet,
    },
    {
        title: "Low Stock",
        value: "18",
        change: "Needs attention",
        icon: AlertTriangle,
    },
];

const products = [
    {
        name: "MacBook Pro M4",
        sku: "PRD-001",
        category: "Electronics",
        stock: 24,
        price: "Rp 25.000.000",
        status: "In Stock",
    },
    {
        name: "Logitech MX Master",
        sku: "PRD-002",
        category: "Accessories",
        stock: 8,
        price: "Rp 1.500.000",
        status: "Low Stock",
    },
    {
        name: "Samsung Monitor",
        sku: "PRD-003",
        category: "Electronics",
        stock: 42,
        price: "Rp 4.500.000",
        status: "In Stock",
    },
    {
        name: "Mechanical Keyboard",
        sku: "PRD-004",
        category: "Accessories",
        stock: 3,
        price: "Rp 850.000",
        status: "Low Stock",
    },
];

const sales = [
    { day: "Mon", value: 45 },
    { day: "Tue", value: 70 },
    { day: "Wed", value: 55 },
    { day: "Thu", value: 90 },
    { day: "Fri", value: 65 },
    { day: "Sat", value: 100 },
    { day: "Sun", value: 80 },
];

const inventorySummary = [
    {
        name: "In Stock",
        value: 75,
        color: "bg-emerald-500",
    },
    {
        name: "Low Stock",
        value: 18,
        color: "bg-amber-500",
    },
    {
        name: "Out of Stock",
        value: 7,
        color: "bg-red-500",
    },
];

export default function Dashboard() {
    const { auth } = usePage<SharedProps>().props;

    const handleLogout = () => {
        router.post("/logout");
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
                            <Button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                                + Add Product
                            </Button>
                        </div>
                    </div>

                    {/* STATISTICS */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {stats.map((stat) => {
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

                                        <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                                            {stat.title !== "Low Stock" && (
                                                <ArrowUpRight className="size-4" />
                                            )}

                                            {stat.change}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* ANALYTICS */}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-7">
                        {/* SALES OVERVIEW */}
                        <Card className="xl:col-span-4">
                            <CardHeader>
                                <CardTitle>Sales Overview</CardTitle>

                                <p className="text-sm text-muted-foreground">
                                    Weekly sales performance
                                </p>
                            </CardHeader>

                            <CardContent>
                                <div className="flex h-64 items-end justify-around gap-4 border-b pb-2">
                                    {sales.map((item) => (
                                        <div
                                            key={item.day}
                                            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                                        >
                                            <div
                                                className="w-full max-w-12 rounded-t-md bg-primary transition-all hover:opacity-70"
                                                style={{
                                                    height: `${item.value}%`,
                                                }}
                                                title={`${item.value}%`}
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
                                className="text-sm font-medium text-primary hover:underline"
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

                                            <th className="p-3">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {products.map((product) => (
                                            <tr
                                                key={product.sku}
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
                                                    {product.stock}
                                                </td>

                                                <td className="p-3">
                                                    {product.price}
                                                </td>

                                                <td className="p-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            product.status ===
                                                            "In Stock"
                                                                ? "border-emerald-500/30 text-emerald-600"
                                                                : "border-amber-500/30 text-amber-600"
                                                        }
                                                    >
                                                        {product.status}
                                                    </Badge>
                                                </td>

                                                <td className="p-3">
                                                    <button
                                                        type="button"
                                                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                        aria-label={`More actions for ${product.name}`}
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </>
    );
}
