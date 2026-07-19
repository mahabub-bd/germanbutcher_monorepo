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
          "w-full md:py-1 py-0 border-primaryColor border px-4 bg-gray-100 text-gray-800 rounded-sm font-semibold cursor-not-allowed transition-all duration-200 h-10",
          className
        )}
        disabled
      >
        <span className="flex items-center justify-center gap-2 text-primaryColor">
          <ShoppingCart size={16} />
          Out of Stock
        </span>
      </Button>
    );
  }

  // Already in Cart - Show Quantity Controls
  if (isInCart) {
    return (
      <div
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-sm h-10",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={14} className="text-green-600" />
          <span className="text-xs font-medium text-green-700">In Bag</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDecrement}
            disabled={isUpdating}
            className="h-6 w-6 rounded-full border border-primaryColor bg-white flex items-center justify-center text-xs disabled:opacity-50 hover:bg-primaryColor hover:text-white transition-colors"
            title={quantity === 1 ? "Remove from cart" : "Decrease quantity"}
          >
            {quantity === 1 ? (
              <Trash2 className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
          </button>
          <span className="text-sm font-semibold w-6 text-center">
            {isUpdating ? (
              <Loader2 className="h-3 w-3 mx-auto animate-spin" />
            ) : (
              quantity
            )}
          </span>
          <button
            onClick={handleIncrement}
            disabled={isUpdating || quantity >= (product.stock || 0)}
            className="h-6 w-6 rounded-full border border-primaryColor bg-white flex items-center justify-center text-xs disabled:opacity-50 hover:bg-primaryColor hover:text-white transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  // Not in Cart - Show Add to Cart Button
  return (
    <Button
      className={cn(
        "w-full md:py-1 py-0 px-4 bg-primaryColor hover:bg-primaryColor/90 text-white rounded-sm font-semibold transition-all duration-200 transform hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none group md:text-md cursor-pointer h-10",
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
