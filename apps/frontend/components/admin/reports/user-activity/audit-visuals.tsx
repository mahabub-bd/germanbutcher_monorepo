import { PillBadge, type PillTone } from "@/components/common/pill-badge";
import {
    Activity,
    CheckCircle2,
    Clock,
    Eye,
    LogIn,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
    XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared presentation for audit-log events so the list and the detail page
 * cannot drift apart on tones or icons.
 */

/** HTTP method → pill tone. */
export const ACTION_TONE: Record<string, PillTone> = {
    GET: "blue",
    POST: "emerald",
    PATCH: "amber",
    PUT: "orange",
    DELETE: "red",
    LOGIN: "violet",
};

/** Live rows use the API enum value "failure"; older rows wrote "failed". */
export const STATUS_TONE: Record<string, PillTone> = {
    success: "emerald",
    failure: "red",
    failed: "red",
    error: "red",
    pending: "amber",
};

// Icons for HTTP-method action pills.
export const actionIcons: Record<string, ReactNode> = {
    GET: <Eye className="size-3" />,
    POST: <Plus className="size-3" />,
    PATCH: <Pencil className="size-3" />,
    PUT: <RefreshCw className="size-3" />,
    DELETE: <Trash2 className="size-3" />,
    LOGIN: <LogIn className="size-3" />,
};

/** Splits "PATCH /v1/orders/:id/cancel" into its method and path. */
export function formatAction(action: string): { method: string; path: string } {
    const parts = action?.split(" ") ?? [];
    if (parts.length >= 2) {
        return { method: parts[0].toUpperCase(), path: parts.slice(1).join(" ") };
    }
    return { method: (parts[0] || action || "").toUpperCase(), path: "" };
}

export function MethodPill({ method }: { method: string }) {
    return (
        <PillBadge tone={ACTION_TONE[method] ?? "neutral"} className="gap-1">
            {actionIcons[method] ?? <Activity className="size-3" />}
            {method}
        </PillBadge>
    );
}

export function StatusPill({ status }: { status: string }) {
    const normalized = (status || "").toLowerCase();

    return (
        <PillBadge
            tone={STATUS_TONE[normalized] ?? "neutral"}
            className="gap-1 capitalize"
        >
            {normalized === "success" ? (
                <CheckCircle2 className="size-3" />
            ) : normalized === "pending" ? (
                <Clock className="size-3" />
            ) : (
                <XCircle className="size-3" />
            )}
            {status || "unknown"}
        </PillBadge>
    );
}
