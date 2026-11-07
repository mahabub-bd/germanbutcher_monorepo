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

    // The HTTP Referer header of this fetch is our own page URL, so it can
    // never identify the traffic source. document.referrer is the page the
    // visitor actually came from (e.g. facebook.com) — send it only when it
    // is an external site; empty means Direct.
    let externalReferrer = "";
    try {
      const referrerHost = document.referrer
        ? new URL(document.referrer).hostname
        : "";
      if (referrerHost && referrerHost !== window.location.hostname) {
        externalReferrer = document.referrer;
      }
    } catch {
      // unparseable referrer — treat as Direct
    }

    fetch(`${apiUrl}/analytics/track/page-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer: externalReferrer }),
      keepalive: true,
    }).catch(() => {
      // Analytics must never break the page
    });
  }, [pathname]);

  return null;
}
