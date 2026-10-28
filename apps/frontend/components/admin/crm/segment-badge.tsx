"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CrmSegmentValue =
  | "vip"
  | "loyal"
  | "at_risk"
  | "new"
  | "inactive";

const SEGMENT_STYLES: Record<
  CrmSegmentValue,
  { label: string; className: string }
> = {
  vip: {
    label: "VIP",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  },
  loyal: {
    label: "Loyal",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  at_risk: {
    label: "At Risk",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
  new: {
    label: "New",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  inactive: {
    label: "Inactive",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400",
  },
};

export function SegmentBadge({
  segment,
  className,
}: {
  segment?: string | null;
  className?: string;
}) {
  const style = segment
    ? SEGMENT_STYLES[segment as CrmSegmentValue]
    : undefined;

  if (!style) return null;

  return (
    <Badge
      variant="outline"
      className={cn("capitalize", style.className, className)}
    >
      {style.label}
    </Badge>
  );
}
