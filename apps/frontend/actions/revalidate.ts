"use server";

import { revalidateTag } from "next/cache";

/**
 * Bust the cached "products" tag so public pages (homepage product sections,
 * product detail pages) pick up admin changes immediately instead of waiting
 * for the ISR window to elapse.
 */
export async function revalidateProducts(): Promise<void> {
  // "max" expires every cached entry tagged "products", regardless of its
  // revalidate window, so the next request refetches fresh data.
  revalidateTag("products", "max");
}
