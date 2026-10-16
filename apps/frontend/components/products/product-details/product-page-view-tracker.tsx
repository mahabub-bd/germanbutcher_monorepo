"use client";

import { apiUrl } from "@/utils/api-utils";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Fire-and-forget page-view beacon for product detail pages. Server-rendered
 * product data is served from Next's fetch cache, so most page views never
 * reach a tracked API route — this records the real browser visit instead.
 * Renders nothing.
 */
export function ProductPageViewTracker() {
  const pathname = usePathname();
  const sentPath = useRef<string | null>(null);

  useEffect(() => {
    // Guard against double-fires (React StrictMode double-invokes effects)
    if (!pathname || sentPath.current === pathname) return;
    sentPath.current = pathname;

    fetch(`${apiUrl}/analytics/track/page-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {
      // Analytics must never break the page
    });
  }, [pathname]);

  return null;
}
