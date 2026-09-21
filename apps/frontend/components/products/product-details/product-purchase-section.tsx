"use client";

import { Facebook, Linkedin } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { AddToWishlistButton } from "@/components/wishlist/add-to-wishlist-button";
import { useCartContext } from "@/contexts/cart-context";
import { hasActiveDiscount } from "@/utils/product-utils";
import type { Product, User } from "@/utils/types";
import { Loader2, Link2, Mail, MessageCircle, Minus, Plus, Share2, ShoppingCart, Zap } from "lucide-react";
import {
  EmailShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
} from "next-share";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProductPurchaseSectionProps {
  product: Product;
  user: User;
}

export function ProductPurchaseSection({
  product,
  user,
}: ProductPurchaseSectionProps) {


  const { addItem, updateItemQuantity, cart } = useCartContext();
  const router = useRouter();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Check if product is already in cart
  const cartItem = cart?.items?.find((item) => item.product.id === product.id);
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;

  // Use cart quantity if item is in cart, otherwise default to 1
  const [quantity, setQuantity] = useState(isInCart ? cartQuantity : 1);

  // Sync quantity with cart when cart changes
  useEffect(() => {
    if (isInCart && cartQuantity !== quantity) {
      setQuantity(cartQuantity);
    }
  }, [isInCart, cartQuantity]);

  const discountAmount = hasActiveDiscount(product)
    ? product.discountType === "fixed"
      ? Number.parseFloat(String(product.discountValue ?? "0"))
      : (product.sellingPrice *
        Number.parseFloat(String(product.discountValue ?? "0"))) /
      100
    : 0;

  const finalPrice = product.sellingPrice - discountAmount;

  const incrementQuantity = async () => {
    if (quantity >= product.stock) {
      toast.error("Maximum stock reached", {
        description: `Only ${product.stock} items available`,
      });
      return;
    }

    const newQuantity = quantity + 1;

    if (isInCart && cartItem) {
      // Update cart if already in cart
      setIsUpdating(true);
      try {
        await updateItemQuantity(cartItem.id || product.id, newQuantity);
        setQuantity(newQuantity);
      } catch (error) {
        console.error("Error updating quantity:", error);
        toast.error("Failed to update quantity");
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Just update local state if not in cart
      setQuantity(newQuantity);
    }
  };

  const decrementQuantity = async () => {
    if (quantity <= 1) {
      toast.error("Minimum quantity is 1");
      return;
    }

    const newQuantity = quantity - 1;

    if (isInCart && cartItem) {
      // Update cart if already in cart
      setIsUpdating(true);
      try {
        await updateItemQuantity(cartItem.id || product.id, newQuantity);
        setQuantity(newQuantity);
      } catch (error) {
        console.error("Error updating quantity:", error);
        toast.error("Failed to update quantity");
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Just update local state if not in cart
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      if (isInCart && cartItem) {
        // If already in cart, update the quantity
        const newQuantity = cartQuantity + quantity;
        if (newQuantity > product.stock) {
          toast.error("Insufficient stock", {
            description: `Only ${product.stock} items available`,
          });
          return;
        }
        await updateItemQuantity(cartItem.id || product.id, newQuantity);
        toast.success("Cart updated", {
          description: `Quantity updated to ${newQuantity}`,
        });
      } else {
        // Add new item with specified quantity
        for (let i = 0; i < quantity; i++) {
          await addItem(product);
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error instanceof Error && error.message.includes("stock")) {
        toast.error("Stock unavailable", {
          description: `${product.name} is out of stock`,
        });
      } else {
        toast.error("Failed to add to cart");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    setIsBuyingNow(true);
    try {
      if (isInCart && cartItem) {
        // Ensure cart matches the selected quantity, then go to checkout
        if (cartQuantity !== quantity) {
          await updateItemQuantity(cartItem.id || product.id, quantity);
        }
      } else {
        await addItem(product, quantity);
      }
      router.push("/checkout");
    } catch (error) {
      console.error("Error buying now:", error);
      if (error instanceof Error && error.message.includes("stock")) {
        toast.error("Stock unavailable", {
          description: `${product.name} is out of stock`,
        });
      } else {
        toast.error("Failed to proceed to checkout");
      }
    } finally {
      setIsBuyingNow(false);
    }
  };

  // Share functionality
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/product/${product.slug}`
      : "";
  const shareTitle = `Check out ${product.name} on Our Store`;
  const shareBody = `${product.name} - ${product.description}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="space-y-4">
      {/* In Cart Indicator */}
      {isInCart && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <ShoppingCart size={16} className="text-green-600" />
          <span className="text-sm font-medium text-green-700">
            {cartQuantity} {cartQuantity === 1 ? "item" : "items"} already in
            your cart
          </span>
        </div>
      )}

      {/* Quantity + Total Price — one line on all screens */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 rounded-xl bg-red-50/50 border border-red-100 p-3 md:p-4">
        <div className="pr-3 md:pr-4">
          <p className="text-xs text-gray-500 mb-2">Quantity</p>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={decrementQuantity}
              disabled={quantity <= 1 || isUpdating || isAddingToCart}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border-gray-300 hover:border-primaryColor hover:text-primaryColor"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <div className="min-w-10 sm:min-w-12 text-center text-sm sm:text-base font-semibold text-gray-900">
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mx-auto animate-spin" />
              ) : (
                quantity
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={incrementQuantity}
              disabled={
                quantity >= product.stock || isUpdating || isAddingToCart
              }
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primaryColor text-white border-primaryColor hover:bg-primaryColor/90 hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="pl-3 md:pl-4">
          <p className="text-xs text-gray-500 mb-1">Total Price</p>
          <p className="text-xl sm:text-2xl font-bold text-primaryColor">
            ৳{(finalPrice * quantity).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-3">
        <Button
          variant="outline"
          className="w-full h-10 sm:h-11 border-primaryColor text-primaryColor bg-white hover:bg-red-50 hover:text-primaryColor rounded-lg text-sm sm:text-base font-semibold shadow-sm"
          disabled={product.stock === 0 || isAddingToCart || isUpdating}
          onClick={handleAddToCart}
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              {isInCart ? "Updating..." : "Adding..."}
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {isInCart ? "Update Cart" : "Add to Cart"}
            </>
          )}
        </Button>

        <Button
          className="w-full h-10 sm:h-11 bg-primaryColor hover:bg-primaryColor/90 text-white rounded-lg text-sm sm:text-base font-semibold shadow-sm"
          disabled={product.stock === 0 || isBuyingNow || isUpdating}
          onClick={handleBuyNow}
        >
          {isBuyingNow ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-current" />
              Buy Now
            </>
          )}
        </Button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-3">
        <AddToWishlistButton
          product={product}
          user={user}
          variant="outline"
          size="sm"
          className="h-9 sm:h-10 border-gray-200 text-gray-600 hover:border-primaryColor hover:text-primaryColor rounded-lg w-full text-xs sm:text-sm"
        />

        <div className="relative">
          <Button
            variant="outline"
            className="h-9 sm:h-10 w-full border-gray-200 text-gray-600 hover:border-primaryColor hover:text-primaryColor rounded-lg text-xs sm:text-sm"
            onClick={() => setShowShareOptions(!showShareOptions)}
          >
            <Share2 className="w-4 h-4 mr-1.5 sm:mr-2" />
            Share Product
          </Button>

          {showShareOptions && (
            <div className="absolute z-10 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 right-0">
              <div className="p-2 space-y-1 flex gap-4">
                <FacebookShareButton
                  url={shareUrl}
                  quote={shareTitle}
                  className="w-full"
                >
                  <div className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                    <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                  </div>
                </FacebookShareButton>

                <WhatsappShareButton
                  url={shareUrl}
                  title={shareTitle}
                  className="w-full"
                >
                  <div className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                    <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                  </div>
                </WhatsappShareButton>

                <LinkedinShareButton url={shareUrl} className="w-full">
                  <div className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                    <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
                  </div>
                </LinkedinShareButton>

                <EmailShareButton
                  url={shareUrl}
                  subject={shareTitle}
                  body={shareBody}
                  className="w-full"
                >
                  <div className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                    <Mail className="w-4 h-4 mr-2 text-gray-600" />
                  </div>
                </EmailShareButton>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="h-9 sm:h-10 w-full border-gray-200 text-gray-600 hover:border-primaryColor hover:text-primaryColor rounded-lg text-xs sm:text-sm"
          onClick={handleCopyLink}
        >
          <Link2 className="w-4 h-4 mr-1.5 sm:mr-2" />
          Copy Link
        </Button>
      </div>
    </div>
  );
}
