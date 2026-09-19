"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Headphones,
  Info,
  ShieldCheck,
  ShoppingCart,
  Ticket,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCartContext } from "@/contexts/cart-context";
import { formatCurrencyEnglish } from "@/lib/utils";
import type { Cart, CartItem } from "@/utils/types";
import { CartItemProductPage } from "./cart-item-product-page";
import { EmptyCart } from "./empty-cart";

export function CartPage({ cart }: { cart?: Cart }) {
  const {
    clearCart,
    getCartTotals,
    appliedCoupon,
    applyCoupon: applyCartCoupon,
    removeCoupon,
    removeInactiveProducts,
  } = useCartContext();
  const [isRemovingAll, setIsRemovingAll] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const { itemCount, originalSubtotal, discountedSubtotal, productDiscounts } =
    getCartTotals();
  const total = discountedSubtotal - (appliedCoupon?.discount || 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      await applyCartCoupon(couponCode, discountedSubtotal);
      setCouponCode("");
    } catch (error) {
      console.error(error);
      // Error is already handled in the context
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode("");
  };

  const handleCheckout = async () => {
    // Remove inactive products before proceeding to checkout
    await removeInactiveProducts();
  };

  const handleRemoveAll = async () => {
    if (!cart?.items?.length) return;
    setIsRemovingAll(true);
    try {
      await clearCart();
      toast.success("Cart cleared", {
        description: "All items removed from your cart",
      });
    } catch (error) {
      console.error(error);
      toast.error("Error", {
        description: "Something went wrong",
      });
    } finally {
      setIsRemovingAll(false);
    }
  };
  return (
    <div className="container mx-auto grid grid-cols-1 items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-3 lg:gap-8 lg:px-8 lg:py-8">
      {/* Main Cart Content */}
      <div className="lg:col-span-2">
        {/* Cart Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primaryColor dark:bg-red-950/40">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-50">
                Your Cart
              </h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>

          {itemCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveAll}
              disabled={isRemovingAll}
              className="h-10 gap-2 rounded-lg bg-red-50 px-4 text-sm font-medium text-primaryColor hover:bg-red-100 hover:text-primaryColor dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
            >
              {isRemovingAll ? (
                "Clearing..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Clear Cart
                </>
              )}
            </Button>
          )}
        </div>

        {/* Cart Items */}
        {itemCount > 0 ? (
          <div className="space-y-4">
            {cart?.items.map((item: CartItem) => (
              <CartItemProductPage key={item.product?.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyCart />
        )}

        {/* Continue Shopping + Secure Checkout */}
        {itemCount > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-lg border-gray-200 px-6 font-medium dark:border-gray-700"
            >
              <Link href="/products">
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/40">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  Secure Checkout
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your data is safe with us
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      {itemCount > 0 && (
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Order Summary
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review your items and proceed to checkout
            </p>

            <Separator className="my-5" />

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {formatCurrencyEnglish(originalSubtotal)}
                </span>
              </div>

              {productDiscounts > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Product Discounts:</span>
                  <span>-{formatCurrencyEnglish(productDiscounts)}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Coupon Discount:</span>
                  <span>-{formatCurrencyEnglish(appliedCoupon.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  Delivery Fee
                  <Info
                    className="h-3.5 w-3.5 text-gray-400"
                    aria-hidden
                  />
                </span>
                <Link
                  href="/shipping"
                  className="text-gray-500 hover:text-primaryColor hover:underline dark:text-gray-400"
                >
                  Calculated at checkout
                </Link>
              </div>

              <Separator className="my-4" />

              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-50">
                  Total
                </span>
                <span className="text-2xl font-bold text-primaryColor dark:text-red-400 sm:text-3xl">
                  {formatCurrencyEnglish(total)}
                </span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <BadgeCheck className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                    <div className="min-w-0">
                      <Badge
                        variant="outline"
                        className="border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400"
                      >
                        {appliedCoupon.code.toUpperCase()}
                      </Badge>
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrencyEnglish(appliedCoupon.discount)}{" "}
                        discount applied
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/40"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove coupon</span>
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-50">
                    <Ticket className="h-4 w-4 text-primaryColor dark:text-red-400" />
                    Have a promo code?
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleApplyCoupon();
                      }}
                      disabled={isApplyingCoupon}
                      className="h-10 flex-1 border-gray-200 bg-white dark:border-gray-700"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      className="h-10 rounded-lg bg-red-100 px-5 font-medium text-primaryColor hover:bg-red-200 dark:bg-red-950/60 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {isApplyingCoupon ? "..." : "Apply"}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Checkout */}
            <Button
              asChild
              size="lg"
              className="mt-5 h-12 w-full rounded-xl bg-primaryColor text-base font-semibold hover:bg-primaryColor/90"
            >
              <Link href="/checkout" onClick={handleCheckout}>
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            {/* Trust Badges */}
            <div className="mt-5 space-y-2.5">
              {[
                {
                  icon: Truck,
                  title: "Fresh & Hygienic",
                  subtitle: "Quality you can trust",
                },
                {
                  icon: ShieldCheck,
                  title: "Safe Payment",
                  subtitle: "100% secure transactions",
                },
                {
                  icon: Headphones,
                  title: "Need Help?",
                  subtitle: "We're here for you",
                },
              ].map(({ icon: Icon, title, subtitle }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-xl bg-red-50/60 px-4 py-3 dark:bg-red-950/20"
                >
                  <Icon className="h-5 w-5 shrink-0 text-primaryColor dark:text-red-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {title}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {subtitle}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gray-200 dark:bg-gray-700" />
            <p className="flex items-center gap-1.5 text-xs italic text-gray-500 dark:text-gray-400">
              <Truck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              Good Food Brings People Together
            </p>
            <span className="h-px w-8 bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      )}
    </div>
  );
}
