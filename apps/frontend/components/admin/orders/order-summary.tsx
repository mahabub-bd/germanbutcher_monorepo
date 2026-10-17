"use client";

import { Separator } from "@/components/ui/separator";
import { formatCurrencyEnglish } from "@/lib/utils";
import type {
  BogoUsageLog,
  Coupon,
  OrderItem,
  ShippingMethod,
} from "@/utils/types";
import { FileText } from "lucide-react";

interface OrderSummaryData {
  originalSubtotal: number;
  productDiscountTotal: number;
  bogoUsages: Pick<
    BogoUsageLog,
    "campaignName" | "discountAmount" | "freeUnits"
  >[];
  bogoDiscountTotal: number;
  couponDiscount: number;
  itemsSubtotal: number;
  shippingCost: number;
  total: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  shippingMethod: ShippingMethod;
  /** Fee actually charged (0 when free delivery applied); falls back to the
   * shipping method's base cost for orders placed before it was stored. */
  shippingCost?: string | number | null;
  coupon: Coupon | null;
  totalDiscount: number;
  totalValue: number;
  paidAmount: number;
  paymentStatus: string;
  /** BOGO campaign usages attached by the backend on order detail */
  bogoUsage?: Array<{
    campaignName: string;
    discountAmount: string | number;
    freeUnits: number;
  }> | null;
}

export function OrderSummary({
  items,
  shippingMethod,
  shippingCost,
  coupon,
  totalDiscount,
  totalValue,
  paidAmount,
  paymentStatus,
  bogoUsage,
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

    // unitDiscount snapshots include BOGO, so split it back out; old orders
    // have no bogoUsage and just keep it folded into product discounts
    const bogoUsages = (bogoUsage ?? []).map((usage) => ({
      campaignName: usage.campaignName,
      discountAmount: usage.discountAmount,
      freeUnits: usage.freeUnits,
    }));
    const bogoDiscountTotal = bogoUsages.reduce(
      (sum, usage) => sum + Number(usage.discountAmount),
      0
    );

    const couponDiscount = Math.max(
      Number(totalDiscount) - productDiscountTotal - bogoDiscountTotal,
      0
    );

    const effectiveShippingCost = Number(shippingCost ?? shippingMethod.cost);

    const total = Number(totalValue);

    return {
      originalSubtotal,
      productDiscountTotal,
      bogoUsages,
      bogoDiscountTotal,
      couponDiscount,
      itemsSubtotal,
      shippingCost: effectiveShippingCost,
      total,
    };
  };

  const orderSummary = calculateOrderSummary();

  return (
    <div className="rounded-sm border p-4 bg-background">
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
          {orderSummary.productDiscountTotal -
            orderSummary.bogoDiscountTotal >
            0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                Product Discounts
              </span>
              <span className="text-sm text-green-600">
                -{formatCurrencyEnglish(
                  orderSummary.productDiscountTotal -
                    orderSummary.bogoDiscountTotal
                )}
              </span>
            </div>
          )}
          {orderSummary.bogoUsages.map((usage) => (
            <div key={usage.campaignName} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                BOGO — {usage.campaignName} ({usage.freeUnits} free)
              </span>
              <span className="text-sm text-green-600">
                -{formatCurrencyEnglish(Number(usage.discountAmount))}
              </span>
            </div>
          ))}
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
            {orderSummary.shippingCost > 0 ? (
              <span className="text-sm">
                {formatCurrencyEnglish(orderSummary.shippingCost)}
              </span>
            ) : (
              <span className="text-sm font-medium text-green-600">
                Free Delivery
              </span>
            )}
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
