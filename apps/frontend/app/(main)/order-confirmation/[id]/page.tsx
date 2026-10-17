import PayNow from "@/components/payment/pay-now";
import {
  Building,
  CreditCard,
  FileText,
  Home,
  Map,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

import { DownloadInvoiceButton } from "@/components/admin/orders/download-invoice-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyEnglish, formatDateTime, formatWeight } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
  getStatusIcon,
} from "@/utils/order-helper";
import { getDiscountedPrice } from "@/utils/product-utils";
import type { Order, OrderItem } from "@/utils/types";

// Payment method constants
const PAYMENT_METHODS = {
  CASH_ON_DELIVERY: "cash on delivery",
  COD: "cod",
} as const;

async function fetchOrder(id: string) {
  try {
    const order = await fetchProtectedData<Order>(`orders/${id}`);
    return order;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

/** Price actually charged per unit — the order-time snapshot (covers product
 * discounts AND flash sales). Falls back for old orders without snapshots. */
const getItemUnitPrice = (item: OrderItem): number =>
  item.unitPrice ?? item.product.sellingPrice;

const getItemUnitDiscount = (item: OrderItem): number =>
  item.unitDiscount ?? 0;

/** The order payload doesn't carry flash-campaign info, so infer it: the
 * discount came from a flash sale when the charged snapshot doesn't match
 * the product's own-discount price. */
const isFlashDiscounted = (item: OrderItem): boolean => {
  if (getItemUnitDiscount(item) <= 0) return false;
  if (item.product.flashSale) return true;
  return (
    Math.abs(getDiscountedPrice(item.product) - getItemUnitPrice(item)) > 0.01
  );
};

// Check if payment method is Cash on Delivery
const isCashOnDelivery = (paymentMethod: string): boolean => {
  const method = paymentMethod.toLowerCase();
  return (
    method === PAYMENT_METHODS.CASH_ON_DELIVERY ||
    method === PAYMENT_METHODS.COD
  );
};

// Determine if Pay Now button should be shown
const shouldShowPayNow = (order: Order): boolean => {
  const isPending = order.paymentStatus.toLowerCase() === "pending";
  const isNotCancelled = order.orderStatus.toLowerCase() !== "cancelled";
  const isNotCOD = !isCashOnDelivery(order.paymentMethod.name);
  return isPending && isNotCancelled && isNotCOD;
};

/** Card shell with an icon + title header. */
function InfoCard({
  icon: Icon,
  title,
  children,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-sm border border-gray-200 bg-white p-4 md:p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 pb-3 mb-1 border-b border-gray-100">
        <Icon className="size-4.5 text-gray-700" />
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/** Dashed-divider label / value row used across the info cards. */
function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-gray-100 py-2.5 last:border-0 last:pb-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">
        {children}
      </span>
    </div>
  );
}

/** Iconed address row (mockup style). */
function AddressRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="w-20 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-right text-sm font-medium text-gray-900 truncate">
        {value}
      </span>
    </div>
  );
}

