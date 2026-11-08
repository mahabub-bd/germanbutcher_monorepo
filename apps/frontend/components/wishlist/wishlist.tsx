"use client";

import { Heart, Trash2 } from "lucide-react";
import Link from "next/link";

import ProductCard from "@/components/products/product-card";
import { AccountPageHeader } from "@/components/user-account/account-page-header";
import type { Wishlist } from "@/utils/types";

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
      <div className="mx-auto px-4 py-6 sm:py-8">
        <div className="py-10 sm:py-16 text-center">
          <Heart className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600" />
          <h2 className="mb-1.5 sm:mb-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
            Your wishlist is empty
          </h2>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Start adding items you love to your wishlist!
          </p>
          <Link
            href="/products"
            className="inline-block rounded-lg bg-primaryColor px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base text-white transition-colors hover:bg-primaryColor/90"
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
      <AccountPageHeader
        title="My Wishlist"

        subtitle={`${itemCount} ${itemCount === 1 ? "item" : "items"} saved`}
      />

      {/* Items — same grid as the homepage product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-5">
        {wishlistData.items.map((item) => (
          <div key={item.id} className="relative">
            <ProductCard product={item.product} className="h-full" />
            <button
              type="button"
              onClick={() => handleRemoveFromWishlist(item.id)}
              aria-label="Remove from wishlist"
              className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 text-gray-500 shadow-md transition-colors hover:bg-red-50 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistSection;
