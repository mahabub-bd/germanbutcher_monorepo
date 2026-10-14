"use client";

import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/common/countdown-timer";
import { formatCurrencyEnglish, formatWeight } from "@/lib/utils";
import type { Product } from "@/utils/types";
import { FALLBACK_IMAGE } from "@/utils/image-fallback";
import { DiscountType } from "@/utils/types";
import {

  getEffectivePrice,
  hasProductDiscount,
  isFlashSaleActive,
} from "@/utils/product-utils";
import { Truck, Weight, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "../cart/add-to-cart-button";
import { useProductFreeDelivery } from "@/hooks/use-product-free-delivery";

export default function ProductCard({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const isDiscountActive = hasProductDiscount(product);
  const flashActive = isFlashSaleActive(product);
  const flash = flashActive ? product.flashSale : null;

  const effectivePrice = getEffectivePrice(product);
  const hasPriceDrop = effectivePrice < product.sellingPrice;

  const isOutOfStock = !product?.stock;
  const hasFreeDelivery = useProductFreeDelivery(product);

  return (
    <div
      className={`group relative bg-gray-100 rounded-sm border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-500 overflow-hidden ${className}`}
    >
      <Link href={`/product/${product?.slug}`} className="block">
        {/* Image Container */}
        <div className="w-full aspect-3/2 bg-gray-100 overflow-hidden relative mb-3">
          <Image
            src={product?.attachment?.url || FALLBACK_IMAGE}
            alt={product.name}
            title={product.name}
            fill
            className={`object-cover transition-all duration-300 group-hover:scale-105 ${
              isOutOfStock ? "grayscale" : ""
            }`}
            loading="lazy"
            sizes="(max-width: 768px) 260px, (max-width: 1024px) 280px, 320px"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Badge
                variant="destructive"
                className="text-sm font-semibold px-4 py-2 rounded-full"
              >
                Out of Stock
              </Badge>
            </div>
          )}
          {/* Flash Sale Badge — overrides the per-product discount badge */}
          {flashActive && flash && (
            <div className="absolute top-1 right-1 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm">
                <Zap size={10} className="fill-current" />
                Flash Sale
              </span>
            </div>
          )}
          {/* Per-product Discount Badge */}
          {!flashActive && isDiscountActive && (
            <div className="absolute top-1 right-1 z-10">
              <div className="relative w-12 h-12 animate-[spin_3s_linear_infinite]">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-primaryColor/30 animate-[spin_4s_linear_infinite_reverse]"></div>

                {/* Main badge with 3D effect */}
                <div className="absolute inset-1.5 bg-linear-to-br from-red-800/80 via-primaryColor/80 to-orange-800/80 backdrop-blur-sm rounded-full shadow-[0_0_12px_rgba(239,68,68,0.5)] transform hover:scale-110 transition-transform duration-300">
                  {/* Inner shine effect */}
                  <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent rounded-full"></div>
                </div>

                {/* Content - counter-rotate to keep text upright */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white animate-[spin_3s_linear_infinite_reverse]">
                  <div className="text-[10px] leading-none font-black drop-shadow-lg">
                    {product.discountType === DiscountType.PERCENTAGE
                      ? `${parseFloat(String(product.discountValue))}%`
                      : `৳${parseFloat(String(product.discountValue))}`}
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5">
                    OFF
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Discount Countdown Timer - Top Left */}
          {(flashActive || isDiscountActive) && (
            <div className="absolute top-1 left-1 z-10">
              <CountdownTimer
                endsAt={
                  flashActive
                    ? product.flashSale?.endsAt
                    : product.discountEndDate
                }
              />
            </div>
          )}
          {/* Free Delivery Badge - Bottom Left */}
          {hasFreeDelivery && !isOutOfStock && (
            <div className="absolute bottom-1.5 left-1.5 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm">
                <Truck className="w-3 h-3" />
                Free Delivery
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-1 md:p-2 lg:p-2 flex flex-col gap-2">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 md:text-base text-sm leading-tight line-clamp-2 group-hover:text-primaryColor transition-colors duration-200">
            {product.name}
          </h3>

          {/* Price and Weight Row */}
          <div className="flex items-center justify-between">
            {/* Price Section */}
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primaryColor">
                {formatCurrencyEnglish(effectivePrice)}
              </span>
              {hasPriceDrop && (
                <span className="text-sm text-gray-600 line-through">
                  {formatCurrencyEnglish(product.sellingPrice)}
                </span>
              )}
            </div>

            {/* Weight Display */}
            {product?.weight && product?.unit?.name && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">
                <Weight size={12} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-600">
                  {formatWeight(product.weight, product.unit.name)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <div className="lg:p-3 p-3">
        <AddToCartButton
          product={product}
          disabled={isOutOfStock}
          className="w-full"
        />
      </div>
    </div>
  );
}
