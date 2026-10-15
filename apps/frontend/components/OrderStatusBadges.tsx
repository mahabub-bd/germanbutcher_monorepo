"use client";

import { Badge } from "@/components/ui/badge";
import { getOrderStatusColor, getPaymentStatusColor, getStatusIcon } from "@/utils/order-helper";

interface OrderStatusBadgesProps {
  orderStatus: string;
  paymentStatus: string;
}

export function OrderStatusBadges({
  orderStatus,
  paymentStatus,
}: OrderStatusBadgesProps) {
  const renderStatusBadge = (
    label: string,
    status: string,
    getColor: (status: string) => string
  ) => (
    <div className="flex min-w-0 items-center gap-1.5 rounded-md border bg-background/70 px-2 py-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Badge
        className={`${getColor(status)} max-w-full px-2 py-0.5 text-[11px] font-medium`}
      >
        <span className="mr-1">
          {getStatusIcon(status)}
        </span>
        <span className="truncate capitalize">{status}</span>
      </Badge>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
      {renderStatusBadge("Order Status", orderStatus, getOrderStatusColor)}
      {renderStatusBadge("Payment", paymentStatus, getPaymentStatusColor)}
    </div>
  );
}