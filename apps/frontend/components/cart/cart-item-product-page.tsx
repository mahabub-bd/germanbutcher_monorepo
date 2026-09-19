"use client";

import {
  AlertCircle,
  Beef,
  Drumstick,
  Fish,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Snowflake,
  Tag,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/contexts/cart-context";
import { formatCurrencyEnglish } from "@/lib/utils";
import { hasActiveDiscount } from "@/utils/product-utils";
import type { CartItem } from "@/utils/types";
import type { LucideIcon } from "lucide-react";

/** Maps a tag/category label to a pill icon + color scheme, linking to the
 * products page filtered by that tag. */
function tagPill(label: string, key: number) {
  const l = label.toLowerCase();
  let Icon: LucideIcon = Tag;
  let classes =
    "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400";

  if (l.includes("frozen") || l.includes("chilled")) {
    Icon = Snowflake;
    classes = "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400";
  } else if (l.includes("beef")) {
    Icon = Beef;
  } else if (l.includes("chicken")) {
    Icon = Drumstick;
  } else if (l.includes("fish")) {
    Icon = Fish;
  }

  return (
    <Link
      key={key}
      href={`/products?tags=${encodeURIComponent(label)}`}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-opacity hover:opacity-75 ${classes}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Link>
  );
}

export function CartItemProductPage({ item }: { item: CartItem }) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { updateItemQuantity, removeItem, getDiscountedPrice } =
    useCartContext();

  const itemId = item.id || item.product.id;

  // Stock check and active status check
  const isOutOfStock = (item.product.stock || 0) === 0;
  const isProductInactive = item.product.isActive === false;
  const isLowStock =
    (item.product.stock || 0) > 0 && (item.product.stock || 0) < 5;
  const hasInsufficientStock = localQuantity > (item.product.stock || 0);

  // Discount calculations using shared utility
  const hasActiveDiscountProduct = hasActiveDiscount(item.product);
  const discountedPrice = getDiscountedPrice(item.product);
  const discountAmount = item.product.sellingPrice - discountedPrice;

  // Weight badge (weights are stored in grams unless the unit says kg)
  const weight = item.product.weight ? Number(item.product.weight) : null;
  const unitName = item.product.unit?.name || "gm";
  const weightLabel = weight ? `${weight} ${unitName}` : null;

  // Plain-text description for the single preview line
  const description = item.product.description
    ? item.product.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : "";

  // Tags for the pill row (deduped, capped)
  const pills = Array.from(
    new Set([...(item.product.tags || [])].filter(Boolean))
  ).slice(0, 3);

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity === localQuantity) return;
    if (isUpdating || isOutOfStock) return;

    // Check if requested quantity exceeds stock
    if (newQuantity > (item.product.stock || 0)) {
      toast.error("Insufficient stock", {
        description: `Only ${item.product.stock} items available`,
      });
      return;
    }

    const previousQuantity = localQuantity;
    setLocalQuantity(newQuantity);
    setIsUpdating(true);

    try {
      await updateItemQuantity(itemId, newQuantity);
    } catch (error) {
      console.error(error);
      setLocalQuantity(previousQuantity);

      // Check if error is due to stock issues
      if (error instanceof Error && error.message.includes("stock")) {
        toast.error("Stock unavailable", {
          description: `${item.product.name} is out of stock`,
        });
      } else {
        toast.error("Failed to update quantity");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrement = () => {
    if (localQuantity >= (item.product.stock || 0)) {
      toast.error("Maximum stock reached", {
        description: `Only ${item.product.stock} items available`,
      });
      return;
    }
    handleUpdateQuantity(localQuantity + 1);
  };

  const handleDecrement = () => handleUpdateQuantity(localQuantity - 1);

  const handleRemove = async () => {
    if (isRemoving) return;

    setIsRemoving(true);
    try {
      await removeItem(itemId);
      toast.success("Item removed", {
        description: `${item.product.name} has been removed from your cart`,
      });
    } catch (error) {
      console.error(error);
      setIsRemoving(false);
      toast.error("Failed to remove item");
    }
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const removeButton = (className: string) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRemove}
      disabled={isRemoving}
      className={className}
    >
      {isRemoving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      <span className="sr-only">Remove item</span>
    </Button>
  );

  // If product is inactive, show a warning message but don't render the full item
  if (isProductInactive) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50/40 p-4 opacity-80 dark:border-red-950 dark:bg-red-950/20">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted dark:border-gray-700">
          {isImageLoading && (
            <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-gray-200 dark:bg-gray-700">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          <Image
            src={item.product.attachment?.url || "/placeholder.svg"}
            alt={item.product.name}
            fill
            className="object-cover grayscale"
            sizes="64px"
            onLoad={handleImageLoad}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-medium text-muted-foreground">
              {item.product.name}
            </h3>
            <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
              Unavailable
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>This product is no longer available</span>
          </div>
        </div>

        {removeButton(
          "h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 dark:border-gray-800 dark:bg-gray-900 ${
        isOutOfStock ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        {/* Product Image */}
        <Link
          href={`/product/${item.product.slug}`}
          className="group relative block h-40 w-full shrink-0 overflow-hidden rounded-lg border bg-muted sm:h-32 sm:w-36"
        >
          {isImageLoading && (
            <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-gray-200 dark:bg-gray-700">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}
          <Image
            src={item.product.attachment?.url || "/placeholder.svg"}
            alt={item.product.name}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? "grayscale" : ""
            }`}
            sizes="(max-width: 640px) 100vw, 144px"
            onLoad={handleImageLoad}
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
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          {/* Name + Weight badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/product/${item.product.slug}`}
                className="transition-colors hover:text-primaryColor"
              >
                <h3
                  className={`line-clamp-2 text-base font-bold leading-snug text-gray-900 sm:text-lg dark:text-gray-50 ${
                    isOutOfStock ? "text-muted-foreground" : ""
                  }`}
                >
                  {item.product.name}
                </h3>
              </Link>
              {isLowStock && !isOutOfStock && (
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-3 w-3" />
                  Low Stock — only {item.product.stock} left
                </span>
              )}
            </div>

            {weightLabel && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <ShoppingBag className="h-3.5 w-3.5" />
                {weightLabel}
              </span>
            )}
          </div>

          {/* Description preview */}
          {description && (
            <p className="line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}

          {/* Tag pills */}
          {pills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pills.map((tag, i) => tagPill(tag, i))}
            </div>
          )}

          {hasInsufficientStock && !isOutOfStock && (
            <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>Only {item.product.stock} items available</span>
            </div>
          )}

          {/* Price + Quantity controls */}
          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
            {/* Unit Price */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Unit Price
              </p>
              <div className="flex items-baseline gap-2">
                {hasActiveDiscountProduct && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrencyEnglish(item.product.sellingPrice)}
                  </span>
                )}
                <span
                  className={`text-2xl font-bold text-primaryColor dark:text-red-400 ${
                    isOutOfStock ? "text-muted-foreground" : ""
                  }`}
                >
                  {formatCurrencyEnglish(discountedPrice)}
                </span>
                {hasActiveDiscountProduct && !isOutOfStock && (
                  <span className="text-[11px] font-medium text-green-600 dark:text-green-400">
                    Save {formatCurrencyEnglish(discountAmount)}
                  </span>
                )}
              </div>
            </div>

            {/* Stepper + Delete + Total Price */}
            <div className="flex items-end gap-2">
              <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={isUpdating || localQuantity === 1 || isOutOfStock}
                  className="flex h-full w-9 items-center justify-center text-gray-500 transition-colors hover:text-primaryColor disabled:opacity-40 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <Minus className="h-4 w-4" />
                  <span className="sr-only">Decrease quantity</span>
                </button>
                <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {isUpdating ? (
                    <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
                  ) : (
                    localQuantity
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={
                    isUpdating ||
                    isOutOfStock ||
                    localQuantity >= (item.product.stock || 0)
                  }
                  className="flex h-full w-9 items-center justify-center text-gray-500 transition-colors hover:text-primaryColor disabled:opacity-40 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Increase quantity</span>
                </button>
              </div>

              {/* Delete */}
              {removeButton(
                "h-10 w-10 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-destructive dark:border-gray-700 dark:text-gray-400 dark:hover:bg-red-950/40"
              )}

              {/* Total Price — same size as unit price, right of the remove button */}
              <div className="ml-2 text-right">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Total Price
                </p>
                <span
                  className={`text-2xl font-bold text-gray-900 dark:text-gray-50 ${
                    isOutOfStock ? "text-muted-foreground" : ""
                  }`}
                >
                  {formatCurrencyEnglish(discountedPrice * localQuantity)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
