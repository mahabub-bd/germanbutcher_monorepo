"use client";

import { Shop } from "@/utils/types";
import { MapPin, Navigation, Phone } from "lucide-react";
import Image from "next/image";

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function ActionButtons({
  address,
  contactNumber,
  compact = false,
}: {
  address: string;
  contactNumber?: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${compact ? "mt-auto pt-3" : "mt-4"}`}>
      <a
        href={mapsUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primaryColor px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primaryColor/90"
      >
        <Navigation className="size-3.5" />
        Get Directions
      </a>
      {contactNumber && (
        <a
          href={`tel:${contactNumber}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primaryColor/40 px-3 py-2 text-xs font-medium text-primaryColor transition-colors hover:bg-primaryColor/5"
        >
          <Phone className="size-3.5" />
          Contact
        </a>
      )}
    </div>
  );
}

function ShopAddress({ shop }: { shop: Shop }) {
  return (
    <div className="flex items-start gap-1.5 text-xs text-gray-500">
      <MapPin className="mt-0.5 size-3.5 shrink-0 text-primaryColor/70" />
      <p className="line-clamp-3">
        {shop.address}, {shop.district}
      </p>
    </div>
  );
}

/**
 * Card image: the brand banner when one is uploaded, otherwise the logo
 * on a soft backdrop, otherwise the brand initial.
 */
function BrandImage({
  bannerUrl,
  logoUrl,
  name,
  className = "h-40 w-full",
}: {
  bannerUrl?: string;
  logoUrl?: string;
  name: string;
  className?: string;
}) {
  return (
    <div className={`relative bg-linear-to-br from-gray-100 to-rose-50 ${className}`}>
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className="object-cover"
        />
      ) : logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className="object-contain p-6"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-3xl font-bold text-primaryColor/30">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}

/** Compact grid card for all branches. */
export function ShopCard({
  shop,
  logoUrl,
  bannerUrl,
  contactNumber,
}: {
  shop: Shop;
  logoUrl?: string;
  bannerUrl?: string;
  contactNumber?: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Banner image (fallback: brand logo) */}
      <div className="relative">
        <BrandImage bannerUrl={bannerUrl} logoUrl={logoUrl} name={shop.shopName} />
        {!bannerUrl && logoUrl && (
          <div className="absolute bottom-2 left-2 rounded-lg bg-white p-1 shadow-sm">
            <Image
              src={logoUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h4 className="mb-2 truncate text-sm font-bold uppercase tracking-wide text-gray-900">
          {shop.shopName}
        </h4>

        <ShopAddress shop={shop} />

        <ActionButtons
          address={`${shop.address}, ${shop.district}`}
          contactNumber={contactNumber}
          compact
        />
      </div>
    </div>
  );
}
