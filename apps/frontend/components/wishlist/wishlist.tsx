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
      <AccountPageHeader
        title="My Wishlist"

        subtitle={`${itemCount} ${itemCount === 1 ? "item" : "items"} saved`}
      />

      {/* Items — same grid as the homepage product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
        {wishlistData.items.map((item) => (
          <div key={item.id} className="relative">
            <ProductCard product={item.product} className="h-full" />
            <button
              type="button"
              onClick={() => handleRemoveFromWishlist(item.id)}
              aria-label="Remove from wishlist"
              className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-500 shadow-md transition-colors hover:bg-red-50 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistSection;
