"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Truck, User, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AssignDeliveryMan } from "@/components/admin/delivery-man/assign-delivery-man";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";
import { formatDateTime } from "@/lib/utils";
import { patchData } from "@/utils/api-utils";
import { getStatusDotColor, getStatusIcon } from "@/utils/order-helper";
import { OrderStatus, type Order } from "@/utils/types";
import { Section } from "../helper";

const orderUpdateSchema = z.object({
  orderStatus: z.union([
    z.literal("pending"),
    z.literal("processing"),
    z.literal("shipped"),
    z.literal("delivered"),
    z.literal("cancelled"),
  ]),
  note: z.string().max(500).optional(), // ✅ added note field
});

type OrderUpdateValues = z.infer<typeof orderUpdateSchema>;

interface OrderFormProps {
  order: Order;
}

export function OrderForm({ order }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const router = useRouter();

  const defaultValues: OrderUpdateValues = {
    orderStatus:
      order.orderStatus === "pending" ||
      order.orderStatus === "shipped" ||
      order?.orderStatus === "cancelled" ||
      order?.orderStatus === "delivered" ||
      order?.orderStatus === "processing"
        ? order?.orderStatus
        : "pending",
    note: "",
  };

  const form = useForm<OrderUpdateValues>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues,
  });

  const canCancelOrder = () => {
    const nonCancellableStatuses = ["shipped", "delivered"];
    return !nonCancellableStatuses.includes(order.orderStatus.toLowerCase());
  };

  const getAvailableStatusOptions = () => {
    const baseOptions = [
      { value: "pending", label: "Pending", disabled: false },
      { value: "processing", label: "Processing", disabled: false },
      { value: "shipped", label: "Shipped", disabled: false },
      { value: "delivered", label: "Delivered", disabled: false },
    ];

    if (canCancelOrder()) {
      baseOptions.push({
        value: "cancelled",
        label: "Cancelled",
        disabled: false,
      });
    } else {
      baseOptions.push({
        value: "cancelled",
        label: "Cancelled (Not allowed - Order already shipped/delivered)",
        disabled: true,
      });
    }

    return baseOptions;
  };

  const handleSubmit = async (data: OrderUpdateValues) => {
    if (data.orderStatus === "cancelled" && !canCancelOrder()) {
      toast.error(
        "Cannot cancel order - Order has already been shipped or delivered"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const orderStatusResponse = await patchData(
        `orders/${order.id}/order-status`,
        {
          status: data.orderStatus,
          note: data.note, // ✅ send note to backend
        }
      );

      if (!orderStatusResponse || orderStatusResponse.statusCode !== 200) {
        throw new Error(
          orderStatusResponse?.message || "Failed to update order status"
        );
      }

      toast.success("Order status updated successfully");
      router.push("/admin/orders");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSubtotal = () => {
    return order.items.reduce((total, item) => {
      return total + item.product.sellingPrice * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingCost = Number(order.shippingMethod?.cost || 0);
  const total = order.totalValue;
  const paidAmount = order.paidAmount || 0;

  const generateOrderTimeline = () => {
    const allStatuses = [
      OrderStatus.PENDING,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];

    const currentStatus = order.orderStatus.toLowerCase();

    if (currentStatus === OrderStatus.CANCELLED) {
      return [OrderStatus.PENDING, OrderStatus.CANCELLED];
    }

    const statusIndex = allStatuses.findIndex(
      (status) => status === currentStatus
    );
    if (statusIndex >= 0) {
      return allStatuses.slice(0, statusIndex + 1);
    }

    return [currentStatus];
  };

  const getStatusTimestamp = (status: string) => {
    const statusTrack = order.statusTracks.find(
      (track) => track.status.toLowerCase() === status.toLowerCase()
    );
    return statusTrack ? statusTrack.createdAt : null;
  };

  const getStatusNote = (status: string) => {
    const statusTrack = order.statusTracks.find(
      (track) => track.status.toLowerCase() === status.toLowerCase()
    );
    return statusTrack ? statusTrack.note : null;
  };

  const getStatusUpdatedBy = (status: string) => {
    const statusTrack = order.statusTracks.find(
      (track) => track.status.toLowerCase() === status.toLowerCase()
    );
    return statusTrack ? statusTrack.updatedBy : null;
  };

  const isStatusActive = (status: string) => {
    const currentStatus = order.orderStatus.toLowerCase();

    if (currentStatus === OrderStatus.CANCELLED) {
      return status === OrderStatus.PENDING || status === OrderStatus.CANCELLED;
    }

    const allStatuses = [
      OrderStatus.PENDING,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    const statusIndex = allStatuses.indexOf(status as OrderStatus);
    const currentIndex = allStatuses.indexOf(currentStatus as OrderStatus);

    return statusIndex <= currentIndex;
  };

  const timelineStatuses = generateOrderTimeline();
  const availableStatusOptions = getAvailableStatusOptions();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-6 space-y-6 mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ✅ Update Order Status Section */}
            <Section title="Update Order Status">
              <div className="grid grid-cols-1 gap-6">
                {/* Status Dropdown */}
                <FormField
                  control={form.control}
                  name="orderStatus"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Order Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select order status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableStatusOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              disabled={option.disabled}
                              className={
                                option.disabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />

                      {!canCancelOrder() && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm text-amber-800">
                              <strong>Cancellation Restricted:</strong> This
                              order cannot be cancelled because it has already
                              been shipped or delivered.
                            </span>
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* ✅ New Note Input */}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Note (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Add a note for this status update (e.g. 'Package ready for shipment')"
                          className="w-full min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Section>

            {/* Timeline */}
            <Section title="Order Status Timeline">
              <div className="pl-2">
                {order.statusTracks.length > 0 ? (
                  <Timeline>
                    {timelineStatuses.map((status, index) => {
                      const isActive = isStatusActive(status);
                      const timestamp = getStatusTimestamp(status);
                      const note = getStatusNote(status);
                      const updatedBy = getStatusUpdatedBy(status);

                      return (
                        <TimelineItem key={status}>
                          <TimelineSeparator>
                            <TimelineDot
                              className={
                                isActive
                                  ? getStatusDotColor(status)
                                  : "bg-gray-300"
                              }
                            />
                            {index < timelineStatuses.length - 1 && (
                              <TimelineConnector
                                className={isActive ? "" : "bg-gray-300"}
                              />
                            )}
                          </TimelineSeparator>
                          <TimelineContent>
                            <div className="ml-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {isActive && getStatusIcon(status)}
                                  <h4
                                    className={`text-sm font-medium ${
                                      !isActive ? "text-gray-400" : ""
                                    }`}
                                  >
                                    {status.charAt(0).toUpperCase() +
                                      status.slice(1)}
                                  </h4>
                                </div>
                                {timestamp ? (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDateTime(timestamp)}
                                  </span>
                                ) : (
                                  isActive && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {status === order.orderStatus
                                        ? "Current"
                                        : ""}
                                    </Badge>
                                  )
                                )}
                              </div>
                              {note && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {note}
                                </p>
                              )}
                              {updatedBy ? (
                                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3 mr-1" />
                                  Updated by: {updatedBy.name || "User"}
                                </div>
                              ) : (
                                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3 mr-1" />
                                  Created by: {order.user.name || "User"}
                                </div>
                              )}
                            </div>
                          </TimelineContent>
                        </TimelineItem>
                      );
                    })}
                  </Timeline>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No status updates available.
                  </p>
                )}
              </div>
            </Section>
          </div>

          {/* Delivery Man Assignment Section */}
          <Section title="Delivery Man Assignment">
            <div className="space-y-3">
              {currentOrder.deliveryMan ? (
                <div className="relative overflow-hidden rounded-lg border-2 border-blue-500/20 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-blue-500/10 to-transparent" />
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                          {currentOrder.deliveryMan.name}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                          {currentOrder.deliveryMan.mobileNumber}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-blue-600 dark:text-blue-400">
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {currentOrder.deliveryMan.totalDeliveries} deliveries
                          </span>
                          <span className="flex items-center gap-1">
                            ৳{Number(currentOrder.deliveryMan.totalEarnings).toFixed(0)} total
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="default"
                      className="gap-1 bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Assigned
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                  <Truck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No delivery man assigned to this order
                  </p>
                </div>
              )}
              <div className="flex justify-start">
                <AssignDeliveryMan
                  orderId={order.id}
                  deliveryMan={currentOrder.deliveryMan}
                  orderStatus={order.orderStatus}
                  onAssignmentChange={(deliveryMan) => {
                    setCurrentOrder({ ...currentOrder, deliveryMan });
                  }}
                />
              </div>
            </div>
          </Section>

          {/* ✅ Existing sections below untouched */}
          {/* Payment Information, Order Information, Order Items, etc. */}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end p-6 gap-4 mx-auto w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/orders")}
            disabled={isSubmitting}
            className="w-32"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-40 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Update Order
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
