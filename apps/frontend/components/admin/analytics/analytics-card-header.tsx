import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
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
} as const;

export type AnalyticsCardTone = keyof typeof TONES;

interface AnalyticsCardHeaderProps {
  title: string;
  description?: ReactNode;
  icon: LucideIcon;
  tone?: AnalyticsCardTone;
  /** Optional right-aligned slot (e.g. a total or badge). */
  action?: ReactNode;
}

/** Shared card header for every analytics section card: tinted icon chip
 * beside the title/description, with an optional right-side slot. */
export function AnalyticsCardHeader({
  title,
  description,
  icon: Icon,
  tone = "blue",
  action,
}: AnalyticsCardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center gap-2">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action && <div className="ml-auto text-right">{action}</div>}
      </div>
    </CardHeader>
  );
}
