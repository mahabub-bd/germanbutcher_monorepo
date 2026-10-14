import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/utils/image-fallback";
import { getDiscountedPrice } from "@/utils/product-utils";
import { PAYMENT_STATUS_CONFIG } from "@/utils/payment-status-config";
import { Order, OrderItem, OrderPayment, PaymentStatusOption } from "@/utils/types";
import {
  Check,
  CreditCard,
  FileText,
  House,
  Mail,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  ShoppingBasket,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PaymentStatusPageProps {
  order: Order;
  status: PaymentStatusOption;
  orderId: string;
}

/** Per-status accent classes for icon tiles, values and pills. */
const ACCENT: Record<
  PaymentStatusOption,
  { soft: string; text: string; solid: string }
> = {
  success: {
    soft: "bg-green-100 text-green-600",
    text: "text-green-600",
    solid: "bg-green-600 text-white",
  },
  failed: {
    soft: "bg-red-100 text-red-600",
    text: "text-red-600",
    solid: "bg-red-600 text-white",
  },
  canceled: {
    soft: "bg-orange-100 text-orange-600",
    text: "text-orange-600",
    solid: "bg-orange-500 text-white",
  },
};

/** Celebration confetti around the hero icon (success only). */
const CONFETTI = [
  { left: "18%", top: "30%", color: "bg-green-500", size: "size-2", rotate: "rotate-12" },
  { left: "26%", top: "62%", color: "bg-emerald-400", size: "size-1.5", rotate: "-rotate-45" },
  { left: "34%", top: "18%", color: "bg-yellow-400", size: "size-2.5", rotate: "rotate-45" },
  { left: "40%", top: "74%", color: "bg-teal-400", size: "size-1.5", rotate: "-rotate-12" },
  { left: "60%", top: "20%", color: "bg-emerald-500", size: "size-2", rotate: "-rotate-45" },
  { left: "66%", top: "64%", color: "bg-yellow-400", size: "size-1.5", rotate: "rotate-12" },
  { left: "74%", top: "34%", color: "bg-green-400", size: "size-2", rotate: "-rotate-12" },
  { left: "80%", top: "58%", color: "bg-teal-500", size: "size-1.5", rotate: "rotate-45" },
];

/** Card header: colored icon tile + title/subtitle, optional right slot. */
function SectionHeader({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  right,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
      {right && <div className="ml-auto shrink-0">{right}</div>}
    </div>
  );
}

/** Icon + label + value cell used in the payment information grid. */
function InfoCell({
  icon: Icon,
  label,
  children,
  withDivider,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  withDivider: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 ${
        withDivider ? "md:border-l md:border-gray-100 md:pl-6" : ""
      }`}
    >
      <Icon className="size-4.5 shrink-0 text-gray-400" />
      <span className="text-sm text-gray-500 whitespace-nowrap">{label}</span>
      <span className="ml-auto text-sm font-semibold text-gray-900 text-right">
        {children}
      </span>
    </div>
  );
}

export default function PaymentStatusPage({
  order,
  status,
  orderId,
}: PaymentStatusPageProps) {
  const config = PAYMENT_STATUS_CONFIG[status];
  const BadgeIcon = config.badgeIcon;
  const accent = ACCENT[status];

  // Some order payloads omit relations — normalize so rendering never
  // crashes on a missing paymentMethod/user/address/shippingMethod.
  const paymentMethod = order.paymentMethod ?? { name: "N/A" };
  const shippingMethod = order.shippingMethod ?? {
    name: "N/A",
    deliveryTime: "N/A",
  };
  const user = order.user ?? {
    name: "N/A",
    email: "",
    mobileNumber: "",
  };
  const address = order.address ?? {
    address: "",
    area: "",
    city: "",
    division: "",
    type: "",
  };

  /** Price actually charged per unit — the order-time snapshot (covers
   * product discounts AND flash sales). Falls back for old orders saved
   * without snapshots. */
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
    return Math.abs(getDiscountedPrice(item.product) - getItemUnitPrice(item)) > 0.01;
  };

  // Some order payloads (e.g. list-shaped responses) omit items — render
  // summary/lines defensively instead of crashing.
  const items = order.items ?? [];
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  /** Latest payment on the order — source for the gateway transaction ID. */
  const latestPayment = (order.payments ?? []).reduce<OrderPayment | undefined>(
    (latest, p) =>
      !latest || new Date(p.createdAt) > new Date(latest.createdAt) ? p : latest,
    undefined,
  );

  /** Real gateway transaction reference when one exists (online payments);
   * falls back to the order number for COD / old records. */
  const transactionId =
    latestPayment?.bankTranId ?? latestPayment?.sslPaymentId ?? order.orderNo;

  const calculateOrderSummary = () => {
    let originalSubtotal = 0;
    let productDiscountTotal = 0;

    items.forEach((item) => {
      const originalItemPrice = item.product.sellingPrice * item.quantity;
      originalSubtotal += originalItemPrice;
      // Snapshot discount per unit (product discount or flash sale)
      productDiscountTotal += getItemUnitDiscount(item) * item.quantity;
    });

    const couponDiscount = order.coupon
      ? Number(order.totalDiscount || 0) - productDiscountTotal
      : 0;

    return {
      originalSubtotal,
      productDiscountTotal,
      couponDiscount,
      shippingCost: Number(order.shippingCost ?? order.shippingMethod?.cost ?? 0),
      total: order.totalValue,
    };
  };

  const orderSummary = calculateOrderSummary();

  const statusBadge = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold animate-in fade-in zoom-in-95 duration-500 ${config.badgeClass}`}
    >
      <span className="flex size-4 items-center justify-center rounded-full bg-current">
        <BadgeIcon className="size-2.5 text-white" strokeWidth={3.5} />
      </span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  const getStatusSpecificContent = () => {
    switch (status) {
      case "failed":
        return (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              <strong>Common reasons for payment failure:</strong>
            </p>
            <ul className="text-xs text-red-600 mt-1 ml-4 list-disc">
              <li>Insufficient funds</li>
              <li>Card expired or invalid</li>
              <li>Network connectivity issues</li>
              <li>Bank security restrictions</li>
            </ul>
          </div>
        );
      case "canceled":
        return (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-700">
              Your order is still reserved for 24 hours. You can complete the
              payment anytime within this period.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-linear-to-b ${config.bgGradient} p-4`}>
      <div className="mx-auto container py-8">
        {/* Hero */}
        <section className="relative text-center mb-8">
          <div className="relative mx-auto mb-5 size-24">
            {status === "success" && (
              <div className="pointer-events-none absolute inset-0">
                {CONFETTI.map((dot, i) => (
                  <span
                    key={i}
                    className={`absolute rounded-[2px] ${dot.color} ${dot.size} ${dot.rotate}`}
                    style={{ left: dot.left, top: dot.top }}
                  />
                ))}
              </div>
            )}
            <span
              className={`absolute left-0 top-0 inline-flex size-24 rounded-full opacity-30 animate-ping ${config.pingClass}`}
            />
            <div
              className={`relative mx-auto flex size-24 items-center justify-center rounded-full text-white ring-8 ring-white/60 animate-in zoom-in-50 fade-in duration-700 ${config.badgeGradient} ${config.badgeShadow}`}
            >
              <BadgeIcon className="size-12" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            {config.title}
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto mb-6">
            {config.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/order-confirmation/${orderId}`}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-md transition hover:opacity-90 ${accent.solid}`}
            >
              <FileText className="size-4" />
              View Order Details
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <Package className="size-4" />
              Continue Shopping
            </Link>
          </div>
        </section>

        {/* Payment Information */}
        <Card className="rounded-2xl shadow-sm border-gray-200 bg-white mb-6">
          <CardContent className="pt-5">
            <div className="border-b border-gray-100 pb-4 mb-5">
              <SectionHeader
                icon={CreditCard}
                iconClass={accent.soft}
                title="Payment Information"
                subtitle="Here are the details of your payment."
                right={statusBadge}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <InfoCell icon={FileText} label="Order Number" withDivider={false}>
                #{order.orderNo}
              </InfoCell>
              <InfoCell icon={ReceiptText} label="Transaction ID" withDivider>
                {transactionId}
              </InfoCell>
              <InfoCell icon={Wallet} label="Date & Time" withDivider>
                {formatDateTime(order.updatedAt)}
              </InfoCell>
              <InfoCell
                icon={CreditCard}
                label="Payment Method"
                withDivider={false}
              >
                {paymentMethod.name}
              </InfoCell>
              <InfoCell
                icon={Check}
                label="Payment Status"
                withDivider
              >
                <span className={accent.text}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </InfoCell>
              <InfoCell icon={Wallet} label="Amount Paid" withDivider>
                <span className={accent.text}>
                  {formatCurrencyEnglish(order.paidAmount)}
                </span>
              </InfoCell>
            </div>

            {getStatusSpecificContent()}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Summary */}
          <Card className="rounded-2xl shadow-sm border-gray-200 bg-white">
            <CardContent className="pt-5">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <SectionHeader
                  icon={Package}
                  iconClass={accent.soft}
                  title="Order Summary"
                  subtitle={`You have ordered ${totalQuantity} items from German Butcher.`}
                />
              </div>

              <div className="divide-y divide-gray-100">
                {items.map((item: OrderItem) => {
                  // Charge-time snapshot — reflects product discount AND flash sale
                  const unitPrice = getItemUnitPrice(item);
                  const hasDiscount = getItemUnitDiscount(item) > 0;

                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Image
                          src={item.product?.attachment?.url || FALLBACK_IMAGE}
                          alt={item.product.name}
                          width={48}
                          height={48}
                          className="size-12 shrink-0 rounded-lg border border-gray-100 object-cover bg-gray-50"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                            <span>
                              Qty: {item.quantity} ×{" "}
                              {hasDiscount ? (
                                <span className="line-through">
                                  {formatCurrencyEnglish(item.product.sellingPrice)}
                                </span>
                              ) : (
                                formatCurrencyEnglish(item.product.sellingPrice)
                              )}
                            </span>
                            {hasDiscount && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-[0.7rem] font-semibold text-green-700">
                                {isFlashDiscounted(item) ? (
                                  <>
                                    ⚡ Flash Sale
                                  </>
                                ) : item.product.discountType === "percentage" ? (
                                  `${Number.parseFloat(String(item.product.discountValue))}% OFF`
                                ) : (
                                  `${formatCurrencyEnglish(getItemUnitDiscount(item))} OFF`
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrencyEnglish(unitPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2.5 rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <ShoppingBasket className="size-4 text-gray-400" />
                    Subtotal ({totalQuantity} items)
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrencyEnglish(orderSummary.originalSubtotal)}
                  </span>
                </div>

                {orderSummary.productDiscountTotal > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Tag className="size-4 text-gray-400" />
                      Product Discounts
                    </span>
                    <span className="font-semibold text-green-600">
                      -{formatCurrencyEnglish(orderSummary.productDiscountTotal)}
                    </span>
                  </div>
                )}

                {order.coupon && orderSummary.couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Tag className="size-4 text-gray-400" />
                      Coupon Discount ({order.coupon.code})
                    </span>
                    <span className="font-semibold text-green-600">
                      -{formatCurrencyEnglish(orderSummary.couponDiscount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Truck className="size-4 text-gray-400" />
                    Shipping
                  </span>
                  {orderSummary.shippingCost === 0 ? (
                    <span className="font-bold text-green-600">FREE</span>
                  ) : (
                    <span className="font-semibold text-gray-900">
                      {formatCurrencyEnglish(orderSummary.shippingCost)}
                    </span>
                  )}
                </div>

                <Separator className="bg-gray-200" />

                <div className="flex justify-between pt-1">
                  <span className="flex items-center gap-2 text-base font-bold text-gray-900">
                    <Wallet className="size-4.5 text-gray-700" />
                    Total Paid
                  </span>
                  <span className={`text-lg font-extrabold ${accent.text}`}>
                    {formatCurrencyEnglish(orderSummary.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="rounded-2xl shadow-sm border-gray-200 bg-white">
            <CardContent className="pt-5">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <SectionHeader
                  icon={MapPin}
                  iconClass="bg-amber-100 text-amber-600"
                  title="Delivery Information"
                  subtitle="Your order will be delivered to the address below."
                />
              </div>

              <div className="space-y-4">
                {/* Delivery Address */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <House className="size-4 text-gray-400" />
                    <h4 className="text-sm font-bold text-gray-900">
                      Delivery Address
                    </h4>
                    {address.type && (
                      <span className="ml-auto rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-600">
                        {address.type}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3.5 text-sm">
                    <p className="font-bold text-gray-900">{user.name}</p>
                    <p className="text-gray-600">{address.address}</p>
                    <p className="text-gray-600">
                      {address.area}, {address.city}
                    </p>
                    <p className="text-gray-600">
                      {address.division}, Bangladesh
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="size-4 text-gray-400" />
                    <h4 className="text-sm font-bold text-gray-900">
                      Contact Information
                    </h4>
                    {user.mobileNumber && (
                      <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-700">
                        <Phone className="size-3" />
                        {user.mobileNumber}
                      </span>
                    )}
                  </div>
                  {user.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="size-4 text-gray-400" />
                      {user.email}
                    </div>
                  )}
                </div>

                {/* Shipping Method */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="size-4 text-gray-400" />
                    <h4 className="text-sm font-bold text-gray-900">
                      Shipping Method
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {shippingMethod.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {shippingMethod.deliveryTime}
                      </p>
                    </div>
                    <Truck className="ml-auto size-5 shrink-0 text-gray-400" />
                  </div>
                </div>

                {status !== "success" && (
                  <div
                    className={`p-3 rounded-lg ${status === "failed"
                      ? "bg-red-50 border border-red-200"
                      : "bg-orange-50 border border-orange-200"
                      }`}
                  >
                    <p
                      className={`text-sm ${status === "failed" ? "text-red-700" : "text-orange-700"
                        }`}
                    >
                      {status === "failed"
                        ? "Order delivery is on hold until payment is completed."
                        : "Your items are reserved. Complete payment to start processing."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
