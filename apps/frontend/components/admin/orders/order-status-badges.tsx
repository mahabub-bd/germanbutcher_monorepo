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
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="text-[11px] text-muted-foreground">Order Status</span>
      <Badge
        className={`${getOrderStatusColor(orderStatus)} max-w-full px-2 py-0.5 text-[11px] font-medium`}
      >
        <span className="mr-1">
          {getStatusIcon(orderStatus)}
        </span>
        <span className="truncate capitalize">{orderStatus}</span>
      </Badge>
      <span className="ml-1 text-[11px] text-muted-foreground">Payment</span>
      <Badge
        className={`${getPaymentStatusColor(paymentStatus)} max-w-full px-2 py-0.5 text-[11px] font-medium`}
      >
        <span className="mr-1">
          {getStatusIcon(paymentStatus)}
        </span>
        <span className="truncate capitalize">{paymentStatus}</span>
      </Badge>
    </div>
  );
}
