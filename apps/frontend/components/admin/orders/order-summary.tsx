"use client";

import { Separator } from "@/components/ui/separator";
import { formatCurrencyEnglish } from "@/lib/utils";
import type { Coupon, OrderItem, ShippingMethod } from "@/utils/types";
import { FileText } from "lucide-react";

interface OrderSummaryData {
  originalSubtotal: number;
  productDiscountTotal: number;
  couponDiscount: number;
  itemsSubtotal: number;
  shippingCost: number;
  total: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  shippingMethod: ShippingMethod;
  coupon: Coupon | null;
  totalDiscount: number;
  totalValue: number;
  paidAmount: number;
  paymentStatus: string;
}

export function OrderSummary({
  items,
  shippingMethod,
  coupon,
  totalDiscount,
  totalValue,
  paidAmount,
  paymentStatus,
}: OrderSummaryProps) {
  const calculateOrderSummary = (): OrderSummaryData => {
    const itemsSubtotal = items.reduce((sum, item) => {
      const itemTotal =
        Number(item.totalPrice) ||
        (Number(item.unitPrice) || 0) * item.quantity;
      return sum + itemTotal;
    }, 0);

    const productDiscountTotal = items.reduce((sum, item) => {
      const discountTotal = (item.unitDiscount || 0) * item.quantity;
      return sum + Number(discountTotal);
    }, 0);

    const originalSubtotal = itemsSubtotal + productDiscountTotal;

    const couponDiscount = Number(totalDiscount) - productDiscountTotal;

    const shippingCost = Number(shippingMethod.cost);

    const total = Number(totalValue);

    return {
      originalSubtotal,
      productDiscountTotal,
      couponDiscount,
      itemsSubtotal,
      shippingCost,
      total,
    };
  };

  const orderSummary = calculateOrderSummary();

  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="pb-3">
        <h3 className="text-base font-medium flex items-center">
          <FileText className="size-5 mr-2" />
          Order Summary
        </h3>
      </div>
      <div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-sm">
              {formatCurrencyEnglish(orderSummary.originalSubtotal)}
            </span>
          </div>
          {orderSummary.productDiscountTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                Product Discounts
              </span>
              <span className="text-sm text-green-600">
                -{formatCurrencyEnglish(orderSummary.productDiscountTotal)}
              </span>
            </div>
          )}
          {coupon && orderSummary.couponDiscount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                Coupon Discount ({coupon.code})
              </span>
              <span className="text-sm text-green-600">
                -{formatCurrencyEnglish(orderSummary.couponDiscount)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Shipping ({shippingMethod?.name || "Standard"}):
            </span>
            <span className="text-sm">
              {formatCurrencyEnglish(orderSummary.shippingCost)}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-medium text-base">
            <span>Total</span>
            <span>{formatCurrencyEnglish(orderSummary.total)}</span>
          </div>
          {paymentStatus === "pending" && (
            <div className="flex justify-between text-red-600 text-sm">
              <span>Due Amount</span>
              <span>{formatCurrencyEnglish(totalValue - paidAmount)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
