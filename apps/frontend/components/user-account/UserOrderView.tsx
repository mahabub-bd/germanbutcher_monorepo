"use client";

import { PaymentsTable } from "@/app/admin/order/[id]/payments/payment-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
  getStatusDotColor,
  getStatusIcon,
} from "@/utils/order-helper";
import { OrderStatus, type Order, type OrderItem } from "@/utils/types";
import { pdf } from "@react-pdf/renderer";
import {
  ArrowLeft,
  Clock,
  CreditCard,
  Download,
  FileText,
  Loader2,
  MapPin,
  Package,
  Tag,
  Truck,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { OrderPDFDocument } from "../admin/orders/order-pdf-document";

// Order status enum

interface OrderViewProps {
  order: Order;
  onBack?: () => void;
}

export default function OrderView({ order, onBack }: OrderViewProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(
    new Set(order.items.map((item) => String(item.product.id)))
  );

  const handleImageLoad = (productId: string | number) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(String(productId));
      return newSet;
    });
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const blob = await pdf(<OrderPDFDocument order={order} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `German-Butcher-Invoice-${order.orderNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // You might want to show a toast notification here
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generateOrderTimeline = () => {
    // Create a map of all possible statuses
    const allStatuses = [
      OrderStatus.PENDING,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];

    // Get the current order status
    const currentStatus = order.orderStatus.toLowerCase();

    // If order is cancelled, only show statuses up to cancellation
    if (currentStatus === OrderStatus.CANCELLED) {
      return [OrderStatus.PENDING, OrderStatus.CANCELLED];
    }

    // For normal order flow, show all statuses up to the current one
    const statusIndex = allStatuses.findIndex(
      (status) => status === currentStatus
    );
    if (statusIndex >= 0) {
      return allStatuses.slice(0, statusIndex + 1);
    }

    // Fallback to just showing the current status
    return [currentStatus];
  };

  // Get the timestamp for a specific status from statusTracks
  const getStatusTimestamp = (status: string) => {
    const statusTrack = order.statusTracks.find(
      (track) => track.status.toLowerCase() === status.toLowerCase()
    );
    return statusTrack ? statusTrack.createdAt : null;
  };

  // Get the note for a specific status from statusTracks
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

  // Generate the timeline statuses
  const timelineStatuses = generateOrderTimeline();

  // Calculate order summary using stored prices from OrderItem
  const calculateOrderSummary = () => {
    // Calculate subtotal from stored item prices
    const itemsSubtotal = order.items.reduce((sum, item) => {
      // Use stored totalPrice if available, otherwise fallback to calculation
      const itemTotal =
        Number(item.totalPrice) ||
        (Number(item.unitPrice) || 0) * item.quantity;
      return sum + itemTotal;
    }, 0);

    // Calculate product discount total from stored unitDiscount
    const productDiscountTotal = order.items.reduce((sum, item) => {
      const discountTotal = (Number(item.unitDiscount) || 0) * item.quantity;
      return sum + discountTotal;
    }, 0);

    // Original subtotal (before product discounts)
    const originalSubtotal = itemsSubtotal + productDiscountTotal;

    // Coupon discount is total discount minus product discounts
    const couponDiscount = Number(order.totalDiscount) - productDiscountTotal;

    const shippingCost = Number(order.shippingMethod.cost);

    // Total should match order.totalValue
    const total = Number(order.totalValue);

    return {
      originalSubtotal,
      productDiscountTotal,
      couponDiscount,
      itemsSubtotal,
      shippingCost,
      total,
    };
  };

  const orderSummary = calculateOrderSummary();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-sm text-muted-foreground">
              Order #{order.orderNo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Clock className="size-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="size-4 mr-2" />
                Download Invoice
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2">
        <Badge className={getOrderStatusColor(order.orderStatus)}>
          {getStatusIcon(order.orderStatus)}
          {order.orderStatus.charAt(0).toUpperCase() +
            order.orderStatus.slice(1)}
        </Badge>
        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
          {getStatusIcon(order.paymentStatus)}
          {order.paymentStatus.charAt(0).toUpperCase() +
            order.paymentStatus.slice(1)}
        </Badge>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items and Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="border rounded-lg p-4 bg-background">
            <div className="pb-3">
              <h3 className="text-base font-medium flex items-center">
                <Package className="size-5 mr-2" />
                Order Items
              </h3>
            </div>
            <div>
              <div className="space-y-4">
                {order.items.map((item: OrderItem) => {
                  // Convert to numbers explicitly to prevent NaN
                  const unitPrice =
                    Number(item.unitPrice) ||
                    Number(item.product.sellingPrice) ||
                    0;
                  const totalPrice =
                    Number(item.totalPrice) || unitPrice * item.quantity;
                  const unitDiscount = Number(item.unitDiscount) || 0;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-3 rounded-lg border"
                    >
                      {/* Product Image with Link */}
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="relative aspect-video w-24 rounded-md overflow-hidden bg-muted flex-shrink-0 hover:border-primaryColor hover:border transition-colors block"
                      >
                        {/* Loading Skeleton */}
                        {loadingImages.has(String(item.product.id)) && (
                          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                          </div>
                        )}

                        <Image
                          src={
                            item.product.attachment?.url || "/placeholder.svg"
                          }
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          onLoad={() =>
                            handleImageLoad(String(item.product.id))
                          }
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <Link
                              href={`/product/${item.product.slug}`}
                              className="hover:text-primaryColor transition-colors"
                            >
                              <h4 className="font-medium text-sm line-clamp-1">
                                {item.product.name}
                              </h4>
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">
                                {formatCurrencyEnglish(unitPrice)} ×{" "}
                                {item.quantity} {item.product.unit?.name}
                              </span>
                              {unitDiscount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  -{formatCurrencyEnglish(unitDiscount)} off
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {formatCurrencyEnglish(totalPrice)}
                            </p>
                            {unitDiscount > 0 && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatCurrencyEnglish(
                                  (unitPrice + unitDiscount) * item.quantity
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        {item.product.supplier && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Supplier: {item.product.supplier.name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="border rounded-lg p-4 bg-background">
            <div className="pb-3">
              <h3 className="text-base font-medium flex items-center">
                <Clock className="size-5 mr-2" />
                Order Timeline
              </h3>
            </div>
            <div>
              {order.statusTracks && order.statusTracks.length > 0 ? (
                <Timeline>
                  {timelineStatuses.map((status, index) => {
                    const isActive = isStatusActive(status);
                    const timestamp = getStatusTimestamp(status);
                    const note = getStatusNote(status);
                    const updatedBy = getStatusUpdatedBy(status);

                    return (
                      <TimelineItem key={index}>
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
                                  className={`text-sm font-medium ${!isActive ? "text-gray-400" : ""}`}
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
                                  <Badge variant="outline" className="text-xs">
                                    {status === order.orderStatus.toLowerCase()
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
          </div>

          {order.payments && (
            <div className="border rounded-lg p-4 bg-background">
              <div className="pb-3">
                <h3 className="text-base font-medium flex items-center">
                  <CreditCard className="size-5 mr-2" />
                  Payment History
                </h3>
              </div>
              <div>
                <PaymentsTable payments={order.payments} />
              </div>
            </div>
          )}
        </div>

        {/* Customer and Order Summary */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="border rounded-lg p-4 bg-background">
            <div className="pb-3">
              <h3 className="text-base font-medium flex items-center">
                <User className="size-5 mr-2" />
                Customer Information
              </h3>
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="size-10">
                  <AvatarImage
                    src={order.user.profilePhoto?.url || "/placeholder.svg"}
                    alt={order.user.name}
                  />
                  <AvatarFallback>{order.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-medium">{order.user.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {order.user.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm">{order.user.mobileNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border rounded-lg p-4 bg-background">
            <div className="pb-3">
              <h3 className="text-base font-medium flex items-center">
                <MapPin className="size-5 mr-2 text-muted-foreground" />
                Shipping Address
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-sm text-muted-foreground">
                  Name: {order.user.name}
                </p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">
                  Address: {order.address.address}
                </p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">
                  Area / City: {order.address.area}, {order.address.city}
                </p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">
                  Division: {order.address.division}
                </p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">
                  Phone: {order.user.mobileNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Man Information */}
          {order.deliveryMan && (
            <div className="border rounded-lg p-4 bg-background">
              <div className="pb-3">
                <h3 className="text-base font-medium flex items-center">
                  <Truck className="size-5 mr-2 text-muted-foreground" />
                  Delivery Man
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">
                    Name: {order.deliveryMan.name}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">
                    Mobile: {order.deliveryMan.mobileNumber}
                  </p>
                </div>
               
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="border rounded-lg p-4 bg-background">
            <div className="pb-3">
              <h3 className="text-base font-medium flex items-center">
                <FileText className="size-5 mr-2" />
                Order Summary
              </h3>
            </div>
            <div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-sm">
                    {formatCurrencyEnglish(orderSummary.originalSubtotal)}
                  </span>
                </div>
                {orderSummary.productDiscountTotal > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      Product Discounts
                    </span>
                    <span className="text-sm text-green-600">
                      -
                      {formatCurrencyEnglish(orderSummary.productDiscountTotal)}
                    </span>
                  </div>
                )}
                {order.coupon && orderSummary.couponDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Tag className="size-3 mr-1" />
                      Coupon Discount ({order.coupon.code})
                    </span>
                    <span className="text-sm text-green-600">
                      -{formatCurrencyEnglish(orderSummary.couponDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Shipping
                  </span>
                  <span className="text-sm">
                    {formatCurrencyEnglish(orderSummary.shippingCost)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-base">
                  <span>Total</span>
                  <span>{formatCurrencyEnglish(orderSummary.total)}</span>
                </div>
                {order.paymentStatus === "pending" && (
                  <div className="flex justify-between text-red-600 text-sm">
                    <span>Due Amount</span>
                    <span>
                      {formatCurrencyEnglish(
                        order.totalValue - order.paidAmount
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
