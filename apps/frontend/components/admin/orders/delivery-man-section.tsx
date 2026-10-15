"use client";

import { AssignDeliveryMan } from "@/components/admin/delivery-man/assign-delivery-man";
import { Badge } from "@/components/ui/badge";
import type { DeliveryMan, Order } from "@/utils/types";
import { CheckCircle2, Truck } from "lucide-react";
import { useState } from "react";

interface DeliveryManSectionProps {
  order: Order;
  onDeliveryManChange?: (deliveryMan: DeliveryMan | null) => void;
}

export function DeliveryManSection({
  order,
  onDeliveryManChange,
}: DeliveryManSectionProps) {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);

  const handleAssignmentChange = (deliveryMan: DeliveryMan | null) => {
    setCurrentOrder({ ...currentOrder, deliveryMan });
    onDeliveryManChange?.(deliveryMan);
  };

  return (
    <div className="rounded-sm border bg-card shadow-sm">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold flex items-center">
          <Truck className="size-4 mr-1.5 text-primary" />
          Delivery Man
        </h3>
      </div>

      <div className="p-4 space-y-3">
        {currentOrder.deliveryMan ? (
          <div className="flex items-center justify-between p-3 rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  {currentOrder.deliveryMan.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentOrder.deliveryMan.mobileNumber}
                </p>
              </div>
            </div>
            <Badge variant="default" className="gap-1 bg-green-600 text-[10px] h-5">
              Assigned
            </Badge>
          </div>
        ) : (
          <div className="text-center py-5 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20">
            <Truck className="h-7 w-7 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              No delivery man assigned
            </p>
          </div>
        )}
        <div className="flex justify-start">
          <AssignDeliveryMan
            orderId={order.id}
            deliveryMan={currentOrder.deliveryMan}
            orderStatus={order.orderStatus}
            onAssignmentChange={handleAssignmentChange}
          />
        </div>
      </div>
    </div>
  );
}
