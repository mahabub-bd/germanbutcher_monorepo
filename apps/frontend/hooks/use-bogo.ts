"use client";

import { previewBogo } from "@/lib/bogo-service";
import type { BogoPreviewResult } from "@/utils/types";
import { useEffect, useState } from "react";

/**
 * Server-evaluated BOGO preview for the cart. Debounced like the free
 * delivery check; returns null while loading or when nothing qualifies.
 */
export function useBogo(items: { productId: number; quantity: number }[]) {
  const [result, setResult] = useState<BogoPreviewResult | null>(null);
  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    if (!items.length) {
      setResult(null);
      return;
    }

    // Debounce rapid cart churn before hitting the preview endpoint
    const timer = setTimeout(() => {
      previewBogo(items)
        .then((result) => setResult(result ?? null))
        .catch(() => setResult(null));
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  return result;
}
