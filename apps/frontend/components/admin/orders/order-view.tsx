"use client";

import { PaymentsTable } from "@/app/admin/order/[id]/payments/payment-table";
import { CustomerInfo } from "@/components/admin/orders/customer-info";
import { DeliveryManSection } from "@/components/admin/orders/delivery-man-section";
import { OrderActions } from "@/components/admin/orders/order-actions";
import { OrderItems } from "@/components/admin/orders/order-items";
import { OrderSummary } from "@/components/admin/orders/order-summary";
import { OrderTimeline } from "@/components/admin/orders/order-timeline";
import { ShippingAddress } from "@/components/admin/orders/shipping-address";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { fetchOrderById } from "@/utils/api-utils";
import type { Order } from "@/utils/types";
import { pdf } from "@react-pdf/renderer";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { OrderPDFDocument } from "./order-pdf-document";
import { ThermalPrint } from "./thermal-print";

interface OrderViewProps {
  order: Order;
  onBack?: () => void;
}

export default function OrderView({ order, onBack }: OrderViewProps) {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCancelSuccess = async () => {
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
    const blob = await pdf(<OrderPDFDocument order={currentOrder} />).toBlob();
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
    <div className="container mx-auto py-4 space-y-6">
      <OrderActions
        order={currentOrder}
        onGeneratePDF={handleGeneratePDF}
        onBack={onBack}
        onCancelSuccess={handleCancelSuccess}
        onRefundSuccess={handleCancelSuccess}
      />

      {/* Thermal Print Button - Separate Component */}
      <div className="flex justify-end">
        <ThermalPrint order={currentOrder} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <OrderItems items={currentOrder.items} />

          <OrderTimeline order={currentOrder} />

          {currentOrder.payments && currentOrder.payments.length > 0 && (
            <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b">
                <h3 className="text-sm font-semibold flex items-center">
                  <CreditCard className="size-4 mr-1.5 text-primary" />
                  Payment History
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({currentOrder.payments.length})
                  </span>
                </h3>
              </div>
              <div className="p-4">
                <PaymentsTable payments={currentOrder.payments} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
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
