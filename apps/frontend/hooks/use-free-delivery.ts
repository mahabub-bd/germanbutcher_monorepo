"use client";

import { postData } from "@/utils/api-utils";
import type { FreeDeliveryCheckResult } from "@/utils/types";
import { useEffect, useState } from "react";

interface UseFreeDeliveryParams {
  /** Cart subtotal after product + coupon discounts */
  payableSubtotal: number;
  itemCount: number;
  items: { productId: number; quantity: number }[];
}

/**
 * Server-evaluated free delivery check for the cart/checkout banner.
 * Runs the campaign conditions (date range, day/time in Asia/Dhaka,
 * products/categories, new customers) against the cart; the server also
 * applies the legacy threshold fallback. Returns null while loading or on
 * failure so callers can fall back to their local threshold computation.
 */
export function useFreeDelivery(params: UseFreeDeliveryParams) {
  const [result, setResult] = useState<FreeDeliveryCheckResult | null>(null);
  const itemsKey = JSON.stringify(params.items);

  useEffect(() => {
    if (!params.items.length) {
      setResult(null);
      return;
    }

    // Debounce rapid cart churn before hitting the check endpoint
    const timer = setTimeout(() => {
      postData<FreeDeliveryCheckResult>("free-delivery-campaigns/check", {
        payableSubtotal: params.payableSubtotal,
        totalQuantity: params.itemCount,
        items: params.items,
      })
        .then((response) => setResult(response.data as FreeDeliveryCheckResult))
        .catch(() => setResult(null));
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, params.payableSubtotal, params.itemCount]);

  return result;
}
