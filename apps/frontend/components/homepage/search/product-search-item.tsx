"use client";

import { formatCurrencyEnglish } from "@/lib/utils";
import {
  getDiscountedPrice,
  getStockStatus,
  hasActiveDiscount,
} from "@/utils/product-utils";
import type { Product } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";

interface ProductSearchItemProps {
  product: Product;
  onClose: () => void;
}

export function ProductSearchItem({
  product,
  onClose,
}: ProductSearchItemProps) {
  const isDiscounted = hasActiveDiscount(product);
  const currentPrice = getDiscountedPrice(product);
  const originalPrice = product.sellingPrice;
  const stockStatus = getStockStatus(product.stock);

  return (
    <Link
      href={`/product/${product.slug}`}
      onClick={onClose}
      className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 border-b rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 group border border-transparent hover:border-gray-200"
    >
      {/* Image Container - 16:9 Aspect Ratio */}
      <div className="relative w-20 sm:w-28 md:w-32 aspect-video bg-gray-100 rounded-md sm:rounded-lg overflow-hidden shrink-0">
        <Image
          src={product.attachment?.url || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Gradient overlay for badges on mobile */}
        {(product.isFeatured || isDiscounted) && (
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent sm:hidden" />
        )}

        {/* Mobile Badge Indicators */}
        <div className="absolute bottom-1 left-1 flex gap-1 sm:hidden">
          {product.isFeatured && (
            <span className="text-[8px] bg-yellow-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm">
              ⭐
            </span>
          )}
          {isDiscounted && (
            <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm">
              🏷️
            </span>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Product Name */}
        <h3 className="font-medium text-xs sm:text-sm md:text-base text-gray-900 line-clamp-2 group-hover:text-primaryColor transition-colors leading-snug">
          {product.name}
        </h3>

        {/* Price Row */}
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="font-bold text-sm sm:text-base md:text-lg text-primaryColor">
            {formatCurrencyEnglish(currentPrice)}
          </span>
          {isDiscounted && (
            <span className="text-[10px] sm:text-xs text-gray-500 line-through">
              {formatCurrencyEnglish(originalPrice)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {stockStatus && (
          <p
            className={`text-[10px] sm:text-xs font-medium ${stockStatus.className}`}
          >
            {stockStatus.message}
          </p>
        )}
      </div>

      {/* Desktop Badges */}
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
        {product.isFeatured && (
          <span className="text-[10px] md:text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium whitespace-nowrap">
            ⭐ Featured
          </span>
        )}
        {isDiscounted && (
          <span className="text-[10px] md:text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium whitespace-nowrap">
            🏷️ Sale
          </span>
        )}
      </div>
    </Link>
  );
}
