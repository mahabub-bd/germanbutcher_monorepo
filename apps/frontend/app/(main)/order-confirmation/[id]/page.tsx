import PayNow from "@/components/payment/pay-now";
import {
  BadgeCheck,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBasket,
  Tag,
  Truck,
  User,
  Wallet,
  XCircle,
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
  getPaymentStatusLabel,
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

// Payment is unsettled — "unpaid" since the rename, legacy "pending" for
// pre-rename rows.
const isUnpaidStatus = (paymentStatus: string): boolean =>
  ["unpaid", "pending"].includes(paymentStatus.toLowerCase());

// Determine if Pay Now button should be shown
const shouldShowPayNow = (order: Order): boolean => {
  const isPending = isUnpaidStatus(order.paymentStatus);
  const isNotCancelled = order.orderStatus.toLowerCase() !== "cancelled";
  const isNotCOD = !isCashOnDelivery(order.paymentMethod.name);
  return isPending && isNotCancelled && isNotCOD;
};

/** Card shell with a round icon-tile header — same design language as the
 * payment status pages (rounded-2xl card, tinted circle icon, subtitle). */
function InfoCard({
  icon: Icon,
  title,
  subtitle,
  tint = "bg-primaryColor/10 text-primaryColor",
  children,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  tint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-sm border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4 md:px-5">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tint}`}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="truncate text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="p-4 md:p-5">{children}</div>
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
      <span className="shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-semibold text-gray-900">
        {children}
      </span>
    </div>
  );
}

/** Icon-led line inside the tinted order-summary block. */
function SummaryLine({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-gray-600">
        <Icon className="size-4 shrink-0 text-gray-400" />
        {label}
      </span>
      <span className="shrink-0 font-semibold text-gray-900">{children}</span>
    </div>
  );
}

/** Soft status pill with leading icon, used in the page header. */
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
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ring-black/5 ${colorClass}`}
    >
      {getStatusIcon(status)}
      {label} &middot; {label === "Payment Status" ? getPaymentStatusLabel(status) : status}
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
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const isCancelled = order.orderStatus.toLowerCase() === "cancelled";

  return (
    <div className="container mx-auto py-6 px-4 space-y-5 md:space-y-6">
      {/* Confirmation hero */}
      <div className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span
              className={`flex size-14 shrink-0 items-center justify-center rounded-full ring-8 ring-gray-50 ${isCancelled
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
                }`}
            >
              {isCancelled ? (
                <XCircle className="size-7" />
              ) : (
                <BadgeCheck className="size-7" />
              )}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl md:text-2xl font-extrabold tracking-tight text-gray-900">
                {isCancelled ? "Order Cancelled" : "Thank You For Your Order!"}
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Order{" "}
                <span className="font-semibold text-gray-700">
                  #{order.orderNo}
                </span>{" "}
                placed on {formatDateTime(order.createdAt)}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Left column: items + payment/shipping info */}
        <div className="lg:col-span-2 space-y-5 md:space-y-6">
          {/* Order Items */}
          <InfoCard
            icon={Package}
            title="Order Items"
            subtitle={`You have ordered ${totalQuantity} item${totalQuantity === 1 ? "" : "s"} from German Butcher.`}
          >
            {items.length === 0 ? (
              <p className="py-2 text-sm text-gray-500">No items on this order.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item: OrderItem) => {
                  const unitPrice = getItemUnitPrice(item);
                  const hasDiscount = getItemUnitDiscount(item) > 0;
                  const flash = isFlashDiscounted(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 md:gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="relative size-14 md:size-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        {item.product.attachment ? (
                          <Image
                            src={item.product.attachment.url || "/placeholder.svg"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="size-5 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-gray-900">
                          {item.product.name}
                        </h4>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                          <span>
                            Qty: {item.quantity} ×{" "}
                            {hasDiscount ? (
                              <span className="line-through">
                                {formatCurrencyEnglish(item.product.sellingPrice)}
                              </span>
                            ) : (
                              formatCurrencyEnglish(unitPrice)
                            )}
                          </span>
                          {hasDiscount && flash && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-[0.7rem] font-semibold text-green-700">
                              <Zap className="size-3 fill-current" />
                              Flash Sale
                            </span>
                          )}
                          {hasDiscount && !flash && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-[0.7rem] font-semibold text-green-700">
                              {item.product.discountType === "percentage"
                                ? `${Number.parseFloat(String(item.product.discountValue))}% OFF`
                                : `${formatCurrencyEnglish(getItemUnitDiscount(item))} OFF`}
                            </span>
                          )}
                          {item.product.weight && item.product.unit?.name && (
                            <span>
                              {formatWeight(
                                item.product.weight,
                                item.product.unit.name
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          {formatCurrencyEnglish(unitPrice * item.quantity)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </InfoCard>

          {/* Payment + Shipping info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoCard
              icon={CreditCard}
              title="Payment Information"
              tint="bg-green-100 text-green-600"
            >
              <InfoRow label="Payment Method">
                {order.paymentMethod.name}
                {isCOD && (
                  <span className="ml-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[0.7rem] font-medium text-blue-700">
                    COD
                  </span>
                )}
              </InfoRow>
              <InfoRow label="Payment Status">
                <span
                  className={`capitalize ${isUnpaidStatus(order.paymentStatus)
                    ? "text-amber-600"
                    : "text-green-600"
                    }`}
                >
                  {getPaymentStatusLabel(order.paymentStatus)}
                </span>
              </InfoRow>
              {order.paidAmount > 0 && (
                <InfoRow label="Amount Paid">
                  <span className="text-green-600">
                    {formatCurrencyEnglish(order.paidAmount)}
                  </span>
                </InfoRow>
              )}
              {isCOD && isUnpaidStatus(order.paymentStatus) && (
                <p className="pt-2.5 text-xs text-gray-500">
                  Payment will be collected upon delivery
                </p>
              )}
            </InfoCard>

            <InfoCard
              icon={Truck}
              title="Shipping Information"
              tint="bg-amber-100 text-amber-600"
            >
              <InfoRow label="Shipping Method">
                {order.shippingMethod.name}
              </InfoRow>
              <InfoRow label="Delivery Time">
                {order.shippingMethod.deliveryTime}
              </InfoRow>
              <InfoRow label="Shipping Cost">
                {orderSummary.shippingCost === 0 ? (
                  <span className="font-bold text-green-600">FREE</span>
                ) : (
                  formatCurrencyEnglish(orderSummary.shippingCost)
                )}
              </InfoRow>
            </InfoCard>
          </div>
        </div>

        {/* Right column: customer, address, summary */}
        <div className="space-y-5 md:space-y-6">
          {/* Customer Information */}
          <InfoCard
            icon={User}
            title="Customer Information"
            tint="bg-blue-100 text-blue-600"
          >
            <div className="flex items-center gap-3">
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
                <div className="truncate text-sm font-bold text-gray-900">
                  {order.user.name}
                </div>
                <div className="truncate text-xs text-gray-500">
                  {order.user.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-gray-400" />
                {order.user.mobileNumber}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="size-4 shrink-0 text-gray-400" />
                <span className="truncate">{order.user.email}</span>
              </div>
            </div>
          </InfoCard>

          {/* Shipping Address */}
          <InfoCard
            icon={MapPin}
            title="Shipping Address"
            subtitle="Your order will be delivered to the address below."
            tint="bg-amber-100 text-amber-600"
          >
            <div className="rounded-xl bg-gray-50 p-3.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-gray-900">{order.user.name}</p>
                {order.address.type && (
                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-600 capitalize">
                    {order.address.type}
                  </span>
                )}
              </div>
              <p className="mt-1 text-gray-600">{order.address.address}</p>
              <p className="text-gray-600">
                {order.address.area}, {order.address.city}
              </p>
              <p className="text-gray-600">{order.address.division}, Bangladesh</p>
            </div>
          </InfoCard>

          {/* Order Summary */}
          <InfoCard icon={FileText} title="Order Summary">
            <div className="space-y-2.5 rounded-xl bg-gray-50 p-4">
              <SummaryLine icon={ShoppingBasket} label="Subtotal">
                {formatCurrencyEnglish(orderSummary.originalSubtotal)}
              </SummaryLine>
              {/* unitDiscount snapshots include BOGO, so show the pure
                  product discount here and list BOGO separately below */}
              {orderSummary.productDiscountTotal -
                orderSummary.bogoDiscountTotal >
                0 && (
                  <SummaryLine icon={Tag} label="Product Discounts">
                    <span className="text-green-600">
                      -{formatCurrencyEnglish(
                        orderSummary.productDiscountTotal -
                        orderSummary.bogoDiscountTotal
                      )}
                    </span>
                  </SummaryLine>
                )}
              {orderSummary.bogoUsages.map((usage) => (
                <SummaryLine
                  key={usage.campaignName}
                  icon={Tag}
                  label={`BOGO — ${usage.campaignName} (${usage.freeUnits} free)`}
                >
                  <span className="text-green-600">
                    -{formatCurrencyEnglish(usage.discount)}
                  </span>
                </SummaryLine>
              ))}
              {order.coupon && orderSummary.couponDiscount > 0 && (
                <SummaryLine icon={Tag} label={`Coupon (${order.coupon.code})`}>
                  <span className="text-green-600">
                    -{formatCurrencyEnglish(orderSummary.couponDiscount)}
                  </span>
                </SummaryLine>
              )}
              <SummaryLine icon={Truck} label="Shipping">
                {orderSummary.shippingCost === 0 ? (
                  <span className="font-bold text-green-600">FREE</span>
                ) : (
                  formatCurrencyEnglish(orderSummary.shippingCost)
                )}
              </SummaryLine>

              <Separator className="bg-gray-200" />

              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-2 text-base font-bold text-gray-900">
                  <Wallet className="size-4.5 text-gray-700" />
                  Total
                </span>
                <span className="text-lg font-extrabold text-gray-900">
                  {formatCurrencyEnglish(orderSummary.total)}
                </span>
              </div>
              {isUnpaidStatus(order.paymentStatus) && !isCOD && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-600">
                    Due Amount
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrencyEnglish(dueAmount)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4">
              {shouldShowPayNow(order) ? (
                <PayNow order={order} className="w-full" />
              ) : (
                <DownloadInvoiceButton order={order} className="w-full" />
              )}
            </div>
            {isCOD && isUnpaidStatus(order.paymentStatus) && (
              <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-center text-xs text-amber-700 ring-1 ring-inset ring-amber-200">
                Payment will be collected when your order is delivered
              </p>
            )}
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
