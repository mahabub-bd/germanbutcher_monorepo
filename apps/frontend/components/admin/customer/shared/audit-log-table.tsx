"use client";

import {
    formatAction,
    MethodPill,
    StatusPill,
} from "@/components/admin/reports/user-activity/audit-visuals";
import { formatDateTime } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

/** One user_activity row (POST/PATCH/DELETE only), as returned by `user-activities`. */
export interface AuditLogEntry {
    id: number;
    action: string;
    entityType: string;
    entityId: number | null;
    ipAddress: string | null;
    status: string;
    message: string | null;
    createdAt: string;
}

interface AuditLogTableProps {
    logs: AuditLogEntry[];
    /** Shown when the list is empty — pages vary the copy. */
    emptyMessage?: string;
}

/**
 * Audit-trail table shared by the customer and user detail pages: a
 * six-column desktop table (method pill, action, entity, details, time, IP)
 * collapsing to one compact line per entry on phones.
 */
export function AuditLogTable({ logs, emptyMessage }: AuditLogTableProps) {
    if (logs.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-6 text-center">
                {emptyMessage}
            </p>
        );
    }

    return (
        <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
                <Table className="min-w-220 report-table text-sm [&_th]:text-sm [&_td]:text-sm">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-4">Method</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="pr-4 text-right">IP</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => {
                            // Actions are stored as "METHOD /path" — the shared audit
                            // visuals render the method pill so both pages stay alike.
                            const { method, path } = formatAction(log.action);
                            return (
                                <TableRow key={log.id}>
                                    <TableCell className="py-2 pl-4">
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <MethodPill method={method} />
                                            {log.status === "failure" && (
                                                <StatusPill status={log.status} />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <span
                                            className="block max-w-56 truncate font-mono text-sm text-muted-foreground"
                                            title={log.action}
                                        >
                                            {path || log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="whitespace-nowrap text-sm font-medium capitalize">
                                            {log.entityType}
                                            {log.entityId ? ` #${log.entityId}` : ""}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className="block max-w-md truncate text-sm text-muted-foreground"
                                            title={log.message || undefined}
                                        >
                                            {log.message || "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                                            {formatDateTime(log.createdAt)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="pr-4 text-right">
                                        <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                                            {log.ipAddress || "—"}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile list: one compact line per entry */}
            <div className="divide-y rounded-lg border bg-card md:hidden">
                {logs.map((log) => (
                    <div
                        key={log.id}
                        className="flex items-center justify-between gap-2 px-3 py-2.5"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <MethodPill method={formatAction(log.action).method} />
                            <span className="min-w-0 truncate text-xs font-medium capitalize">
                                {log.entityType}
                                {log.entityId ? ` #${log.entityId}` : ""}
                            </span>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                            {formatDateTime(log.createdAt)}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
}
