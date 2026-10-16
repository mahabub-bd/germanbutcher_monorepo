"use client";

import { CustomerInfo } from "@/components/admin/orders/customer-info";
import { DeliveryManSection } from "@/components/admin/orders/delivery-man-section";
import { OrderActions } from "@/components/admin/orders/order-actions";
import { OrderItems } from "@/components/admin/orders/order-items";
import { OrderSummary } from "@/components/admin/orders/order-summary";
import { OrderTimeline } from "@/components/admin/orders/order-timeline";
import { PaymentHistory } from "@/components/admin/orders/payment-history";
import { ShippingAddress } from "@/components/admin/orders/shipping-address";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { fetchOrderById } from "@/utils/api-utils";
import type { Order } from "@/utils/types";
import { pdf } from "@react-pdf/renderer";
import { useState } from "react";
import { OrderPDFDocument } from "./order-pdf-document";
import { printThermalInvoice } from "./thermal-print";

interface OrderViewProps {
  order: Order;
  onBack?: () => void;
  onPrevOrder?: () => void;
  onNextOrder?: () => void;
}

export default function OrderView({
  order,
  onBack,
  onPrevOrder,
  onNextOrder,
}: OrderViewProps) {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [, setIsRefreshing] = useState(false);
  const businessSettings = useBusinessSettings();

  const handleRefreshOrder = async () => {
    setIsRefreshing(true);
    try {
      // Refetch the order to get updated status
      const updatedOrder = await fetchOrderById(order.id.toString());
      setCurrentOrder(updatedOrder as Order);
    } catch (error) {
      console.error("Failed to refresh order:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGeneratePDF = async () => {
    const blob = await pdf(
      <OrderPDFDocument order={currentOrder} settings={businessSettings} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `German-Butcher-Invoice-${currentOrder.orderNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <OrderActions
        order={currentOrder}
        onGeneratePDF={handleGeneratePDF}
        onThermalPrint={() => printThermalInvoice(currentOrder, businessSettings)}
        onBack={onBack}
        onPrevOrder={onPrevOrder}
        onNextOrder={onNextOrder}
        onCancelSuccess={handleRefreshOrder}
        onRefundSuccess={handleRefreshOrder}
        onEditSuccess={handleRefreshOrder}
        onPaymentSuccess={handleRefreshOrder}
      />

      {/* Right rail: ~29% on laptop (xl), 25% on 2xl where there's room to spare.
          min-w-0 on both columns: grid items default to min-width:auto, and the
          rail's min-content (long email, nowrap buttons) would otherwise blow
          the 1fr track past the viewport and force horizontal scrolling. */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2.5fr_1fr] 2xl:grid-cols-4">
        <div className="min-w-0 2xl:col-span-3 space-y-4">
          <OrderItems items={currentOrder.items} />

          <OrderTimeline order={currentOrder} />

          <PaymentHistory payments={currentOrder.payments ?? []} />
        </div>

        <div className="min-w-0 space-y-4">
          <CustomerInfo
            user={{
              ...currentOrder.user,
              mobileNumber: currentOrder.user.mobileNumber,
            }}
          />

          <DeliveryManSection
            order={currentOrder}
            onDeliveryManChange={(deliveryMan) => {
              setCurrentOrder({ ...currentOrder, deliveryMan });
            }}
          />

          <ShippingAddress
            address={currentOrder.address}
            userName={currentOrder.user.name}
            userMobileNumber={currentOrder.user.mobileNumber}
          />

          <OrderSummary
            items={currentOrder.items}
            shippingMethod={currentOrder.shippingMethod}
            shippingCost={currentOrder.shippingCost}
            coupon={currentOrder.coupon}
            totalDiscount={currentOrder.totalDiscount}
            totalValue={currentOrder.totalValue}
            paidAmount={currentOrder.paidAmount}
            paymentStatus={currentOrder.paymentStatus}
          />
        </div>
      </div>
    </div>
  );
}
