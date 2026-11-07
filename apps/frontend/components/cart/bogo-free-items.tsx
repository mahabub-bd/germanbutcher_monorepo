"use client";

import { Gift, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BogoPreviewResult } from "@/utils/types";

/**
 * The free items a BOGO campaign grants on the current cart — compact,
 * read-only rows under the regular cart items. They are not editable
 * (their quantity follows the deal math) and carry no price: the discount
 * is already reflected in the totals via the BOGO discount line.
 *
 * When a campaign's cap (per-order or per-customer) reduced the grant,
 * a hint explains why extra units are charged at full price.
 */
export function BogoFreeItems({
  bogoResult,
}: {
  bogoResult: BogoPreviewResult | null;
}) {
  if (!bogoResult?.usages.some((usage) => usage.freeLines.length > 0)) {
    return null;
  }

  return (
    <div className="space-y-1" data-testid="bogo-free-items">
      {bogoResult.usages.map((usage) => (
        <div key={usage.campaign.id} className="space-y-0.5">
          {usage.freeLines.map((line) => (
            <div
              key={line.productId}
              className="flex items-center gap-2 rounded-md border border-dashed border-green-300 bg-green-50/60 px-2 py-1 dark:border-green-800 dark:bg-green-950/30"
            >
              <Gift
                aria-hidden
                className="size-3.5 shrink-0 text-green-600 dark:text-green-400"
              />
              <p className="min-w-0 flex-1 truncate text-xs text-gray-900 dark:text-gray-100">
                {line.productName}
                <span className="text-muted-foreground">
                  {" "}
                  × {line.quantity}
                </span>
              </p>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {usage.campaign.name}
              </span>
              <Badge
                className={cn(
                  "shrink-0 bg-green-600 px-1.5 py-0 text-[10px] text-white hover:bg-green-600"
                )}
              >
                FREE
              </Badge>
            </div>
          ))}

          {usage.capLimit === "per_order" && (
            <p className="flex items-center gap-1.5 px-2 text-[11px] text-muted-foreground">
              <Info className="size-3 shrink-0" />
              Per-order limit: only {usage.groupsEarned} free — extra units
              charged at full price.
            </p>
          )}
          {usage.capLimit === "per_user" && (
            <p className="flex items-center gap-1.5 px-2 text-[11px] text-muted-foreground">
              <Info className="size-3 shrink-0" />
              Per-customer limit reached — extra units charged at full price.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
