"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyEnglish } from "@/lib/utils";
import type {
  PaymentMethod,
  ShippingMethod,
  User as UserType,
} from "@/utils/types";
import {
  CreditCard,
  FileText,
  Loader2,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import Link from "next/link";

interface OrderSummaryProps {
  originalSubtotal: number;

  productDiscounts: number;
  appliedCoupon: { code: string; discount: number } | null;
  shippingCost: number;
  isFreeDelivery?: boolean;
  freeDeliveryRemaining?: number | null;
  total: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  selectedShippingMethod: string;
  selectedPaymentMethod: string;
  shippingMethods: ShippingMethod[];
  paymentMethods: PaymentMethod[];
  user?: UserType;
}

export function OrderSummary({
  originalSubtotal,
  productDiscounts,
  appliedCoupon,
  shippingCost,
  isFreeDelivery = false,
  freeDeliveryRemaining = null,
  total,
  isSubmitting,
  onSubmit,
  selectedShippingMethod,
  selectedPaymentMethod,
  shippingMethods,
  paymentMethods,
  user,
}: OrderSummaryProps) {
  const shippingMethodName = shippingMethods.find(
    (m) => m.id.toString() === selectedShippingMethod
  )?.name;

  const paymentMethodName = paymentMethods.find(
    (m) => m.code === selectedPaymentMethod
  )?.name;

  const canPlaceOrder = user;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Order Summary
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review your items and place your order
        </p>
      </header>

      <Separator className="my-5" />

      {/* Price Breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
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
            <span className="flex items-center gap-2">
              Coupon
              <Badge
                variant="outline"
                className="border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400"
              >
                {appliedCoupon.code.toUpperCase()}
              </Badge>
            </span>
            <span>-{formatCurrencyEnglish(appliedCoupon.discount)}</span>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              Delivery Fee
            </span>
            {isFreeDelivery ? (
              <span className="font-semibold text-green-600 dark:text-green-400">
                FREE
              </span>
            ) : (
              <span className="font-medium text-gray-900 dark:text-gray-50">
                {formatCurrencyEnglish(Number(shippingCost))}
              </span>
            )}
          </div>
          {freeDeliveryRemaining !== null && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add {formatCurrencyEnglish(freeDeliveryRemaining)} more to get
              free delivery
            </p>
          )}
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

      {/* Place Order */}
      {canPlaceOrder ? (
        <Button
          onClick={onSubmit}
          size="lg"
          className="mt-5 h-12 w-full rounded-xl bg-primaryColor text-base font-semibold hover:bg-primaryColor/90 dark:bg-red-700 dark:hover:bg-red-600"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Place Order
            </>
          )}
        </Button>
      ) : (
        <div className="mt-5 rounded-xl bg-yellow-50 p-4 text-center dark:bg-yellow-950/40">
          {!user && (
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Please verify your mobile number to place an order
            </p>
          )}
        </div>
      )}

      {/* Shipping & Payment methods — trust-row style like the cart page */}
      <div className="mt-5 space-y-2.5">
        {selectedShippingMethod && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50/60 px-4 py-3 dark:bg-red-950/20">
            <Truck className="h-5 w-5 shrink-0 text-primaryColor dark:text-red-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {shippingMethodName || "Standard Shipping"}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                Delivery method
              </p>
            </div>
          </div>
        )}

        {selectedPaymentMethod && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50/60 px-4 py-3 dark:bg-red-950/20">
            <CreditCard className="h-5 w-5 shrink-0 text-primaryColor dark:text-red-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {paymentMethodName || "Credit Card"}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                Payment method
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-xl bg-red-50/60 px-4 py-3 dark:bg-red-950/20">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primaryColor dark:text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Safe Payment
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              100% secure transactions
            </p>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span>By placing your order, you agree to our</span>
          <Link
            href="/terms-and-conditions"
            className="underline transition-colors hover:text-primaryColor dark:hover:text-red-400"
            aria-label="Terms of Service"
          >
            Terms and Conditions
          </Link>
          <span>and</span>
          <Link
            href="/return-refund-policy"
            className="underline transition-colors hover:text-primaryColor dark:hover:text-red-400"
            aria-label="Refund Policy"
          >
            Refund Policy
          </Link>
        </p>
      </div>
    </section>
  );
}
