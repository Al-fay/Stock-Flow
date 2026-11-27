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
    ChevronDown,
    UserRound,
    HelpCircle,
    ArrowLeftRight,
    Info,
    Check,
    Ruler,
    ClipboardCheck,
    ArrowDownUp,
    House,
    ArrowUpFromLine,
    RotateCcw,
    ArrowDownFromLine,
    ChartNoAxesCombined,
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

import { Toaster } from "@/components/ui/sonner";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { SharedPropsUser } from "@/types/user";
import NotificationDropdown from "@/components/my-components/notification-dropdown";

type Theme = "light" | "dark" | "system";

const navigation = [
    {
        title: "Overview",
        items: [
            {
                label: "Dashboard",
                href: "/dashboard",
                icon: House,
            },
        ],
    },
    {
        title: "Inventory",
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
                label: "Stock Opname",
                href: "/inventory/opname",
                icon: ClipboardCheck,
            },
            {
                label: "Stock Movement",
                href: "/inventory/movements",
                icon: ArrowDownUp,
            },
            {
                label: "Stock In",
                href: "/inventory/stock-in",
                icon: ArrowDownFromLine,
            },
            {
                label: "Stock Out",
                href: "/inventory/stock-out",
                icon: ArrowUpFromLine,
            },
            {
                label: "Stock Return",
                href: "/inventory/stock-return",
                icon: RotateCcw,
            },
            {
                label: "Inventory Reports",
                href: "/inventory/reports",
                icon: ChartNoAxesCombined,
            },
        ],
    },
    {
        title: "Master Data",
        items: [
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
            {
                label: "Units",
                href: "/master-data/units",
                icon: Ruler,
            },
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
        items: [
            {
                label: "Reports",
                href: "/reports",
                icon: BarChart3,
            },
        ],
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAutoRefresh();

    const { url } = usePage();
    const { auth } = usePage<SharedPropsUser>().props;

    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const [theme, setTheme] = useState<Theme>("system");
    const [mounted, setMounted] = useState(false);

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        Overview: true,
        Inventory: true,
        "Master Data": false,
        System: false,
    });

    // =========================================================
    // ACTIVE MENU
    // =========================================================

    const isActiveMenu = (href: string) => {
        if (href === "/") {
            return url === "/";
        }

        // Exact match untuk halaman Inventory
        if (href === "/inventory") {
            return url === "/inventory";
        }

        return url === href || url.startsWith(`${href}/`);
    };

    // =========================================================
    // DROPDOWN GROUP
    // =========================================================

    const toggleGroup = (title: string) => {
        setOpenGroups((prev) => ({
            ...prev,
            [title]: !prev[title],
        }));
    };

    // Automatically open active group
    useEffect(() => {
        const activeGroup = navigation.find((group) =>
            group.items.some((item) => isActiveMenu(item.href)),
        );

        if (activeGroup) {
            setOpenGroups((prev) => ({
                ...prev,
                [activeGroup.title]: true,
            }));
        }
    }, [url]);

    // =========================================================
    // USER INITIAL
    // =========================================================

    const initial =
        auth.user?.name
            ?.split(" ")
            .map((word) => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase() ?? "US";

    // =========================================================
    // INITIALIZE THEME
    // =========================================================

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

    // =========================================================
    // APPLY THEME
    // =========================================================

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

    // =========================================================
    // CLOSE MOBILE SIDEBAR AFTER NAVIGATION
    // =========================================================

    useEffect(() => {
        setMobileOpen(false);
    }, [url]);

    // =========================================================
    // PREVENT BACKGROUND SCROLL ON MOBILE
    // =========================================================

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    // =========================================================
    // THEME
    // =========================================================

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

    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = () => {
        router.post("/logout");
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* ================================================= */}
            {/* MOBILE OVERLAY                                     */}
            {/* ================================================= */}

            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                />
            )}

            {/* ================================================= */}
            {/* SIDEBAR                                            */}
            {/* ================================================= */}

            <aside
                className={`
                    fixed inset-y-0 left-0 z-50
                    flex flex-col
                    border-r border-sidebar-border
                    bg-sidebar text-sidebar-foreground
                    transition-all duration-300 ease-in-out
                    w-72
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0
                    ${desktopCollapsed ? "md:w-20" : "md:w-64"}
                `}
            >
                {/* LOGO */}
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center">
                            <img
                                src="/warehouse.svg"
                                alt="Inventory logo"
                                className="size-9"
                            />
                        </div>

                        {(!desktopCollapsed || mobileOpen) && (
                            <div className="min-w-0">
                                <h2 className="truncate font-bold tracking-tight">
                                    Stock-Flow
                                </h2>

                                <p className="text-xs text-muted-foreground">
                                    Inventory Management
                                </p>
                            </div>
                        )}
                    </div>

                    {/* MOBILE CLOSE */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg p-2 hover:bg-sidebar-accent md:hidden"
                        aria-label="Close sidebar"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* ================================================= */}
                {/* NAVIGATION DROPDOWN                                 */}
                {/* ================================================= */}

                <nav className="flex-1 space-y-3 overflow-y-auto p-3">
                    {navigation.map((group) => {
                        const isOpen = openGroups[group.title] ?? false;

                        const hasActiveItem = group.items.some((item) =>
                            isActiveMenu(item.href),
                        );

                        const collapsed = desktopCollapsed && !mobileOpen;

                        return (
                            <div key={group.title}>
                                {/* GROUP HEADER */}
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.title)}
                                    className={`
                                        flex w-full items-center
                                        rounded-lg px-3 py-2
                                        text-[11px] font-semibold
                                        uppercase tracking-widest
                                        transition-colors
                                        ${
                                            hasActiveItem
                                                ? "text-primary"
                                                : "text-muted-foreground"
                                        }
                                        hover:bg-sidebar-accent
                                        hover:text-sidebar-accent-foreground
                                        ${
                                            collapsed
                                                ? "md:justify-center md:px-2"
                                                : "justify-between"
                                        }
                                    `}
                                    title={collapsed ? group.title : undefined}
                                >
                                    {!collapsed && <span>{group.title}</span>}

                                    <ChevronDown
                                        className={`
                                            size-4 shrink-0
                                            transition-transform duration-200
                                            ${
                                                isOpen
                                                    ? "rotate-180"
                                                    : "rotate-0"
                                            }
                                            ${collapsed ? "hidden" : ""}
                                        `}
                                    />
                                </button>

                                {/* GROUP ITEMS */}
                                <div
                                    className={`
                                        grid transition-all duration-300
                                        ${
                                            isOpen || collapsed
                                                ? "grid-rows-[1fr] opacity-100"
                                                : "grid-rows-[0fr] opacity-0"
                                        }
                                    `}
                                >
                                    <div className="overflow-hidden">
                                        <div
                                            className={`
                                                mt-1 space-y-1
                                                ${collapsed ? "" : "pl-1"}
                                            `}
                                        >
                                            {group.items.map((item) => {
                                                const Icon = item.icon;

                                                const active = isActiveMenu(
                                                    item.href,
                                                );

                                                return (
                                                    <Link
                                                        key={item.label}
                                                        href={item.href}
                                                        title={
                                                            collapsed
                                                                ? item.label
                                                                : undefined
                                                        }
                                                        className={`
                                                                flex items-center gap-3
                                                                rounded-xl px-3 py-2.5
                                                                text-sm font-medium
                                                                transition-all duration-200
                                                                ${
                                                                    collapsed
                                                                        ? "md:justify-center md:px-2"
                                                                        : ""
                                                                }
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
                                                            <span className="truncate">
                                                                {item.label}
                                                            </span>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* ================================================= */}
                {/* USER PROFILE DROPDOWN                              */}
                {/* ================================================= */}

                <div className="shrink-0 border-t border-sidebar-border p-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="
                                flex w-full items-center gap-3
                                rounded-xl p-2 text-left
                                outline-none transition-colors
                                hover:bg-sidebar-accent
                                focus-visible:ring-2
                                focus-visible:ring-sidebar-ring
                            "
                        >
                            {/* AVATAR */}
                            <div
                                className="
                                    flex size-10 shrink-0
                                    items-center justify-center
                                    rounded-full bg-primary/10
                                    text-sm font-bold text-primary
                                "
                            >
                                {initial}
                            </div>

                            {(!desktopCollapsed || mobileOpen) && (
                                <>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {auth.user?.name ?? "Username"}
                                        </p>

                                        <p className="truncate text-xs text-muted-foreground">
                                            {auth.user?.email ?? "Email user"}
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
                            {/* ACCOUNT INFORMATION */}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                    <div className="flex items-center gap-3 py-1">
                                        <div
                                            className="
                                                flex size-10
                                                items-center justify-center
                                                rounded-full bg-primary/10
                                                font-bold text-primary
                                            "
                                        >
                                            {initial}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {auth.user?.name}
                                            </p>

                                            <p className="truncate text-xs text-muted-foreground">
                                                {auth.user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            {/* PROFILE */}
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    onClick={() => router.visit("/profile")}
                                >
                                    <UserRound className="mr-2 size-4" />
                                    My Profile
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            {/* APPEARANCE */}
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

                            {/* SUPPORT */}
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    onClick={() => router.visit("/help")}
                                >
                                    <HelpCircle className="mr-2 size-4" />
                                    Help & Support
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            {/* LOGOUT */}
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Log Out
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* ================================================= */}
            {/* MAIN CONTENT                                        */}
            {/* ================================================= */}

            <div
                className={`
                    min-h-screen transition-[margin] duration-300
                    ${desktopCollapsed ? "md:ml-20" : "md:ml-64"}
                `}
            >
                {/* HEADER */}
                <header
                    className="
                        sticky top-0 z-30
                        flex h-16 items-center justify-between
                        border-b bg-background/85
                        px-4 backdrop-blur-xl
                        sm:px-6
                    "
                >
                    <div className="flex items-center gap-3">
                        {/* MOBILE MENU */}
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="
                                rounded-lg p-2
                                transition-colors
                                hover:bg-muted md:hidden
                            "
                            aria-label="Open sidebar"
                        >
                            <Menu className="size-5" />
                        </button>

                        {/* DESKTOP COLLAPSE */}
                        <button
                            type="button"
                            onClick={() =>
                                setDesktopCollapsed(!desktopCollapsed)
                            }
                            className="
                                hidden rounded-lg p-2
                                hover:bg-sidebar-accent md:block
                            "
                            aria-label="Toggle sidebar"
                        >
                            <ChevronLeft
                                className={`
                                    size-4 transition-transform
                                    ${desktopCollapsed ? "rotate-180" : ""}
                                `}
                            />
                        </button>

                        {/* SEARCH DESKTOP */}
                        {/* Uncomment jika search sudah difungsikan */}

                        {/* 
                        <div className="hidden items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 sm:flex">
                            <Search className="size-4 text-muted-foreground" />

                            <input
                                placeholder="Search anything..."
                                className="w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground lg:w-52"
                            />

                            <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline-block">
                                Ctrl K
                            </kbd>
                        </div>
                        */}
                    </div>

                    {/* HEADER ACTIONS */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* MOBILE SEARCH */}
                        <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-muted sm:hidden"
                            aria-label="Search"
                        >
                            <Search className="size-5" />
                        </button>

                        {/* THEME TOGGLE */}
                        <button
                            type="button"
                            onClick={cycleTheme}
                            title={`Theme: ${theme}`}
                            aria-label={`Change theme, currently ${theme}`}
                            className="
                                flex size-9 items-center justify-center
                                rounded-xl border transition-colors
                                hover:bg-muted
                            "
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

                        {/* NOTIFICATIONS */}
                        <div className="relative">
                            <NotificationDropdown />
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>

            {/* TOASTER */}
            <Toaster position="top-right" richColors closeButton />
        </div>
    );
}
