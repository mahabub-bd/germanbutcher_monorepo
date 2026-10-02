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
    <div className="grid grid-cols-2 gap-4 justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Order:</span>
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
        <span className="text-sm text-muted-foreground">Payment :</span>
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
