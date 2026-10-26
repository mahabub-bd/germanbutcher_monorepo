import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarRange, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Tinted chip colors per tone — light + dark variants kept in one place. */
const TONES = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  teal: "bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
  green:
    "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400",
  amber:
    "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  indigo:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
} as const;

export type AnalyticsCardTone = keyof typeof TONES;

interface AnalyticsCardHeaderProps {
  title: string;
  description?: ReactNode;
  icon: LucideIcon;
  tone?: AnalyticsCardTone;
  /** Optional right-aligned slot (e.g. a total, badge or range). */
  action?: ReactNode;
  className?: string;
}

/** Small range chip shown in card headers so the aggregation window is clear. */
export function AnalyticsRangeBadge({
  label,
  title,
}: {
  label: string;
  title?: string;
}) {
  return (
    <span
      title={title ?? label}
      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-1 text-[10px] font-medium leading-none text-muted-foreground"
    >
      <CalendarRange className="size-3" />
      {label}
    </span>
  );
}

/** Shared card header for every analytics section card: tinted icon chip
 * beside the title/description, with an optional right-side slot. */
export function AnalyticsCardHeader({
  title,
  description,
  icon: Icon,
  tone = "blue",
  action,
  className,
}: AnalyticsCardHeaderProps) {
  return (
    <CardHeader
      className={cn(
        "gap-0 border-b pb-3 [.border-b]:pb-3",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              TONES[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <CardTitle
              className="truncate text-base font-semibold leading-tight"
              title={title}
            >
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-0.5 text-xs leading-snug">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {action && <div className="shrink-0 text-right">{action}</div>}
      </div>
    </CardHeader>
  );
}
