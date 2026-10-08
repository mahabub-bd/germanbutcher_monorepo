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
  return findProductFreeDeliveryCampaign(product, campaigns) !== null;
}

/** The best active campaign explicitly covering this product — the one with
 * the lowest order minimum wins. Returns null when no targeted campaign
 * matches. */
export function findProductFreeDeliveryCampaign(
  product: Product,
  campaigns: FreeDeliveryCampaign[]
): FreeDeliveryCampaign | null {
  const matching = campaigns.filter((campaign) => {
    if (campaign.newCustomersOnly) return false;
    const inProducts = campaign.products?.some((p) => p.id === product.id);
    const inCategories = campaign.categories?.some(
      (c) => c.id === product.category?.id
    );
    return Boolean(inProducts || inCategories);
  });
  if (!matching.length) return null;
  return matching.reduce((best, c) =>
    Number(c.minOrderAmount || 0) <= Number(best.minOrderAmount || 0) ? c : best
  );
}

export const DEFAULT_FREE_DELIVERY_LINE = {
  label: "Delivery",
  desc: "Charges apply at checkout",
} as const;

/** Delivery feature line for a product page: from a campaign explicitly
 * targeting this product/category when one exists, otherwise from the
 * lowest-minimum "always-on" campaign, otherwise the default. */
export function useProductFreeDeliveryLine(product?: Product): {
  label: string;
  desc: string;
} {
  const [line, setLine] = useState<{ label: string; desc: string }>(
    DEFAULT_FREE_DELIVERY_LINE
  );

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    fetchActiveCampaigns().then((campaigns) => {
      if (cancelled || !campaigns?.length) return;

      const targeted = findProductFreeDeliveryCampaign(product, campaigns);
      if (targeted) {
        const minimum = Number(targeted.minOrderAmount || 0);
        setLine(
          minimum > 0
            ? {
                label: "Free Delivery",
                desc: `On orders over ৳${minimum.toLocaleString()}`,
              }
            : { label: "Free Delivery", desc: `On ${product.name}` }
        );
        return;
      }

      // No targeted campaign: an always-on campaign (no schedule/product/
      // customer restrictions) still applies to any order.
      const alwaysOn = campaigns.filter(
        (c) =>
          !c.newCustomersOnly &&
          !c.products?.length &&
          !c.categories?.length &&
          !c.daysOfWeek?.length &&
          !c.startTime &&
          !c.endTime
      );
      if (!alwaysOn.length) return;
      const minimum = Math.min(
        ...alwaysOn.map((c) => Number(c.minOrderAmount || 0))
      );
      setLine(
        minimum > 0
          ? {
              label: "Free Delivery",
              desc: `On orders over ৳${minimum.toLocaleString()}`,
            }
          : { label: "Free Delivery", desc: "On all orders" }
      );
    });
    return () => {
      cancelled = true;
    };
  }, [product]);

  return line;
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
