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
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Tag,
  TicketPercent,
  Truck,
} from "lucide-react";
import Link from "next/link";

interface OrderSummaryProps {
  originalSubtotal: number;

  productDiscounts: number;
  appliedCoupon: { code: string; discount: number } | null;
  shippingCost: number;
  total: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  selectedShippingMethod: string;
  selectedPaymentMethod: string;
  shippingMethods: ShippingMethod[];
  paymentMethods: PaymentMethod[];
  user?: UserType;
}

const SummaryRow = ({
  icon: Icon,
  label,
  value,
  valueClassName = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  valueClassName?: string;
}) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
    <span className={valueClassName}>{value}</span>
  </div>
);

export function OrderSummary({
  originalSubtotal,
  productDiscounts,
  appliedCoupon,
  shippingCost,
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
    <section className="space-y-6 bg-white rounded-lg border p-6">
      <header className="border-b pb-4">
        <h2 className="text-lg font-semibold">Order Summary</h2>
      </header>

      <div className="space-y-3">
        <SummaryRow
          icon={ShoppingBag}
          label="Subtotal"
          value={formatCurrencyEnglish(originalSubtotal)}
        />

        {productDiscounts > 0 && (
          <SummaryRow
            icon={Tag}
            label="Product Discounts"
            value={`-${formatCurrencyEnglish(productDiscounts)}`}
            valueClassName="text-green-600"
          />
        )}

        {appliedCoupon && (
          <div className="flex justify-between text-sm text-green-600">
            <div className="flex items-center gap-2">
              <TicketPercent className="h-3.5 w-3.5" />
              <span>Coupon</span>
              <Badge variant="outline" className="bg-green-50 text-xs">
                {appliedCoupon.code.toUpperCase()}
              </Badge>
            </div>
            <span>-{formatCurrencyEnglish(appliedCoupon.discount)}</span>
          </div>
        )}

        <SummaryRow
          icon={Truck}
          label="Shipping"
          value={formatCurrencyEnglish(Number(shippingCost))}
        />

        <Separator className="my-3" />

        <div className="flex justify-between font-medium">
          <span className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Total
          </span>
          <span className="text-lg font-semibold">
            {formatCurrencyEnglish(total)}
          </span>
        </div>
      </div>

      {canPlaceOrder ? (
        <div className="space-y-2">
          <Button
            onClick={onSubmit}
            size="lg"
            className="w-full bg-primaryColor hover:bg-primaryColor/90 transition-colors cursor-pointer"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Place Order
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 rounded-md text-center">
          {!user && (
            <p className="text-sm text-yellow-800">
              Please verify your mobile number to place an order
            </p>
          )}
        </div>
      )}

      <div className=" text-sm grid md:grid-cols-2 grid-cols-2 gap-4">
        {selectedShippingMethod && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Truck className="h-4 w-4 flex-shrink-0" />
            <span>{shippingMethodName || "Standard Shipping"}</span>
          </div>
        )}

        {selectedPaymentMethod && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <CreditCard className="h-4 w-4 flex-shrink-0" />
            <span>{paymentMethodName || "Credit Card"}</span>
          </div>
        )}
      </div>

      <div className="border-t pt-6 mt-6">
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
          <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span>By placing your order, you agree to our</span>
          <Link
            href="/terms-and-conditions"
            className="underline hover:text-primary transition-colors"
            aria-label="Terms of Service"
          >
            Terms and Conditions
          </Link>
          <span>and</span>
          <Link
            href="/return-refund-policy"
            className="underline hover:text-primary transition-colors"
            aria-label="Refund Policy"
          >
            Refund Policy
          </Link>
        </p>
      </div>
    </section>
  );
}