/** Amber/colored status pill used in the page header. */
function StatusPill({
  label,
  status,
  colorClass,
}: {
  label: string;
  status: string;
  colorClass: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${colorClass}`}
    >
      {getStatusIcon(status)}
      {label} &middot; {status}
    </span>
  );
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await fetchOrder(id);

  if (!order) {
    notFound();
  }

  // Defensive: some order payloads omit items — don't crash rendering.
  const items = order.items ?? [];

  const calculateOrderSummary = () => {
    let originalSubtotal = 0;
    let productDiscountTotal = 0;

    items.forEach((item) => {
      const originalItemPrice = item.product.sellingPrice * item.quantity;
      originalSubtotal += originalItemPrice;
      // Snapshot discount per unit (product discount or flash sale)
      productDiscountTotal += getItemUnitDiscount(item) * item.quantity;
    });

    // BOGO usage recorded per campaign for this order (backend-attached)
    const bogoUsages = (order.bogoUsage ?? []).map((usage) => ({
      campaignName: usage.campaignName,
      discount: Number(usage.discountAmount),
      freeUnits: usage.freeUnits,
    }));
    const bogoDiscountTotal = bogoUsages.reduce(
      (sum, usage) => sum + usage.discount,
      0
    );

    // Coupon takes whatever the total discount snapshot leaves after the
    // per-item discounts and BOGO
    const couponDiscount = order.coupon
      ? Math.max(
        Number(order.totalDiscount) -
          productDiscountTotal -
          bogoDiscountTotal,
        0
      )
      : 0;

    return {
      originalSubtotal,
      productDiscountTotal,
      bogoUsages,
      bogoDiscountTotal,
      couponDiscount,
      shippingCost: Number(order.shippingCost ?? order.shippingMethod.cost),
      total: order.totalValue,
    };
  };

  const orderSummary = calculateOrderSummary();
  const isCOD = isCashOnDelivery(order.paymentMethod.name);
  const dueAmount = order.totalValue - (order.paidAmount || 0);

  return (
    <div className="container mx-auto py-6 px-4 space-y-5">
      {/* Order Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-sm border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-red-50">
            <FileText className="size-6 text-red-500" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900">
              Order-{order.orderNo}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <StatusPill
            label="Order Status"
            status={order.orderStatus}
            colorClass={getOrderStatusColor(order.orderStatus)}
          />
          <StatusPill
            label="Payment Status"
            status={order.paymentStatus}
            colorClass={getPaymentStatusColor(order.paymentStatus)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: items + payment/shipping info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order Items */}
          <InfoCard icon={Package} title="Order Items">
            <div className="space-y-3 pt-2">
              {items.map((item: OrderItem) => {
                const unitPrice = getItemUnitPrice(item);
                const hasDiscount = getItemUnitDiscount(item) > 0;
                const flash = isFlashDiscounted(item);
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 md:gap-4 rounded-sm border border-gray-200 p-3 transition-colors hover:border-gray-300"
                  >
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-muted">
                      {item.product.attachment ? (
                        <Image
                          src={item.product.attachment.url || "/placeholder.svg"}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {item.product.name}
                      </h4>
                      {item.product.description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {item.product.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {hasDiscount && flash && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-[0.7rem] font-medium text-green-800">
                            <Zap className="size-3 fill-current" />
                            Flash Sale
                          </span>
                        )}
                        {hasDiscount && !flash && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-[0.7rem] font-medium text-green-800">
                            {item.product.discountType === "percentage"
                              ? `${Number.parseFloat(String(item.product.discountValue))}% OFF`
                              : `${formatCurrencyEnglish(getItemUnitDiscount(item))} OFF`}
                          </span>
                        )}
                        {item.product.weight && item.product.unit?.name && (
                          <span className="text-xs text-muted-foreground">
                            {formatWeight(
                              item.product.weight,
                              item.product.unit.name
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="flex items-baseline justify-end gap-2">
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrencyEnglish(item.product.sellingPrice)}
                          </span>
                        )}
                        <span
                          className={`text-base font-bold ${hasDiscount ? "text-red-600" : "text-gray-900"}`}
                        >
                          {formatCurrencyEnglish(unitPrice)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        &times; {item.quantity}{" "}
                        {item.product.unit?.name || "pc"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </InfoCard>

          {/* Payment + Shipping info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoCard icon={CreditCard} title="Payment Information">
              <div className="pt-1">
                <InfoRow label="Payment Method">
                  {order.paymentMethod.name}
                  {isCOD && (
                    <span className="ml-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[0.7rem] font-medium text-blue-700">
                      COD
                    </span>
                  )}
                </InfoRow>
                <InfoRow label="Payment Status">
                  <span className="capitalize">{order.paymentStatus}</span>
                </InfoRow>
                {order.paidAmount > 0 && (
                  <InfoRow label="Amount Paid">
                    <span className="text-green-600">
                      {formatCurrencyEnglish(order.paidAmount)}
                    </span>
                  </InfoRow>
                )}
                {isCOD && order.paymentStatus.toLowerCase() === "pending" && (
                  <p className="pt-2 text-xs text-muted-foreground">
                    Payment will be collected upon delivery
                  </p>
                )}
              </div>
            </InfoCard>

            <InfoCard icon={Truck} title="Shipping Information">
              <div className="pt-1">
                <InfoRow label="Shipping Method">
                  {order.shippingMethod.name}
                </InfoRow>
                <InfoRow label="Delivery Time">
                  {order.shippingMethod.deliveryTime}
                </InfoRow>
                <InfoRow label="Shipping Cost">
                  {orderSummary.shippingCost === 0 ? (
                    <span className="font-semibold text-green-600">FREE</span>
                  ) : (
                    formatCurrencyEnglish(orderSummary.shippingCost)
                  )}
                </InfoRow>
              </div>
            </InfoCard>
          </div>
        </div>

        {/* Right column: customer, address, summary */}
        <div className="space-y-5">
          {/* Customer Information */}
          <InfoCard icon={User} title="Customer Information">
            <div className="flex items-center gap-3 py-2">
              <Avatar className="size-11 shrink-0 border border-gray-200">
                <AvatarImage
                  src={
                    order.user.profilePhoto?.url ||
                    "/placeholder.svg?height=44&width=44"
                  }
                  alt={order.user.name}
                />
                <AvatarFallback className="bg-gray-100 text-sm font-semibold text-gray-600">
                  {order.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">
                  {order.user.name}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {order.user.email}
                </div>
              </div>
            </div>
            <div className="mt-1 border-t border-gray-100 pt-2">
              <InfoRow label="Phone">{order.user.mobileNumber}</InfoRow>
            </div>
          </InfoCard>

          {/* Shipping Address */}
          <InfoCard icon={MapPin} title="Shipping Address">
            <div className="pt-1">
              <AddressRow
                icon={User}
                label="Name"
                value={order.user.name}
              />
              <AddressRow
                icon={Home}
                label="Address"
                value={order.address.address}
              />
              <AddressRow
                icon={Building}
                label="Area / City"
                value={`${order.address.area}, ${order.address.city}`}
              />
              <AddressRow
                icon={Map}
                label="Division"
                value={order.address.division}
              />
              <AddressRow
                icon={Phone}
                label="Phone"
                value={order.user.mobileNumber}
              />
            </div>
          </InfoCard>

          {/* Order Summary */}
          <InfoCard icon={FileText} title="Order Summary">
            <div className="pt-1">
              <InfoRow label="Subtotal">
                {formatCurrencyEnglish(orderSummary.originalSubtotal)}
              </InfoRow>
              {/* unitDiscount snapshots include BOGO, so show the pure
                  product discount here and list BOGO separately below */}
              {orderSummary.productDiscountTotal -
                orderSummary.bogoDiscountTotal >
                0 && (
                <InfoRow
                  label="Product Discounts"
                >
                  <span className="text-green-600">
                    -{formatCurrencyEnglish(
                      orderSummary.productDiscountTotal -
                        orderSummary.bogoDiscountTotal
                    )}
                  </span>
                </InfoRow>
              )}
              {orderSummary.bogoUsages.map((usage) => (
                <InfoRow
                  key={usage.campaignName}
                  label={`BOGO — ${usage.campaignName} (${usage.freeUnits} free)`}
                >
                  <span className="text-green-600">
                    -{formatCurrencyEnglish(usage.discount)}
                  </span>
                </InfoRow>
              ))}
              {order.coupon && orderSummary.couponDiscount > 0 && (
                <InfoRow label={`Coupon (${order.coupon.code})`}>
                  <span className="text-green-600">
                    -{formatCurrencyEnglish(orderSummary.couponDiscount)}
                  </span>
                </InfoRow>
              )}
              <InfoRow label="Shipping">
                {orderSummary.shippingCost === 0 ? (
                  <span className="font-semibold text-green-600">FREE</span>
                ) : (
                  formatCurrencyEnglish(orderSummary.shippingCost)
                )}
              </InfoRow>

              <Separator className="my-3" />

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900">
                  {formatCurrencyEnglish(orderSummary.total)}
                </span>
              </div>
              {order.paymentStatus.toLowerCase() === "pending" && !isCOD && (
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-red-600">
                    Due Amount
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrencyEnglish(dueAmount)}
                  </span>
                </div>
              )}

              <div className="mt-4">
                {shouldShowPayNow(order) ? (
                  <PayNow order={order} className="w-full" />
                ) : (
                  <DownloadInvoiceButton order={order} className="w-full" />
                )}
              </div>
              {isCOD && order.paymentStatus.toLowerCase() === "pending" && (
                <p className="mt-3 rounded-sm bg-amber-50 p-2.5 text-center text-xs text-muted-foreground">
                  Payment will be collected when your order is delivered
                </p>
              )}
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
