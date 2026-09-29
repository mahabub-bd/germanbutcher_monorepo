"use client";

import { fetchData } from "@/utils/api-utils";
import type { FreeDeliveryCampaign, Product } from "@/utils/types";
import { useEffect, useState } from "react";

const CACHE_TTL = 5 * 60 * 1000;

// Module-level cache + in-flight dedup so a grid of product cards shares
// one request instead of firing one per card.
let cache: { data: FreeDeliveryCampaign[] | null; timestamp: number } | null =
  null;
let inflight: Promise<FreeDeliveryCampaign[] | null> | null = null;

function fetchActiveCampaigns(): Promise<FreeDeliveryCampaign[] | null> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return Promise.resolve(cache.data);
  }
  inflight ??= fetchData<FreeDeliveryCampaign[]>("free-delivery-campaigns/active")
    .then((data) => {
      cache = { data, timestamp: Date.now() };
      return data;
    })
    .catch((error) => {
      console.error("Error fetching free delivery campaigns:", error);
      inflight = null; // allow retry on next mount
      return null;
    });
  return inflight;
}

/** Whether an active campaign explicitly covers this product by listing it
 * (or its category) in the campaign. Unrestricted campaigns are ignored —
 * they have an order minimum, so they don't make every single product
 * "free delivery eligible" on its own. */
export function isProductEligibleForFreeDelivery(
  product: Product,
  campaigns: FreeDeliveryCampaign[]
): boolean {
  return campaigns.some((campaign) => {
    if (campaign.newCustomersOnly) return false;
    const inProducts = campaign.products?.some((p) => p.id === product.id);
    const inCategories = campaign.categories?.some(
      (c) => c.id === product.category?.id
    );
    return Boolean(inProducts || inCategories);
  });
}

/** Whether an active free-delivery campaign covers this product. */
export function useProductFreeDelivery(product?: Product): boolean {
  const [isEligible, setIsEligible] = useState(false);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    fetchActiveCampaigns().then((campaigns) => {
      if (cancelled || !campaigns?.length) return;
      setIsEligible(isProductEligibleForFreeDelivery(product, campaigns));
    });
    return () => {
      cancelled = true;
    };
  }, [product]);

  return isEligible;
}
