import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/layouts/dashboard-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    ArrowLeft,
    ShieldCheck,
    User,
    CalendarDays,
    Globe,
    FileText,
    Database,
    Activity,
    Monitor,
    Clock,
    Package,
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

interface Props {
    auditLog: AuditLog;
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
};

const getActionColor = (action: string) =>
    actionColors[action?.toUpperCase()] ??
    "bg-gray-100 text-gray-700 border-gray-200";

const formatDate = (date: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const formatKey = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-";

    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
    }

    return String(value);
};

function JsonViewer({ data }: { data: Record<string, any> | null }) {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="py-6 text-center text-sm text-muted-foreground">
                No data available.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="rounded-lg border bg-muted/20 p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {formatKey(key)}
                    </p>

                    {typeof value === "object" && value !== null ? (
                        <pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word rounded-md bg-muted p-3 text-xs">
                            {JSON.stringify(value, null, 2)}
                        </pre>
                    ) : (
                        <p className="wrap-break-word text-sm font-medium">
                            {formatValue(value)}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

function ValueComparison({
    oldValues,
    newValues,
}: {
    oldValues: Record<string, any> | null;
    newValues: Record<string, any> | null;
}) {
    const keys = Array.from(
        new Set([
            ...Object.keys(oldValues ?? {}),
            ...Object.keys(newValues ?? {}),
        ]),
    );

    if (keys.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                No changes recorded for this activity.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
                <thead>
                    <tr className="border-b bg-muted/40">
                        <th className="px-4 py-3 text-left font-medium">
                            Field
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                            Old Value
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                            New Value
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {keys.map((key) => (
                        <tr key={key} className="border-b">
                            <td className="px-4 py-3 font-medium">
                                {formatKey(key)}
                            </td>

                            <td className="px-4 py-3">
                                <div className="rounded-md bg-red-50 p-2 text-red-700 dark:bg-red-950/30 dark:text-red-300">
                                    <pre className="whitespace-pre-wrap wrap-break-word text-xs">
                                        {formatValue(oldValues?.[key])}
                                    </pre>
                                </div>
                            </td>

                            <td className="px-4 py-3">
                                <div className="rounded-md bg-green-50 p-2 text-green-700 dark:bg-green-950/30 dark:text-green-300">
                                    <pre className="whitespace-pre-wrap wrap-break-word text-xs">
                                        {formatValue(newValues?.[key])}
                                    </pre>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function AuditLogShow({ auditLog }: Props) {
    const log = auditLog;

    return (
        <DashboardLayout>
            <Head title={`Audit Log #${log.id}`} />

            <div className="space-y-6">
                {/* HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-primary" />

                            <h1 className="text-2xl font-bold tracking-tight">
                                Audit Log Detail
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Detailed information about system activity.
                        </p>
                    </div>

                    <Button variant="outline">
                        <Link href="/audit-logs">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Audit Logs
                        </Link>
                    </Button>
                </div>

                {/* ACTIVITY SUMMARY */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Activity Information
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className={getActionColor(log.action)}
                            >
                                {log.action}
                            </Badge>

                            <Badge variant="outline">{log.module}</Badge>

                            <Badge variant="secondary">Log ID: #{log.id}</Badge>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Description
                            </p>

                            <p className="mt-1 text-base font-medium">
                                {log.description}
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span className="text-xs">User</span>
                                </div>

                                <p className="font-semibold">
                                    {log.user?.name ?? "System"}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    ID: {log.user_id ?? "-"}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                    <CalendarDays className="h-4 w-4" />
                                    <span className="text-xs">Date & Time</span>
                                </div>

                                <p className="text-sm font-semibold">
                                    {formatDate(log.created_at)}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                    <Globe className="h-4 w-4" />
                                    <span className="text-xs">IP Address</span>
                                </div>

                                <p className="font-semibold">
                                    {log.ip_address ?? "-"}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                    <Database className="h-4 w-4" />
                                    <span className="text-xs">
                                        Related Record
                                    </span>
                                </div>

                                <p className="font-semibold">
                                    {log.auditable_type
                                        ? log.auditable_type.split("\\").pop()
                                        : "-"}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    ID: {log.auditable_id ?? "-"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* OLD VS NEW */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Data Changes
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Comparison between previous and updated values.
                        </p>
                    </CardHeader>

                    <CardContent>
                        <ValueComparison
                            oldValues={log.old_values}
                            newValues={log.new_values}
                        />
                    </CardContent>
                </Card>

                {/* METADATA */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Transaction Metadata
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Additional transaction information and item details.
                        </p>
                    </CardHeader>

                    <CardContent>
                        <JsonViewer data={log.metadata} />
                    </CardContent>
                </Card>

                {/* USER AGENT */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            Device Information
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="mb-1 text-xs font-medium text-muted-foreground">
                                    User Agent
                                </p>

                                <p className="break-all rounded-md border bg-muted/30 p-3 text-sm">
                                    {log.user_agent ?? "Not available"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    Recorded At
                                </p>

                                <p className="text-sm">
                                    {formatDate(log.created_at)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* FOOTER */}
                <div className="flex justify-end">
                    <Button variant="outline">
                        <Link href="/audit-logs">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Audit Logs
                        </Link>
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
