"use client";

import { AlertCircle, Loader2, Minus, Plus, Trash2 } from "lucide-react";
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

  let originalPriceDisplay = null;

  if (hasActiveDiscountProduct) {
    originalPriceDisplay = (
      <span className="line-through text-muted-foreground text-sm">
        {formatCurrencyEnglish(item.product.sellingPrice)}
      </span>
    );
  }

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

  // If product is inactive, show a warning message but don't render the full item
  if (isProductInactive) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center border-b py-3 opacity-60 bg-red-50/30">
        <div className="md:col-span-2">
          <div className="aspect-[3/2] w-full overflow-hidden rounded border bg-muted relative">
            {isImageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
              </div>
            )}
            <Image
              src={item.product.attachment?.url || "/placeholder.svg"}
              alt={item.product.name}
              fill
              className="object-cover grayscale"
              sizes="(max-width: 768px) 100vw, 16vw"
              onLoad={handleImageLoad}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Unavailable
              </Badge>
            </div>
          </div>
        </div>

        <div className="md:col-span-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm text-muted-foreground">
                  {item.product.name}
                </h3>
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Inactive
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>This product is no longer available</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={isRemoving}
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 flex-shrink-0"
            >
              {isRemoving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              <span className="sr-only">Remove item</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-center border-b py-3 ${isOutOfStock ? "opacity-60" : ""}`}
    >
      {/* Product Image */}
      <div className="md:col-span-2">
        <Link
          href={`/product/${item.product.slug}`}
          className="aspect-[3/2] w-full overflow-hidden rounded border bg-muted relative hover:border-primaryColor transition-colors block"
        >
          {isImageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          )}
          <Image
            src={item.product.attachment?.url || "/placeholder.svg"}
            alt={item.product.name}
            fill
            className={`object-cover ${isOutOfStock ? "grayscale" : ""}`}
            sizes="(max-width: 768px) 100vw, 16vw"
            onLoad={handleImageLoad}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Out of Stock
              </Badge>
            </div>
          )}
        </Link>
      </div>

      {/* Product Details */}
      <div className="md:col-span-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Product Name & Info */}
          <div className="md:col-span-5 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/product/${item.product.slug}`}
                className="hover:text-primaryColor transition-colors"
              >
                <h3
                  className={`font-medium text-sm ${isOutOfStock ? "text-muted-foreground" : ""}`}
                >
                  {item.product.name}
                </h3>
              </Link>
              {isOutOfStock && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Out of Stock
                </Badge>
              )}
              {isLowStock && !isOutOfStock && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-orange-600 border-orange-600"
                >
                  Low Stock ({item.product.stock} left)
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {item.product.weight && (
                <span>Weight: {Number(item.product.weight).toFixed(0)}{item.product.unit?.name || 'gm'}</span>
              )}
              {!isOutOfStock && (
                <span>Stock: {item.product.stock}</span>
              )}
            </div>

            {hasInsufficientStock && !isOutOfStock && (
              <div className="flex items-center gap-1 text-red-600 text-[11px]">
                <AlertCircle className="h-2.5 w-2.5" />
                <span>Only {item.product.stock} items available</span>
              </div>
            )}

            {isOutOfStock && (
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>Out of stock</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="md:col-span-2">
            <div className="flex flex-col">
              {originalPriceDisplay}
              <span
                className={`font-medium text-sm ${isOutOfStock ? "text-muted-foreground" : ""}`}
              >
                {formatCurrencyEnglish(discountedPrice)}
              </span>
              {hasActiveDiscountProduct && !isOutOfStock && (
                <span className="text-[11px] text-green-600">
                  Save {formatCurrencyEnglish(discountAmount)}
                </span>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleDecrement}
                disabled={isUpdating || localQuantity === 1 || isOutOfStock}
              >
                <Minus className="h-3 w-3" />
                <span className="sr-only">Decrease quantity</span>
              </Button>
              <span className="w-8 text-center text-sm font-medium">
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 mx-auto animate-spin" />
                ) : (
                  localQuantity
                )}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleIncrement}
                disabled={
                  isUpdating ||
                  isOutOfStock ||
                  localQuantity >= (item.product.stock || 0)
                }
              >
                <Plus className="h-3 w-3" />
                <span className="sr-only">Increase quantity</span>
              </Button>
            </div>
          </div>

          {/* Subtotal & Actions */}
          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <p
              className={`font-medium text-sm ${isOutOfStock ? "text-muted-foreground" : ""}`}
            >
              {formatCurrencyEnglish(discountedPrice * localQuantity)}
            </p>
            {isOutOfStock && (
              <p className="text-[11px] text-red-600">Unavailable</p>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={isRemoving}
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 flex-shrink-0"
            >
              {isRemoving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              <span className="sr-only">Remove item</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
