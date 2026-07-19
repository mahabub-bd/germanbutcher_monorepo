"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyEnglish } from "@/lib/utils";
import { cancelOrder } from "@/utils/api-utils";
import type { Order } from "@/utils/types";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const CANCELLATION_REASONS = [
  { value: "customer_request", label: "Customer Request" },
  { value: "inventory_issue", label: "Inventory Issue" },
  { value: "Remote Area", label: "Remote Area" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "payment_failed", label: "Payment Failed" },
  { value: "fraudulent_order", label: "Fraudulent Order" },
  { value: "shipping_delay", label: "Shipping Delay" },
  { value: "price_error", label: "Price Error" },
  { value: "duplicate_order", label: "Duplicate Order" },
  { value: "other", label: "Other" },
] as const;

export type CancellationReason =
  (typeof CANCELLATION_REASONS)[number]["value"];

/**
 * Check if an order can be cancelled based on its status
 * Orders can only be cancelled if they are pending or processing
 */
export function canCancelOrder(order: Order): boolean {
  return order.orderStatus === "pending" || order.orderStatus === "processing";
}

interface CancelOrderModalProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelSuccess: () => void;
}

export function CancelOrderModal({
  order,
  open,
  onOpenChange,
  onCancelSuccess,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState<CancellationReason | "">("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPaidOrder = order.paidAmount > 0 || order.paymentStatus === "paid";

  const handleCancel = async () => {
    if (!reason) {
      setError("Please select a cancellation reason");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await cancelOrder(
        order.id,
        reason,
        notes || undefined
      );

      if (response?.statusCode === 200) {
        toast.success(
          `Order ${response.data.orderNo} cancelled successfully${isPaidOrder
            ? ". You can process a refund using the Refund button."
            : ""
          }`
        );
        onCancelSuccess();
        onOpenChange(false);

        // Reset form
        setReason("");
        setNotes("");
      } else {
        throw new Error(response?.message || "Failed to cancel order");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to cancel order";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setReason("");
        setNotes("");
        setError("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="text-xl">Cancel Order</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this order? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order:</span>
              <span className="font-semibold">{order.orderNo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-semibold">
                {formatCurrencyEnglish(Number(order.totalValue))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order Status:</span>
              <span className="font-semibold capitalize">{order.orderStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Status:</span>
              <span className="font-semibold capitalize">{order.paymentStatus}</span>
            </div>
            {isPaidOrder && (
              <div className="pt-2 border-t">
                <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    This order has been paid. A refund will be processed.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <label
              htmlFor="reason"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Cancellation Reason <span className="text-destructive">*</span>
            </label>
            <Select
              value={reason}
              onValueChange={(value) => {
                setReason(value as CancellationReason);
                setError("");
              }}
            >
              <SelectTrigger id="reason" className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Additional Notes <span className="text-muted-foreground">(Optional)</span>
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Please provide any additional details..."
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/500
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 text-amber-800 px-3 py-2 rounded-md text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              This action cannot be undone. The order will be cancelled and
              stock will be restored.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-4 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Keep Order
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={!reason || loading}
          >
            {loading ? "Cancelling..." : "Cancel Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
