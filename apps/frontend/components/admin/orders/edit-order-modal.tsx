"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { OrderForm } from "@/components/admin/orders/order-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchProtectedData } from "@/utils/api-utils";
import type { Order } from "@/utils/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditOrderModalProps {
  orderId: Order["id"] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditOrderModal({
  orderId,
  open,
  onOpenChange,
  onUpdated,
}: EditOrderModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || orderId === null) return;

    const loadOrder = async () => {
      setIsLoading(true);
      setOrder(null);
      try {
        setOrder(await fetchProtectedData<Order>(`orders/${orderId}`));
      } catch (error) {
        console.error("Error loading order for editing:", error);
        toast.error("Failed to load order details.");
        onOpenChange(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [open, orderId, onOpenChange]);

  const handleUpdated = () => {
    onUpdated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-[96vw] 2xl:max-w-[1500px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4 pr-12">
          <DialogTitle>
            Edit Order{order ? ` #${order.orderNo}` : ""}
          </DialogTitle>
          <DialogDescription>
            Update the order status and delivery assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="py-14">
              <LoadingIndicator message="Loading order details..." />
            </div>
          ) : order ? (
            <OrderForm
              key={order.id}
              order={order}
              onSuccess={handleUpdated}
              onCancel={() => onOpenChange(false)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
