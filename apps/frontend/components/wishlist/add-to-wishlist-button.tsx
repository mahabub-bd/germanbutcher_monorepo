"use client";

import { cn } from "@/lib/utils";
import { postData } from "@/utils/api-utils";
import type { Product, User } from "@/utils/types";
import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner"; // Assuming you're using sonner for toast notifications
import { Button } from "../ui/button";

interface AddToWishlistButtonProps {
  product: Product;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  showText?: boolean;
  user: User | null;
}

export function AddToWishlistButton({
  product,
  disabled = false,
  className,
  variant = "outline",
  size = "default",
  showText = true,
  user,
}: AddToWishlistButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  const handleAddToWishlist = async () => {
    if (isInWishlist) {
      // Optionally handle remove from wishlist
      toast.info("Item already in wishlist");
      return;
    }

    setIsLoading(true);
    try {
      await postData("wishlist/items", {
        productId: product.id,
      });

      setIsInWishlist(true);
      toast.success("Added to wishlist successfully!");
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;
      toast.error(errorMessage || "Failed to add to wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  if (disabled) {
    return (
      <Button
        className={cn(
          "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed",
          size === "sm" && "px-3 py-2",
          size === "lg" && "px-6 py-3",
          className
        )}
        variant={variant}
        size={size}
        disabled
      >
        <Heart className={cn("mr-2", size === "sm" ? "w-3 h-3" : "w-4 h-4")} />
        {showText && "Unavailable"}
      </Button>
    );
  }
  if (!user) {
    return null;
  }
  return (
    <Button
      className={cn(
        "transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group",
        variant === "outline" &&
          "border-gray-300 hover:border-primaryColor hover:text-primaryColor hover:bg-primaryColor/5",
        variant === "default" &&
          "bg-primaryColor hover:bg-primaryColor/90 text-white",
        isInWishlist &&
          variant === "outline" &&
          "border-primaryColor text-primaryColor bg-primaryColor/5",
        isInWishlist && variant === "default" && "bg-primaryColor/80",
        size === "sm" && "px-3 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-lg",
        className
      )}
      variant={variant}
      size={size}
      onClick={handleAddToWishlist}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <>
          <Loader2
            className={cn(
              "animate-spin mr-2",
              size === "sm" ? "w-3 h-3" : "w-4 h-4"
            )}
          />
          {showText && "Adding..."}
        </>
      ) : (
        <>
          <Heart
            className={cn(
              "mr-2 transition-transform duration-200 group-hover:scale-110",
              size === "sm" ? "w-3 h-3" : "w-4 h-4",
              isInWishlist ? "fill-current" : ""
            )}
          />
          {showText && (isInWishlist ? "In Wishlist" : "Add to Wishlist")}
        </>
      )}
    </Button>
  );
}

// Alternative icon-only version for space-constrained areas
// Alternative icon-only version for space-constrained areas
export function AddToWishlistIcon({
  product,
  user,
  disabled = false,
  className,
}: {
  product: Product;
  user: User | null;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <AddToWishlistButton
      product={product}
      user={user}
      disabled={disabled}
      className={cn("px-2 py-2", className)}
      variant="outline"
      size="sm"
      showText={false}
    />
  );
}

export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addToWishlist = async (productId: number) => {
    setIsLoading(true);
    try {
      await postData("wishlist/items", { productId });
      setWishlistItems((prev) => [...prev, productId]);
      toast.success("Added to wishlist!");
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlistItems.includes(productId);
  };

  return {
    addToWishlist,
    isInWishlist,
    isLoading,
    wishlistItems,
  };
}
