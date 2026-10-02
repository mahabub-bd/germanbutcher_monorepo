"use client";

import { SalesPoint, Shop } from "@/utils/types";
import { ArrowRight, Store } from "lucide-react";
import { useState } from "react";
import { ShopCard } from "./shop-card";

interface SalesPointCardProps {
  salesPoint: SalesPoint;
}

/** Branches shown before "View All" — matches the reference design. */
const PREVIEW_COUNT = 5;

/** Brands sometimes store placeholder numbers ("N/A") — don't offer those. */
function usablePhone(number?: string | null): string | undefined {
  if (!number) return undefined;
  const cleaned = number.trim();
  if (!cleaned || /^n\/?a$/i.test(cleaned)) return undefined;
  return cleaned;
}

export function SalesPointCard({ salesPoint }: SalesPointCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!salesPoint.shops?.length) return null;

  const contactNumber = usablePhone(salesPoint.contactNumber);
  const logoUrl = salesPoint.logoAttachment?.url;
  const bannerUrl = salesPoint.bannerAttachment?.url;
  const shops = salesPoint.shops;
  const visibleShops = expanded ? shops : shops.slice(0, PREVIEW_COUNT);

  return (
    <section className="space-y-4">
      {/* Brand header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">{salesPoint.name}</h2>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Store className="size-4 text-primaryColor" />
            <span>Branches ({shops.length})</span>
          </div>
        </div>

        {shops.length > PREVIEW_COUNT && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primaryColor transition-colors hover:text-primaryColor/80"
          >
            {expanded ? "Show Less" : `View All`}
            <ArrowRight
              className={`size-4 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Branch cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {visibleShops.map((shop: Shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            logoUrl={logoUrl}
            bannerUrl={bannerUrl}
            contactNumber={contactNumber}
          />
        ))}
      </div>
    </section>
  );
}
