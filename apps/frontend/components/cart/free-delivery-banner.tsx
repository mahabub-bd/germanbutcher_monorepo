"use client";

import { Progress } from "@/components/ui/progress";
import { formatCurrencyEnglish } from "@/lib/utils";
import { PartyPopper } from "lucide-react";

interface FreeDeliveryBannerProps {
  /** Result of the server-side campaign check */
  source?: "campaign" | "pending" | "none";
  /** Name of the matched (or targeted) free delivery campaign */
  campaignName?: string;
  /** Amount still needed to unlock the campaign (source = "pending") */
  remaining?: number;
  /** Minimum order amount of the pending campaign, for the progress bar */
  minOrderAmount?: number;
  /** Hide entirely when the cart is empty */
  itemCount?: number;
  className?: string;
}

/** Free delivery banner shared by the cart page and the header cart sheet.
 * Compact single-row layout: unlock message or "add ৳X more" progress. */
export function FreeDeliveryBanner({
  source,
  campaignName,
  remaining,
  minOrderAmount,
  itemCount = 0,
  className,
}: FreeDeliveryBannerProps) {
  if (itemCount <= 0) return null;

  if (source === "campaign") {
    return (
      <div
        className={`flex items-center gap-2.5 rounded-lg border border-green-100 bg-green-50/70 px-3 py-2 dark:border-green-900/40 dark:bg-green-950/30 ${className ?? ""}`}
      >
        <PartyPopper className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
        <p className="truncate text-xs font-semibold text-green-700 dark:text-green-400">
          Free delivery unlocked
          {campaignName ? ` — ${campaignName}` : ""}!
        </p>
      </div>
    );
  }

  if (source === "pending" && (remaining ?? 0) > 0) {
    const target = minOrderAmount ?? 0;
    const progress =
      target > 0 ? Math.min(((target - remaining!) / target) * 100, 100) : 0;

    return (
      <div
        className={`rounded-lg border border-primaryColor/15 bg-red-50/60 px-3 py-2 dark:border-red-900/40 dark:bg-red-950/20 ${className ?? ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p
            className="truncate text-xs font-medium text-gray-900 dark:text-gray-50"
            title={campaignName}
          >
            Add{" "}
            <span className="font-semibold text-primaryColor dark:text-red-400">
              {formatCurrencyEnglish(remaining ?? 0)}
            </span>{" "}
            more for free delivery
          </p>
          <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress
          value={progress}
          className="mt-1.5 h-1 bg-red-100 dark:bg-red-950 [&>div]:bg-primaryColor dark:[&>div]:bg-red-400"
        />
      </div>
    );
  }

  return null;
}
