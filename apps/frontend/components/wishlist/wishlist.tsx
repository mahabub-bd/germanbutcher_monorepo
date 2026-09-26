"use client";

import { Heart, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrencyEnglish } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/utils/image-fallback";
import {
  getDiscountedPrice,
  hasActiveDiscount,
} from "@/utils/product-utils";
import type { Product, Wishlist } from "@/utils/types";

interface WishlistSectionProps {
  wishlistData?: Wishlist;
  onRemoveItem?: (itemId: number) => Promise<void>;
}

const WishlistSection = ({
  wishlistData,
  onRemoveItem,
}: WishlistSectionProps) => {
  const handleRemoveFromWishlist = async (itemId: number) => {
    if (onRemoveItem) {
      try {
        await onRemoveItem(itemId);
      } catch (error) {
        console.error("Failed to remove item from wishlist:", error);
      }
    }
  };

  if (!wishlistData || wishlistData.items.length === 0) {
    return (
      <div className="mx-auto px-4 py-8">
        <div className="py-16 text-center">
          <Heart className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-50">
            Your wishlist is empty
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Start adding items you love to your wishlist!
          </p>
          <Link
            href="/products"
            className="inline-block rounded-lg bg-primaryColor px-6 py-3 text-white transition-colors hover:bg-primaryColor/90"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = wishlistData.items.length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primaryColor dark:bg-red-950/40 dark:text-red-400">
          <Heart className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-50">
            My Wishlist
          </h1>
          <p className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"} saved
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        {wishlistData.items.map((item) => (
          <WishlistItemCard
            key={item.id}
            item={item}
            onRemove={() => handleRemoveFromWishlist(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface WishlistItemCardProps {
  item: Wishlist["items"][number];
  onRemove: () => void;
}

function WishlistItemCard({ item, onRemove }: WishlistItemCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const product: Product = item.product;
  const isOutOfStock = (product.stock || 0) === 0;

  // Discount calculations via the shared product utils
  const activeDiscount = hasActiveDiscount(product);
  const discountedPrice = getDiscountedPrice(product);
  const savingsAmount = activeDiscount
    ? product.sellingPrice - discountedPrice
    : 0;

  // Plain-text description for the single preview line
  const description = product.description
    ? product.description
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";

  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 dark:border-gray-800 dark:bg-gray-900 ${
        isOutOfStock ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        {/* Product Image */}
        <Link
          href={`/product/${product.slug}`}
          className="group relative block h-40 w-full shrink-0 overflow-hidden rounded-lg border bg-muted sm:h-32 sm:w-36"
        >
          {isImageLoading && (
            <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-gray-200 dark:bg-gray-700">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}
          <Image
            src={product.attachment?.url || FALLBACK_IMAGE}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? "grayscale" : ""
            }`}
            sizes="(max-width: 640px) 100vw, 144px"
            onLoad={() => setIsImageLoading(false)}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                Out of Stock
              </Badge>
            </div>
          )}
        </Link>

        {/* Product Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Link
            href={`/product/${product.slug}`}
            className="transition-colors hover:text-primaryColor"
          >
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900 sm:text-lg dark:text-gray-50">
              {product.name}
            </h3>
          </Link>

          {description && (
            <p className="line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}

          {/* Price */}
          <div className="flex flex-wrap items-baseline gap-2">
            {activeDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrencyEnglish(product.sellingPrice)}
              </span>
            )}
            <span className="text-2xl font-bold text-primaryColor dark:text-red-400">
              {formatCurrencyEnglish(discountedPrice)}
            </span>
            {activeDiscount && savingsAmount > 0 && (
              <span className="text-[11px] font-medium text-green-600 dark:text-green-400">
                Save {formatCurrencyEnglish(savingsAmount)}
              </span>
            )}
          </div>

          {/* Actions — own row so nothing overlaps on narrow screens */}
          <div className="mt-auto flex items-center gap-2 pt-1">
            <AddToCartButton
              product={product}
              disabled={isOutOfStock}
              className="w-auto flex-1 sm:w-40 sm:flex-none"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={onRemove}
              aria-label="Remove from wishlist"
              className="h-10 w-10 shrink-0 rounded-lg text-gray-500 hover:bg-red-50 hover:text-destructive dark:border-gray-700 dark:text-gray-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WishlistSection;
