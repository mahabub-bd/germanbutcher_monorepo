"use client";

import { formatDateTime } from "@/lib/utils";
import { formatOrderElapsedTime } from "@/utils/order-helper";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

/** Open orders older than this many days are flagged as stale. */
const STALE_AFTER_DAYS = 3;

/**
 * Elapsed-time chip shared by the orders list and the customer/CRM/user
 * detail orders tables: neutral while fresh, red once the order sits
 * UNDELIVERED for 3+ days; delivered orders show the order→delivery
 * span in green; cancelled orders show the order→cancel span in slate.
 * Re-renders every minute so ages stay current.
 */
export function ElapsedTime({
    createdAt,
    deliveredAt,
    cancelledAt,
}: {
    createdAt: string;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
}) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(timer);
    }, []);

    const isDelivered = Boolean(deliveredAt);
    const isCancelled = !isDelivered && Boolean(cancelledAt);
    const end = isDelivered
        ? new Date(deliveredAt as string).getTime()
        : isCancelled
            ? new Date(cancelledAt as string).getTime()
            : now;
    const elapsed = formatOrderElapsedTime(createdAt, end);
    const isStale =
        !isDelivered &&
        !isCancelled &&
        now - new Date(createdAt).getTime() >= STALE_AFTER_DAYS * 86400000;

    const colorClass = isDelivered
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
        : isCancelled
            ? "bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400"
            : isStale
                ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                : "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";

    const Icon = isDelivered ? CheckCircle2 : isCancelled ? XCircle : Clock;

    const title = isDelivered
        ? `Order → delivery: ${formatDateTime(createdAt)} → ${formatDateTime(deliveredAt as string)}`
        : isCancelled
            ? `Order → cancelled: ${formatDateTime(createdAt)} → ${formatDateTime(cancelledAt as string)}`
            : `Order placed ${formatDateTime(createdAt)}`;

    return (
        <span
            title={title}
            className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-px text-[10px] font-medium tabular-nums ${colorClass}`}
        >
            <Icon className="h-3 w-3" />
            {elapsed}
        </span>
    );
}
