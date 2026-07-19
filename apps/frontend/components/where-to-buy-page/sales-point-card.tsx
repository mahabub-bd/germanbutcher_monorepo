import { SalesPoint, Shop } from "@/utils/types";
import { Store } from "lucide-react";
import { ShopCard } from "./shop-card";

interface SalesPointCardProps {
  salesPoint: SalesPoint;
}

export function SalesPointCard({ salesPoint }: SalesPointCardProps) {
  if (!salesPoint.shops?.length) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row  md:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {salesPoint.name}
        </h2>

        <div className="flex items-center text-gray-600">
          <Store className="w-5 h-5 mr-2 text-primary-500" />
          <span>Branches ({salesPoint.shops.length})</span>
        </div>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {salesPoint.shops.map((shop: Shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            logoUrl={salesPoint.logoAttachment?.url}
          />
        ))}
      </div>
    </div>
  );
}
