import { useEffect, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    Package,
    Tags,
    Truck,
    Warehouse,
    ShoppingCart,
    BarChart3,
    Search,
    Bell,
    Menu,
    X,
    Sun,
    Moon,
    ChevronLeft,
    LogOut,
    Monitor,
    ChevronUp,
    UserRound,
    HelpCircle,
    ArrowLeftRight,
    Info,
    Check,
    Ruler,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";

const navigation = [
    {
        title: "Overview",
        items: [
            {
                label: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
            },
        ],
    },
    {
        title: "Management",
        items: [
            {
                label: "Stock Overview",
                href: "/inventory/overview",
                icon: LayoutDashboard,
            },
            {
                label: "Inventory",
                href: "/inventory",
                icon: ArrowLeftRight,
            },
            {
                label: "Products",
                href: "/master-data/products",
                icon: Package,
            },
            {
                label: "Categories",
                href: "/master-data/categories",
                icon: Tags,
            },
            { label: "Units", href: "/master-data/units", icon: Ruler },
            {
                label: "Suppliers",
                href: "/master-data/suppliers",
                icon: Truck,
            },
            {
                label: "Warehouses",
                href: "/master-data/warehouses",
                icon: Warehouse,
            },
            {
                label: "Customers",
                href: "/master-data/customers",
                icon: ShoppingCart,
            },
        ],
    },
    {
        title: "System",
        items: [{ label: "Reports", href: "/reports", icon: BarChart3 }],
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { url } = usePage();

    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>("system");
    const [mounted, setMounted] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Initialize saved theme
    useEffect(() => {
        const savedTheme = localStorage.getItem(
            "inventory-theme",
        ) as Theme | null;

        const initialTheme =
            savedTheme === "light" ||
            savedTheme === "dark" ||
            savedTheme === "system"
                ? savedTheme
                : "system";

        setTheme(initialTheme);
        setMounted(true);
    }, []);

    // Apply theme
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;

        const applyTheme = () => {
            const isDark =
                theme === "dark" ||
                (theme === "system" &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches);

            root.classList.toggle("dark", isDark);
            root.style.colorScheme = isDark ? "dark" : "light";
        };

        applyTheme();

        localStorage.setItem("inventory-theme", theme);

        const media = window.matchMedia("(prefers-color-scheme: dark)");

        if (theme === "system") {
            media.addEventListener("change", applyTheme);
        }

        return () => {
            media.removeEventListener("change", applyTheme);
        };
    }, [theme, mounted]);

    // Close mobile sidebar on navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [url]);

    // Prevent background scrolling when mobile sidebar is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    const cycleTheme = () => {
        setTheme((current) => {
            if (current === "light") return "dark";
            if (current === "dark") return "system";
            return "light";
        });
    };

    const isDark = mounted
        ? theme === "dark" ||
          (theme === "system" &&
              window.matchMedia("(prefers-color-scheme: dark)").matches)
        : false;

    const handleLogout = () => {
        router.post("/logout");
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Mobile overlay */}
            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 flex flex-col
                    border-r border-sidebar-border bg-sidebar
                    text-sidebar-foreground
                    transition-all duration-300 ease-in-out
                    w-72
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0
                    ${desktopCollapsed ? "md:w-20" : "md:w-64"}
                `}
            >
                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-sm">
                            I
                        </div>

                        {(!desktopCollapsed || mobileOpen) && (
                            <div className="min-w-0">
                                <h2 className="truncate font-bold tracking-tight">
                                    Inventory
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Management System
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Close mobile */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg p-2 hover:bg-sidebar-accent md:hidden"
                        aria-label="Close sidebar"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-6 overflow-y-auto p-4">
                    {navigation.map((group) => (
                        <div key={group.title}>
                            {(!desktopCollapsed || mobileOpen) && (
                                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    {group.title}
                                </p>
                            )}

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active =
                                        item.href === "/"
                                            ? url === "/"
                                            : url === item.href ||
                                              url.startsWith(item.href + "/");

                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            title={
                                                desktopCollapsed && !mobileOpen
                                                    ? item.label
                                                    : undefined
                                            }
                                            className={`
                                                flex items-center gap-3 rounded-xl
                                                px-3 py-2.5 text-sm font-medium
                                                transition-all duration-200
                                                ${
                                                    active
                                                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                }
                                            `}
                                        >
                                            <Icon className="size-[18px] shrink-0" />

                                            {(!desktopCollapsed ||
                                                mobileOpen) && (
                                                <span>{item.label}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Profile Dropdown */}
                <div className="shrink-0 border-t border-sidebar-border p-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                            {/* Avatar */}
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                AD
                            </div>

                            {(!desktopCollapsed || mobileOpen) && (
                                <>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            Administrator
                                        </p>

                                        <p className="truncate text-xs text-muted-foreground">
                                            admin@example.com
                                        </p>
                                    </div>

                                    <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                                </>
                            )}
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            side="top"
                            align="end"
                            sideOffset={8}
                            className="w-64"
                        >
                            {/* Account Information */}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                    <div className="flex items-center gap-3 py-1">
                                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                            AD
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                Administrator
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                admin@example.com
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            {/* Account Menu */}
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    onClick={() => router.visit("/profile")}
                                >
                                    <UserRound className="mr-2 size-4" />
                                    My Profile
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            {/* Appearance */}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                    Appearance
                                </DropdownMenuLabel>

                                <DropdownMenuItem onClick={cycleTheme}>
                                    {theme === "light" ? (
                                        <Sun className="mr-2 size-4" />
                                    ) : theme === "dark" ? (
                                        <Moon className="mr-2 size-4" />
                                    ) : (
                                        <Monitor className="mr-2 size-4" />
                                    )}
                                    Theme:{" "}
                                    {theme.charAt(0).toUpperCase() +
                                        theme.slice(1)}
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            {/* Support */}
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    onClick={() => router.visit("/help")}
                                >
                                    <HelpCircle className="mr-2 size-4" />
                                    Help & Support
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            {/* Logout */}
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => handleLogout()}
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Log Out
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main content */}
            <div
                className={`
                    min-h-screen transition-[margin] duration-300
                    ${desktopCollapsed ? "md:ml-20" : "md:ml-64"}
                `}
            >
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl sm:px-6">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="rounded-lg p-2 transition-colors hover:bg-muted md:hidden"
                            aria-label="Open sidebar"
                        >
                            <Menu className="size-5" />
                        </button>

                        {/* Collapse desktop */}
                        <button
                            onClick={() =>
                                setDesktopCollapsed(!desktopCollapsed)
                            }
                            className="hidden rounded-lg p-2 hover:bg-sidebar-accent md:block"
                            aria-label="Toggle sidebar"
                        >
                            <ChevronLeft
                                className={`size-4 transition-transform ${
                                    desktopCollapsed ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {/* <div className="hidden items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 sm:flex">
                            <Search className="size-4 text-muted-foreground" />

                            <input
                                placeholder="Search anything..."
                                className="w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground lg:w-52"
                            />

                            <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline-block">
                                Ctrl K
                            </kbd>
                        </div> */}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Mobile search */}
                        <button
                            className="rounded-lg p-2 hover:bg-muted sm:hidden"
                            aria-label="Search"
                        >
                            <Search className="size-5" />
                        </button>

                        {/* Theme toggle */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={cycleTheme}
                                title={`Theme: ${theme}`}
                                aria-label={`Change theme, currently ${theme}`}
                                className="flex size-9 items-center justify-center rounded-xl border transition-colors hover:bg-muted"
                            >
                                {!mounted ? (
                                    <Monitor className="size-4" />
                                ) : theme === "system" ? (
                                    <Monitor className="size-4" />
                                ) : isDark ? (
                                    <Moon className="size-4" />
                                ) : (
                                    <Sun className="size-4" />
                                )}
                            </button>
                        </div>

                        {/* Notifications */}
                        <button
                            onClick={() =>
                                setShowNotifications(!showNotifications)
                            }
                            className="relative flex size-9 items-center justify-center rounded-xl border transition-colors hover:bg-muted"
                            aria-label="Notifications"
                        >
                            <Bell className="size-4" />
                            <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-background bg-red-500" />
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border bg-background shadow-xl">
                                <div className="flex items-center justify-between border-b p-4">
                                    <h3 className="font-semibold">
                                        Notifikasi
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        2 baru
                                    </span>
                                </div>

                                <div className="divide-y">
                                    <div className="flex gap-3 p-4 hover:bg-muted/50">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                            <Info size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                Informasi terbaru
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Ada informasi baru untuk kamu.
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                                Baru saja
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 p-4 hover:bg-muted/50">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                            <Check size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                Berhasil disimpan
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Data berhasil diperbarui.
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                                5 menit lalu
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowNotifications(false)}
                                    className="w-full border-t p-3 text-center text-sm font-medium hover:bg-muted"
                                >
                                    Tutup notifikasi
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page */}
                <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
