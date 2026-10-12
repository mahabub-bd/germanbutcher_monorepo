"use client";

import { AccountPageHeader } from "@/components/user-account/account-page-header";

import { CustomerInfo } from "@/components/admin/orders/customer-info";
import { OrderItems } from "@/components/admin/orders/order-items";
import { OrderSummary } from "@/components/admin/orders/order-summary";
import { OrderTimeline } from "@/components/admin/orders/order-timeline";
import { PaymentHistory } from "@/components/admin/orders/payment-history";
import { ShippingAddress } from "@/components/admin/orders/shipping-address";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/contexts/cart-context";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { downloadOrderInvoice } from "@/utils/invoice-download";
import type { Order } from "@/utils/types";
import { ArrowLeft, Download, Loader2, Repeat } from "lucide-react";
import { useState } from "react";

interface OrderViewProps {
  order: Order;
  onBack?: () => void;
}

// Customer-facing order detail — mirrors the admin order view layout
// (items / timeline / payments on the left, customer / address / summary on
// the right) but only exposes customer actions: invoice download and reorder.
export default function OrderView({ order, onBack }: OrderViewProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const settings = useBusinessSettings();
  const { addManyItems } = useCartContext();

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await downloadOrderInvoice(order, settings);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleReorder = async () => {
    setIsReordering(true);
    try {
      await addManyItems(
        order.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        }))
      );
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="container mx-auto py-3 space-y-4">
      <AccountPageHeader
        title="Order Details"
        subtitle={`Order #${order.orderNo}`}
        leading={
          onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="size-4" />
            </Button>
          )
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="size-4 mr-2" />
                  Download
                </>
              )}
            </Button>
            <Button
            variant="outline"
              size="sm"
              onClick={handleReorder}
              disabled={isReordering || order.items.length === 0}
            >
              {isReordering ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Repeat className="size-4 mr-2" />
                  Buy Again
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <OrderItems items={order.items} />

          <OrderTimeline order={order} />

          <PaymentHistory payments={order.payments ?? []} />
        </div>

        <div className="space-y-4">
          <CustomerInfo
            user={{
              ...order.user,
              mobileNumber: order.user.mobileNumber,
            }}
          />

          <ShippingAddress
            address={order.address}
            userName={order.user.name}
            userMobileNumber={order.user.mobileNumber}
          />

          <OrderSummary
            items={order.items}
            shippingMethod={order.shippingMethod}
            shippingCost={order.shippingCost}
            coupon={order.coupon}
            totalDiscount={order.totalDiscount}
            totalValue={order.totalValue}
            paidAmount={order.paidAmount}
            paymentStatus={order.paymentStatus}
          />
        </div>
      </div>
    </div>
  );
}
