"use client";

import { Facebook, Linkedin } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddToWishlistButton } from "@/components/wishlist/add-to-wishlist-button";
import { useCartContext } from "@/contexts/cart-context";
import { hasActiveDiscount } from "@/utils/product-utils";
import type { Product, User } from "@/utils/types";
import { Loader2, Mail, MessageCircle, Minus, Plus, Share2, ShoppingCart } from "lucide-react";
import {
  EmailShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
} from "next-share";
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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
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

  // Share functionality
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/products/${product.slug}`
      : "";
  const shareTitle = `Check out ${product.name} on Our Store`;
  const shareBody = `${product.name} - ${product.description}`;

  return (
    <div className="bg-white rounded-md md:p-6 p-4 shadow-sm border">
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

        {/* Quantity Selector */}
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={decrementQuantity}
                disabled={quantity <= 1 || isUpdating || isAddingToCart}
                className="h-8 w-8 rounded-l-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="px-2 py-1 font-semibold text-base min-w-4 text-center bg-white border-x border-gray-200">
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                ) : (
                  quantity
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={incrementQuantity}
                disabled={
                  quantity >= product.stock || isUpdating || isAddingToCart
                }
                className="h-8 w-8 rounded-r-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Unit Price:</span>
            <span className="font-medium">৳{finalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Quantity:</span>
            <span className="font-medium">{quantity}</span>
          </div>
          {isInCart && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Cart:</span>
              <span className="font-medium text-green-600">{cartQuantity}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total:</span>
            <span className="text-xl font-bold text-primaryColor">
              ৳{(finalPrice * quantity).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 grid md:grid-cols-2 grid-cols-1 gap-8">
          <Button
            className="w-full bg-linear-to-r from-primaryColor to-secondaryColor hover:from-secondaryColor hover:to-primaryColor text-white py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            disabled={product.stock === 0 || isAddingToCart || isUpdating}
            onClick={handleAddToCart}
          >
            {isAddingToCart ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {isInCart ? "Updating Cart..." : "Adding to Cart..."}
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isInCart ? "Update Cart" : "Add to Cart"}
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <AddToWishlistButton
              product={product}
              user={user}
              variant="outline"
              className="py-3 border-gray-300 hover:border-primaryColor hover:text-primaryColor"
            />

            <div className="relative">
              <Button
                variant="outline"
                className="py-3 border-gray-300 hover:border-primaryColor hover:text-primaryColor w-full"
                onClick={() => setShowShareOptions(!showShareOptions)}
              >
                <Share2 className="w-4 h-4 mr-2" />
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
          </div>
        </div>
      </div>
    </div>
  );
}
