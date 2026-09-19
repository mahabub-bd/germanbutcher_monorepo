"use client";

import { useCartContext } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";
import type { Product } from "@/utils/types";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface AddToCartButtonProps {
  product: Product;
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({
  product,
  disabled,
  className,
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { addItem, updateItemQuantity, removeItem, cart } = useCartContext();

  // Check if product is already in cart
  const cartItem = cart?.items?.find((item) => item.product.id === product.id);
  const isInCart = !!cartItem;
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await addItem(product);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (!cartItem) return;
    if (isUpdating) return;

    // Check if requested quantity exceeds stock
    if (newQuantity > (product.stock || 0)) {
      toast.error("Insufficient stock", {
        description: `Only ${product.stock} items available`,
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateItemQuantity(cartItem.id || product.id, newQuantity);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes("stock")) {
        toast.error("Stock unavailable", {
          description: `${product.name} is out of stock`,
        });
      } else {
        toast.error("Failed to update quantity");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async () => {
    if (!cartItem) return;
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await removeItem(cartItem.id || product.id);
      toast.success("Item removed", {
        description: `${product.name} has been removed from your cart`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove item");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrement = () => {
    if (quantity >= (product.stock || 0)) {
      toast.error("Maximum stock reached", {
        description: `Only ${product.stock} items available`,
      });
      return;
    }
    handleUpdateQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity === 1) {
      // Remove item from cart when quantity is 1
      handleRemoveItem();
    } else {
      handleUpdateQuantity(quantity - 1);
    }
  };

  // Out of Stock State
  if (disabled) {
    return (
      <Button
        className={cn(
          "w-full h-10 rounded-xl border border-gray-200 bg-gray-100 px-4 font-semibold text-gray-500 cursor-not-allowed transition-all duration-200 dark:border-gray-700",
          className
        )}
        disabled
      >
        <span className="flex items-center justify-center gap-2 text-primaryColor dark:text-red-400">
          <ShoppingCart size={16} />
          Out of Stock
        </span>
      </Button>
    );
  }

  // Already in Cart - "In Bag" pill + pill-shaped stepper
  if (isInCart) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-between gap-2",
          className
        )}
      >
        {/* In Bag indicator */}
        <div className="inline-flex h-10 items-center gap-2 rounded-lg px-4">
          <ShoppingCart size={15} className="text-primaryColor dark:text-red-400" />
          <span className="text-sm font-medium text-primaryColor dark:text-red-400">
            In Bag
          </span>
        </div>

        {/* Quantity stepper */}
        <div className="inline-flex h-10 items-center gap-1 rounded-full border border-gray-200 bg-white py-1 pl-2 pr-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <button
            onClick={handleDecrement}
            disabled={isUpdating}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
            title={quantity === 1 ? "Remove from cart" : "Decrease quantity"}
          >
            {isUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : quantity === 1 ? (
              <Trash2 className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
          </button>
          <span className="min-w-6 text-center text-sm font-bold text-gray-900 dark:text-gray-50">
            {quantity}
          </span>
          <button
            onClick={handleIncrement}
            disabled={isUpdating || quantity >= (product.stock || 0)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primaryColor text-white transition-colors hover:bg-primaryColor/90 disabled:opacity-40 dark:bg-red-700 dark:hover:bg-red-600"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Not in Cart - Show Add to Cart Button
  return (
    <Button
      className={cn(
        "w-full h-10 rounded-xl bg-primaryColor px-4 font-semibold text-white transition-all duration-200 transform hover:bg-primaryColor/90 hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none group md:text-base cursor-pointer dark:bg-red-700 dark:hover:bg-red-600",
        className
      )}
      onClick={handleAddToCart}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Adding to Cart...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <Plus
            size={16}
            className="group-hover:rotate-90 transition-transform duration-200"
          />
          Add to Cart
        </span>
      )}
    </Button>
  );
}
