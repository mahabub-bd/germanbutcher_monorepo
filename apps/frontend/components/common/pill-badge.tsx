import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pill badge: one shape for every badge in the admin UI — tinted fill, hairline
 * border in the same hue, compact 11px label.
 */
const PILL =
  "inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] font-semibold leading-none whitespace-nowrap shadow-none";

export const PILL_TONE = {
  neutral:
    "border-slate-500/20 bg-slate-50 text-slate-600 dark:border-slate-400/25 dark:bg-slate-500/10 dark:text-slate-300",
  emerald:
    "border-emerald-600/20 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-400",
  amber:
    "border-amber-600/20 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-400",
  orange:
    "border-orange-600/20 bg-orange-50 text-orange-700 dark:border-orange-400/25 dark:bg-orange-500/10 dark:text-orange-400",
  blue:
    "border-blue-600/20 bg-blue-50 text-blue-700 dark:border-blue-400/25 dark:bg-blue-500/10 dark:text-blue-400",
  sky:
    "border-sky-600/20 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-500/10 dark:text-sky-400",
  violet:
    "border-violet-600/20 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/10 dark:text-violet-400",
  red:
    "border-red-600/20 bg-red-50 text-red-700 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-400",
} as const;

export type PillTone = keyof typeof PILL_TONE;

/** Order status (API snake_case value) → pill tone. */
export const ORDER_STATUS_TONE: Record<string, PillTone> = {
  pending: "amber",
  processing: "blue",
  on_hold: "orange",
  shipped: "violet",
  delivered: "emerald",
  cancelled: "red",
  returned: "neutral",
};

/** Payment status (API snake_case value) → pill tone. */
export const PAYMENT_STATUS_TONE: Record<string, PillTone> = {
  pending: "amber",
  completed: "emerald",
  partial: "sky",
  paid: "emerald",
  failed: "red",
  refunded: "violet",
  need_refund: "amber",
  partial_refund: "sky",
  refund_complete: "violet",
};

interface PillBadgeProps {
  /** Colour family. Defaults to a neutral slate pill. */
  tone?: PillTone;
  /** Native tooltip, e.g. the full timestamp behind a truncated value. */
  title?: string;
  className?: string;
  children: ReactNode;
}

export function PillBadge({
  tone = "neutral",
  title,
  className,
  children,
}: PillBadgeProps) {
  return (
    <span title={title} className={cn(PILL, PILL_TONE[tone], className)}>
      {children}
    </span>
  );
}
