"use client";

import { Product, Wishlist } from "@/utils/types";
import { Heart, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { formatCurrencyEnglish } from "../../lib/utils";
import { AddToCartButton } from "../cart/add-to-cart-button";

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
        <div className="text-center py-16">
          <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-600 mb-6">
            Start adding items you love to your wishlist!
          </p>
          <Link
            href="/products"
            className="bg-primaryColor text-white px-6 py-3 rounded-lg hover:bg-primaryColor/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto md:p-4 p-2">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-6 w-6 text-primaryColor" />
        <div className="flex items-center gap-4 sm:gap-3">
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <span className="text-sm text-muted-foreground">
            ({wishlistData.items.length}{" "}
            {wishlistData.items.length === 1 ? "item" : "items"})
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {wishlistData.items.map((item) => (
          <div
            key={item.id}
            className="flex md:flex-row flex-col gap-4 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative bg-white"
          >
            <div className="flex gap-4 min-w-0 flex-1">
              <div className="relative w-24 h-24 sm:w-36 sm:h-24 flex-shrink-0">
                <Image
                  width={400}
                  height={300}
                  src={item.product.attachment?.url || "/placeholder-image.jpg"}
                  alt={item.product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1">
                  <Link
                    href={`/product/${item.product?.slug}`}
                    className="font-semibold text-gray-900 text-lg mb-2 hover:text-primaryColor transition-colors block break-words"
                  >
                    {item.product.name}
                  </Link>
                  {item.product.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4 break-words">
                      {item.product.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-auto flex-wrap">
                    {(() => {
                      // Discount calculations
                      const now = new Date();
                      const discountStart = new Date(
                        item.product?.discountStartDate || 0
                      );
                      const discountEnd = new Date(
                        item.product?.discountEndDate || 0
                      );
                      const hasActiveDiscount =
                        item.product.discountType &&
                        item.product.discountValue &&
                        now >= discountStart &&
                        now <= discountEnd;

                      const getDiscountedPrice = (product: Product) => {
                        if (!hasActiveDiscount) return product.sellingPrice;

                        if (product.discountType === "fixed") {
                          return Math.max(
                            0,
                            product.sellingPrice - (product.discountValue ?? 0)
                          );
                        } else if (product.discountType === "percentage") {
                          return (
                            product.sellingPrice -
                            (product.sellingPrice *
                              (product.discountValue ?? 0)) /
                              100
                          );
                        }
                        return product.sellingPrice;
                      };

                      const discountedPrice = getDiscountedPrice(item.product);
                      const hasDiscount =
                        hasActiveDiscount &&
                        discountedPrice < item.product.sellingPrice;
                      const savingsAmount = hasDiscount
                        ? item.product.sellingPrice - discountedPrice
                        : 0;

                      return (
                        <>
                          <span className="text-lg font-bold text-primaryColor">
                            {formatCurrencyEnglish(discountedPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrencyEnglish(item.product.sellingPrice)}
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                              Save {formatCurrencyEnglish(savingsAmount)}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  {item.product.stock <= 0 && (
                    <span className="text-red-500 text-sm font-medium mt-2 inline-block">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex md:flex-col md:justify-center items-start md:items-center gap-2 md:gap-3 flex-shrink-0">
              <AddToCartButton
                product={item.product}
                disabled={item.product.stock === 0}
                className="inline-flex"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveFromWishlist(item.id)}
                className="px-4 py-2 text-gray-500 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-colors"
                aria-label="Remove from wishlist"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Remove</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistSection;
