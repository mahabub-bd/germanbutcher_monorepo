"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrencyEnglish, formatWeight } from "@/lib/utils";
import type { Product } from "@/utils/types";
import { DiscountType } from "@/utils/types";
import { Clock, Weight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AddToCartButton } from "../cart/add-to-cart-button";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(endDate: Date): TimeRemaining {
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const difference = end - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    isExpired: false,
  };
}

export default function ProductCard({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const isDiscountActive =
    product.discountType &&
    product.discountValue &&
    product.discountStartDate &&
    product.discountEndDate &&
    new Date() >= new Date(product.discountStartDate) &&
    new Date() <= new Date(product.discountEndDate);

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null
  );

  useEffect(() => {
    if (!isDiscountActive || !product.discountEndDate) return;

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining(new Date(product.discountEndDate)));

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(
        new Date(product.discountEndDate!)
      );
      setTimeRemaining(remaining);

      // Clear interval if expired
      if (remaining.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDiscountActive, product.discountEndDate]);

  const discountedPrice =
    isDiscountActive && product.discountType && product.discountValue
      ? product.discountType === DiscountType.PERCENTAGE
        ? product.sellingPrice -
          product.sellingPrice * (product.discountValue / 100)
        : product.sellingPrice - (product.discountValue || 0)
      : null;

  const isOutOfStock = !product?.stock;

  return (
    <div
      className={`group relative bg-gray-100 rounded-sm border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-500 overflow-hidden ${className}`}
    >
      <Link href={`/product/${product?.slug}`} className="block">
        {/* Image Container */}
        <div className="w-full aspect-3/2 bg-gray-100 overflow-hidden relative mb-3">
          {product?.attachment?.url && (
            <Image
              src={product.attachment.url}
              alt={product.name}
              title={product.name}
              fill
              className={`object-cover transition-all duration-300 group-hover:scale-105 ${
                isOutOfStock ? "grayscale" : ""
              }`}
              loading="lazy"
              sizes="(max-width: 768px) 260px, (max-width: 1024px) 280px, 320px"
            />
          )}
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
          {/* Discount Badge */}

          {isDiscountActive &&
            product.discountType &&
            product.discountValue && (
              <div className="absolute top-0.5 right-0.5 z-10">
                <div className="relative w-18 h-18 animate-[spin_3s_linear_infinite]">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-primaryColor/30 animate-[spin_4s_linear_infinite_reverse]"></div>

                  {/* Main badge with 3D effect */}
                  <div className="absolute inset-2 bg-linear-to-br from-red-800 via-primaryColor to-orange-800 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)] transform hover:scale-110 transition-transform duration-300">
                    {/* Inner shine effect */}
                    <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent rounded-full"></div>
                  </div>

                  {/* Content - counter-rotate to keep text upright */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white animate-[spin_3s_linear_infinite_reverse]">
                    <div className="text-[13px] leading-none font-black drop-shadow-lg">
                      {product.discountType === DiscountType.PERCENTAGE
                        ? `${parseFloat(product.discountValue.toString())}%`
                        : `৳${parseFloat(product.discountValue.toString())}`}
                    </div>
                    <span className="text-[13px] uppercase tracking-wider font-bold mt-0.5">
                      OFF
                    </span>
                  </div>
                </div>
              </div>
            )}
          {/* Discount Countdown Timer - Top Left */}
          {isDiscountActive && timeRemaining && !timeRemaining.isExpired && (
            <div className="absolute top-1 left-1 z-10">
              <div className="bg-black/60 backdrop-blur-sm rounded-sm px-2 py-1 shadow-lg">
                <div className="flex items-center gap-1 text-white text-xs font-bold">
                  <Clock size={10} />
                  {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                  {String(timeRemaining.hours).padStart(2, "0")}:
                  {String(timeRemaining.minutes).padStart(2, "0")}:
                  {String(timeRemaining.seconds).padStart(2, "0")}
                </div>
              </div>
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
                {formatCurrencyEnglish(discountedPrice || product.sellingPrice)}
              </span>
              {discountedPrice && (
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
