import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    Search,
    FileText,
    Activity,
    Users,
    Layers,
    Eye,
    RefreshCw,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
} from "lucide-react";

interface AuditUser {
    id: number;
    name: string;
}

interface AuditLog {
    id: number;
    user_id: number | null;
    user: AuditUser | null;
    action: string;
    module: string;
    description: string;
    auditable_type: string | null;
    auditable_id: number | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    metadata: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedAuditLogs {
    data: AuditLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Summary {
    total_logs: number;
    today_logs: number;
    total_users: number;
    total_modules: number;
}

interface Options {
    modules: string[];
    actions: string[];
    users: AuditUser[];
}

interface Filters {
    search?: string;
    module?: string;
    action?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
    per_page?: number;
}

interface Props {
    auditLogs: PaginatedAuditLogs;
    summary: Summary;
    options: Options;
    filters: Filters;
}

const actionColors: Record<string, string> = {
    CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CREATED: "bg-emerald-100 text-emerald-700 border-emerald-200",

    UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
    UPDATED: "bg-blue-100 text-blue-700 border-blue-200",

    DELETE: "bg-red-100 text-red-700 border-red-200",
    DELETED: "bg-red-100 text-red-700 border-red-200",

    STOCK_IN: "bg-green-100 text-green-700 border-green-200",
    STOCK_OUT: "bg-orange-100 text-orange-700 border-orange-200",

    STOCK_RETURN: "bg-cyan-100 text-cyan-700 border-cyan-200",

    STATUS_UPDATE: "bg-violet-100 text-violet-700 border-violet-200",

    LOGIN: "bg-indigo-100 text-indigo-700 border-indigo-200",
    LOGOUT: "bg-gray-100 text-gray-700 border-gray-200",
};

const formatDate = (date: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatNumber = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value ?? 0);
};

const getActionColor = (action: string) => {
    return (
        actionColors[action?.toUpperCase()] ??
        "bg-gray-100 text-gray-700 border-gray-200"
    );
};

export default function AuditLogsIndex({
    auditLogs,
    summary,
    options,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [module, setModule] = useState(filters.module ?? "");
    const [action, setAction] = useState(filters.action ?? "");
    const [userId, setUserId] = useState(filters.user_id ?? "");
    const [startDate, setStartDate] = useState(filters.start_date ?? "");
    const [endDate, setEndDate] = useState(filters.end_date ?? "");
    const [perPage, setPerPage] = useState(String(filters.per_page ?? 10));

    const hasFilters = useMemo(() => {
        return (
            search !== "" ||
            module !== "" ||
            action !== "" ||
            userId !== "" ||
            startDate !== "" ||
            endDate !== ""
        );
    }, [search, module, action, userId, startDate, endDate]);

    const applyFilters = () => {
        router.get(
            "/audit-logs",
            {
                search: search || undefined,
                module: module || undefined,
                action: action || undefined,
                user_id: userId || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                per_page: perPage,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        setSearch("");
        setModule("");
        setAction("");
        setUserId("");
        setStartDate("");
        setEndDate("");
        setPerPage("10");

        router.get(
            "/audit-logs",
            { per_page: 10 },
            {
                preserveState: false,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const openDetail = (log: AuditLog) => {
        router.get(`/audit-logs/${log.id}`);
    };

    const goToPage = (url: string | null) => {
        if (!url) return;

        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <DashboardLayout>
            <Head title="Audit Logs" />

            <div className="space-y-6">
                {/* HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-primary" />

                            <h1 className="text-2xl font-bold tracking-tight">
                                Audit Logs
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Monitor and track all activities performed within
                            Stock-Flow.
                        </p>
                    </div>

                    <Button variant="outline" onClick={() => router.reload()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {/* SUMMARY */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Audit Logs
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    {formatNumber(summary.total_logs)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                                <FileText className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Activities Today
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    {formatNumber(summary.today_logs)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-green-100 p-3 text-green-600">
                                <Activity className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Active Users
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    {formatNumber(summary.total_users)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-violet-100 p-3 text-violet-600">
                                <Users className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Modules
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    {formatNumber(summary.total_modules)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                                <Layers className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* FILTER */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Filter Activities
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {/* SEARCH */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search activity..."
                                    className="pl-9"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            applyFilters();
                                        }
                                    }}
                                />
                            </div>

                            {/* MODULE */}
                            <select
                                value={module}
                                onChange={(e) => setModule(e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">All Modules</option>

                                {options.modules.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>

                            {/* ACTION */}
                            <select
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">All Actions</option>

                                {options.actions.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>

                            {/* USER */}
                            <select
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">All Users</option>

                                {options.users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>

                            {/* DATE FROM */}
                            <div className="relative">
                                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="pl-9"
                                />
                            </div>

                            {/* DATE TO */}
                            <div className="relative">
                                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            {/* PER PAGE */}
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="10">10 per page</option>
                                <option value="25">25 per page</option>
                                <option value="50">50 per page</option>
                                <option value="100">100 per page</option>
                            </select>

                            {/* BUTTONS */}
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    onClick={applyFilters}
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={resetFilters}
                                    disabled={!hasFilters}
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* TABLE */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Activity History</CardTitle>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {formatNumber(auditLogs.total)} records found
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40">
                                        <th className="px-4 py-3 text-left font-medium">
                                            Date & Time
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            User
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Module
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Action
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Description
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            IP Address
                                        </th>

                                        <th className="px-4 py-3 text-center font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {auditLogs.data.length > 0 ? (
                                        auditLogs.data.map((log) => (
                                            <tr
                                                key={log.id}
                                                className="border-b transition-colors hover:bg-muted/30"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {formatDate(log.created_at)}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="font-medium">
                                                        {log.user?.name ??
                                                            "System"}
                                                    </div>

                                                    <div className="text-xs text-muted-foreground">
                                                        ID: {log.user_id ?? "-"}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Badge variant="outline">
                                                        {log.module}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={getActionColor(
                                                            log.action,
                                                        )}
                                                    >
                                                        {log.action}
                                                    </Badge>
                                                </td>

                                                <td className="max-w-[300px] px-4 py-3">
                                                    <p
                                                        className="line-clamp-2"
                                                        title={log.description}
                                                    >
                                                        {log.description}
                                                    </p>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                                    {log.ip_address ?? "-"}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            openDetail(log)
                                                        }
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Detail
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-12 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <FileText className="h-10 w-10 opacity-40" />

                                                    <p>No audit logs found.</p>

                                                    <p className="text-xs">
                                                        Try changing your
                                                        filters.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing{" "}
                                <span className="font-medium text-foreground">
                                    {auditLogs.data.length > 0
                                        ? (auditLogs.current_page - 1) *
                                              auditLogs.per_page +
                                          1
                                        : 0}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-foreground">
                                    {Math.min(
                                        auditLogs.current_page *
                                            auditLogs.per_page,
                                        auditLogs.total,
                                    )}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-foreground">
                                    {auditLogs.total}
                                </span>{" "}
                                records
                            </p>

                            <div className="flex items-center justify-end gap-1">
                                {auditLogs.links.map((link, index) => {
                                    const isPrevious =
                                        link.label.includes("Previous") ||
                                        link.label.includes("&laquo;");

                                    const isNext =
                                        link.label.includes("Next") ||
                                        link.label.includes("&raquo;");

                                    if (isPrevious || isNext) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                disabled={!link.url}
                                                onClick={() =>
                                                    goToPage(link.url)
                                                }
                                            >
                                                {isPrevious ? (
                                                    <ChevronLeft className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        );
                                    }

                                    return (
                                        <Button
                                            key={index}
                                            variant={
                                                link.active
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            className="h-8 min-w-8"
                                            disabled={!link.url}
                                            onClick={() => goToPage(link.url)}
                                        >
                                            {link.label.replace(/&[^;]+;/g, "")}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
