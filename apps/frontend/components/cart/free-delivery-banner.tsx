"use client";

import { Progress } from "@/components/ui/progress";
import { formatCurrencyEnglish } from "@/lib/utils";
import { Truck } from "lucide-react";

interface FreeDeliveryBannerProps {
  /** Whether the store has free delivery enabled */
  enabled?: boolean;
  /** Minimum payable amount that qualifies (0 = inactive) */
  threshold: number;
  /** Cart subtotal after product + coupon discounts */
  payableSubtotal: number;
  /** Hide entirely when the cart is empty */
  itemCount?: number;
  className?: string;
}

/** "Add ৳X more for free delivery" progress banner — shared by the cart
 * page and the header cart sheet so both always match. */
export function FreeDeliveryBanner({
  enabled,
  threshold,
  payableSubtotal,
  itemCount = 0,
  className,
}: FreeDeliveryBannerProps) {
  if (!enabled || threshold <= 0 || itemCount <= 0) return null;

  const isFreeDelivery = payableSubtotal >= threshold;
  const remaining = Math.max(threshold - payableSubtotal, 0);
  const progress = Math.min((payableSubtotal / threshold) * 100, 100);

  return (
    <div
      className={`rounded-xl p-4 ${
        isFreeDelivery
          ? "bg-green-50 dark:bg-green-950/40"
          : "bg-red-50/60 dark:bg-red-950/20"
      } ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <Truck
          className={`h-4 w-4 shrink-0 ${
            isFreeDelivery
              ? "text-green-600 dark:text-green-400"
              : "text-primaryColor dark:text-red-400"
          }`}
        />
        <p
          className={`text-sm font-semibold ${
            isFreeDelivery
              ? "text-green-700 dark:text-green-400"
              : "text-gray-900 dark:text-gray-50"
          }`}
        >
          {isFreeDelivery
            ? "🎉 You've unlocked free delivery!"
            : `Add ${formatCurrencyEnglish(remaining)} more for free delivery`}
        </p>
      </div>
      {!isFreeDelivery && (
        <Progress
          value={progress}
          className="mt-3 h-2 bg-red-100 dark:bg-red-950"
        />
      )}
    </div>
  );
}
