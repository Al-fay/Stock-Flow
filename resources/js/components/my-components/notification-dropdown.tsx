import { useCallback, useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Package,
    AlertTriangle,
    ArrowDownToLine,
    ArrowUpFromLine,
    RotateCcw,
    ClipboardCheck,
    Info,
    X,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

type NotificationType = "success" | "info" | "warning" | "danger" | "error";

interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    icon?: string;
    action_url?: string | null;
    reference_id?: number | string | null;
    reference_type?: string | null;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
}

interface NotificationResponse {
    notifications: AppNotification[];
    unread_count: number;
}

const iconMap: Record<string, typeof Bell> = {
    bell: Bell,
    info: Info,
    package: Package,
    alert: AlertTriangle,
    "alert-triangle": AlertTriangle,
    "arrow-down-to-line": ArrowDownToLine,
    "arrow-up-from-line": ArrowUpFromLine,
    "rotate-ccw": RotateCcw,
    "clipboard-check": ClipboardCheck,
};

const typeStyles: Record<NotificationType, string> = {
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400",
    error: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function getRelativeTime(date: string) {
    const timestamp = new Date(date).getTime();

    if (Number.isNaN(timestamp)) {
        return "";
    }

    const diff = timestamp - Date.now();
    const seconds = Math.round(diff / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    const formatter = new Intl.RelativeTimeFormat("id", {
        numeric: "auto",
    });

    if (Math.abs(seconds) < 60) {
        return formatter.format(seconds, "second");
    }

    if (Math.abs(minutes) < 60) {
        return formatter.format(minutes, "minute");
    }

    if (Math.abs(hours) < 24) {
        return formatter.format(hours, "hour");
    }

    if (Math.abs(days) < 7) {
        return formatter.format(days, "day");
    }

    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(date));
}

function getCsrfToken() {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
        ?.content;
}

async function apiRequest(
    url: string,
    method: "GET" | "PATCH" | "DELETE" = "GET",
) {
    const csrfToken = getCsrfToken();

    const response = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(csrfToken
                ? {
                      "X-CSRF-TOKEN": csrfToken,
                  }
                : {}),
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    // =========================================================
    // FETCH NOTIFICATIONS
    // =========================================================

    const fetchNotifications = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }

        try {
            const data: NotificationResponse =
                await apiRequest("/notifications");

            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
        } catch (error) {
            if (!silent) {
                toast.error("Gagal memuat notifikasi.");
            }

            console.error("Fetch notifications error:", error);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, []);

    // =========================================================
    // INITIAL FETCH + POLLING
    // =========================================================

    useEffect(() => {
        fetchNotifications();

        const interval = window.setInterval(() => {
            fetchNotifications(true);
        }, 30_000);

        return () => {
            window.clearInterval(interval);
        };
    }, [fetchNotifications]);

    // =========================================================
    // MARK AS READ
    // =========================================================

    const markAsRead = async (notification: AppNotification) => {
        if (notification.is_read) {
            return;
        }

        // Optimistic update
        setNotifications((prev) =>
            prev.map((item) =>
                item.id === notification.id
                    ? {
                          ...item,
                          is_read: true,
                          read_at: new Date().toISOString(),
                      }
                    : item,
            ),
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            await apiRequest(`/notifications/${notification.id}/read`, "PATCH");
        } catch (error) {
            console.error("Mark notification read error:", error);

            // Re-fetch untuk sinkronisasi jika request gagal
            fetchNotifications(true);
        }
    };

    // =========================================================
    // CLICK NOTIFICATION
    // =========================================================

    const handleNotificationClick = async (notification: AppNotification) => {
        setOpen(false);

        await markAsRead(notification);

        if (notification.action_url) {
            router.visit(notification.action_url);
        }
    };

    // =========================================================
    // MARK ALL AS READ
    // =========================================================

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0 || markingAll) {
            return;
        }

        setMarkingAll(true);

        // Optimistic update
        setNotifications((prev) =>
            prev.map((item) => ({
                ...item,
                is_read: true,
                read_at: item.read_at ?? new Date().toISOString(),
            })),
        );

        setUnreadCount(0);

        try {
            await apiRequest("/notifications/read-all", "PATCH");

            toast.success("Semua notifikasi ditandai telah dibaca.");
        } catch (error) {
            console.error("Mark all notifications error:", error);

            toast.error("Gagal memperbarui notifikasi.");

            fetchNotifications(true);
        } finally {
            setMarkingAll(false);
        }
    };

    // =========================================================
    // DELETE NOTIFICATION
    // =========================================================

    const handleDelete = async (
        notification: AppNotification,
        event: React.MouseEvent,
    ) => {
        event.stopPropagation();

        setDeletingId(notification.id);

        try {
            await apiRequest(`/notifications/${notification.id}`, "DELETE");

            setNotifications((prev) =>
                prev.filter((item) => item.id !== notification.id),
            );

            if (!notification.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Delete notification error:", error);

            toast.error("Gagal menghapus notifikasi.");
        } finally {
            setDeletingId(null);
        }
    };

    // =========================================================
    // ICON
    // =========================================================

    const getNotificationIcon = (icon?: string) => {
        const Icon = iconMap[icon ?? "bell"] ?? Bell;

        return Icon;
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="relative">
            {/* TRIGGER */}
            <button
                type="button"
                onClick={() => {
                    setOpen((prev) => !prev);

                    if (!open) {
                        fetchNotifications(true);
                    }
                }}
                className="
                    relative flex size-9 items-center justify-center
                    rounded-xl border transition-colors
                    hover:bg-muted
                "
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={open}
            >
                <Bell className="size-4" />

                {unreadCount > 0 && (
                    <span
                        className="
                            absolute -right-1 -top-1
                            flex min-w-5 items-center justify-center
                            rounded-full border-2 border-background
                            bg-red-500 px-1
                            text-[10px] font-bold text-white
                        "
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* PANEL */}
            {open && (
                <>
                    {/* MOBILE BACKDROP */}
                    <button
                        type="button"
                        aria-label="Close notifications"
                        onClick={() => setOpen(false)}
                        className="
                            fixed inset-0 z-40
                            bg-black/20 md:hidden
                        "
                    />

                    <div
                        className="
                            absolute right-0 top-12 z-50
                            flex w-[calc(100vw-2rem)] max-w-sm
                            flex-col overflow-hidden
                            rounded-2xl border bg-background
                            shadow-2xl
                        "
                    >
                        {/* HEADER */}
                        <div
                            className="
                                flex items-center justify-between
                                border-b px-4 py-3
                            "
                        >
                            <div>
                                <h3 className="text-sm font-semibold">
                                    Notifications
                                </h3>

                                <p className="text-xs text-muted-foreground">
                                    {unreadCount > 0
                                        ? `${unreadCount} unread notifications`
                                        : "You're all caught up"}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleMarkAllAsRead}
                                        disabled={markingAll}
                                        title="Mark all as read"
                                        className="
                                            flex items-center gap-1
                                            rounded-lg px-2 py-1.5
                                            text-xs text-primary
                                            hover:bg-primary/10
                                            disabled:opacity-50
                                        "
                                    >
                                        {markingAll ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <CheckCheck className="size-3.5" />
                                        )}

                                        <span className="hidden sm:inline">
                                            Read all
                                        </span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="
                                        rounded-lg p-1.5
                                        hover:bg-muted
                                    "
                                    aria-label="Close"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>

                        {/* BODY */}
                        <div className="max-h-[420px] overflow-y-auto">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-12">
                                    <Loader2 className="size-5 animate-spin text-muted-foreground" />

                                    <p className="text-xs text-muted-foreground">
                                        Loading notifications...
                                    </p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div
                                    className="
                                        flex flex-col items-center
                                        justify-center gap-3
                                        px-6 py-12 text-center
                                    "
                                >
                                    <div
                                        className="
                                            flex size-12 items-center
                                            justify-center rounded-full
                                            bg-muted
                                        "
                                    >
                                        <Bell className="size-5 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium">
                                            No notifications
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Notifications will appear here.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map((notification) => {
                                        const Icon = getNotificationIcon(
                                            notification.icon,
                                        );

                                        return (
                                            <div
                                                key={notification.id}
                                                className={`
                                                    group relative
                                                    flex gap-3 p-4
                                                    transition-colors
                                                    hover:bg-muted/50
                                                    ${
                                                        notification.is_read
                                                            ? "bg-background"
                                                            : "bg-primary/3"
                                                    }
                                                `}
                                            >
                                                {/* ICON */}
                                                <div
                                                    className={`
                                                        flex size-9
                                                        shrink-0 items-center
                                                        justify-center
                                                        rounded-full
                                                        ${
                                                            typeStyles[
                                                                notification
                                                                    .type
                                                            ] ?? typeStyles.info
                                                        }
                                                    `}
                                                >
                                                    <Icon className="size-4" />
                                                </div>

                                                {/* CONTENT */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleNotificationClick(
                                                            notification,
                                                        )
                                                    }
                                                    className="
                                                        min-w-0 flex-1
                                                        text-left
                                                    "
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <p
                                                            className={`
                                                                text-sm
                                                                ${
                                                                    notification.is_read
                                                                        ? "font-medium"
                                                                        : "font-semibold"
                                                                }
                                                            `}
                                                        >
                                                            {notification.title}
                                                        </p>

                                                        {!notification.is_read && (
                                                            <span
                                                                className="
                                                                    mt-1.5 size-2
                                                                    shrink-0
                                                                    rounded-full
                                                                    bg-primary
                                                                "
                                                            />
                                                        )}
                                                    </div>

                                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                        {notification.message}
                                                    </p>

                                                    <p className="mt-2 text-[11px] text-muted-foreground">
                                                        {getRelativeTime(
                                                            notification.created_at,
                                                        )}
                                                    </p>
                                                </button>

                                                {/* DELETE */}
                                                <button
                                                    type="button"
                                                    onClick={(event) =>
                                                        handleDelete(
                                                            notification,
                                                            event,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId ===
                                                        notification.id
                                                    }
                                                    title="Delete notification"
                                                    className="
                                                        absolute right-2 top-2
                                                        rounded-md p-1.5
                                                        text-muted-foreground
                                                        opacity-100
                                                        hover:bg-destructive/10
                                                        hover:text-destructive
                                                        disabled:opacity-50
                                                        sm:opacity-0
                                                        sm:group-hover:opacity-100
                                                    "
                                                >
                                                    {deletingId ===
                                                    notification.id ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="size-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* FOOTER */}
                        <div className="border-t p-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="
                                    w-full rounded-lg py-2
                                    text-xs font-medium
                                    text-muted-foreground
                                    hover:bg-muted hover:text-foreground
                                "
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
