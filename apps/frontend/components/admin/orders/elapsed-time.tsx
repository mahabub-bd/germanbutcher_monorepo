"use client";

import { formatDateTime } from "@/lib/utils";
import { formatOrderElapsedTime } from "@/utils/order-helper";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

/** Open orders older than this many days are flagged as stale — fallback for
 *  rows without a known shipping method. */
const STALE_AFTER_DAYS = 3;

/** Per-method delivery timelines, same rules as the late-delivery report:
 *  Express 6h · Outside Dhaka 5 days (120h) · Inside Dhaka 2 days (48h).
 *  Methods the list doesn't name fall back to the flat stale threshold. */
const METHOD_TIMELINE_RULES: [RegExp, number][] = [
    [/express/i, 6],
    [/outside/i, 120],
    [/inside/i, 48],
];

const timelineHours = (method?: string | null) => {
    if (!method) return null;
    return METHOD_TIMELINE_RULES.find(([pattern]) => pattern.test(method))?.[1] ?? null;
};

/**
 * Elapsed-time chip shared by the orders list and the customer/CRM/user
 * detail orders tables: neutral while fresh, red once an UNDELIVERED order
 * sits past its shipping method's delivery timeline (Inside 48h · Outside
 * 120h · Express 6h; flat 3-day fallback without a method) — matching the
 * late-delivery report. Delivered orders show the order→delivery span in
 * green; cancelled orders show the order→cancel span in slate.
 * Re-renders every minute so ages stay current.
 */
export function ElapsedTime({
    createdAt,
    deliveredAt,
    cancelledAt,
    shippingMethod,
}: {
    createdAt: string;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
    shippingMethod?: string | null;
}) {
    const isDelivered = Boolean(deliveredAt);
    const isCancelled = !isDelivered && Boolean(cancelledAt);

    const [now, setNow] = useState(() => Date.now());
    // Delivered/cancelled chips are frozen at their end date — only open
    // orders need the minute tick. Detail pages render many rows at once,
    // so a static row costs no interval and no per-minute re-render.
    const ticking = !isDelivered && !isCancelled;
    useEffect(() => {
        if (!ticking) return;
        const timer = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(timer);
    }, [ticking]);
    const end = isDelivered
        ? new Date(deliveredAt as string).getTime()
        : isCancelled
            ? new Date(cancelledAt as string).getTime()
            : now;
    const elapsed = formatOrderElapsedTime(createdAt, end);
    // Stale cutoff: the method's promised timeline when known, else the flat
    // 3-day fallback. An Inside Dhaka order only turns red after 48h.
    const staleAfterHours = timelineHours(shippingMethod) ?? STALE_AFTER_DAYS * 24;
    const isStale =
        !isDelivered &&
        !isCancelled &&
        (now - new Date(createdAt).getTime()) / 3600000 >= staleAfterHours;

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
            : `Order placed ${formatDateTime(createdAt)} · timeline ${staleAfterHours}h`;

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
