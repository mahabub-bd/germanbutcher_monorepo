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
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Order Status:</span>
        <Badge
          className={`${getOrderStatusColor(orderStatus)} px-2.5 py-1 text-xs font-medium`}
        >
          <span className="mr-1">
            {getStatusIcon(orderStatus)}
          </span>
          <span className="capitalize">{orderStatus}</span>
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Payment Status:</span>
        <Badge
          className={`${getPaymentStatusColor(paymentStatus)} px-2.5 py-1 text-xs font-medium`}
        >
          <span className="mr-1">
            {getStatusIcon(paymentStatus)}
          </span>
          <span className="capitalize">{paymentStatus}</span>
        </Badge>
      </div>
    </div>
  );
}
