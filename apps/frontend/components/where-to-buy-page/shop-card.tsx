import { Shop } from "@/utils/types";
import Image from "next/image";

interface ShopCardProps {
  shop: Shop;
  logoUrl?: string;
}

export function ShopCard({ shop, logoUrl }: ShopCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Shop Header */}
      <div className="p-4 flex flex-col items-center">
        {/* Logo */}
        {logoUrl && (
          <div className="mb-3 p-2 ">
            <Image
              src={logoUrl}
              alt={`${shop.shopName} logo`}
              width={96}
              height={96}
              className="w-24 h-24 object-contain"
            />
          </div>
        )}

        {/* Shop Name */}
        <h4 className="font-semibold text-lg text-gray-800 mb-2">
          {shop.shopName}
        </h4>
      </div>

      {/* Shop Details */}
      <div className="px-4 pb-4 space-y-3">
        {/* Address Section */}
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-sm text-gray-600">
            {shop.address}, {shop.district}
          </p>
        </div>
      </div>
    </div>
  );
}
