import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/utils/image-fallback";
import { PAYMENT_STATUS_CONFIG } from "@/utils/payment-status-config";
import { Order, OrderItem, PaymentStatusOption } from "@/utils/types";
import {
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  Tag,
} from "lucide-react";
import Image from "next/image";

interface PaymentStatusPageProps {
  order: Order;
  status: PaymentStatusOption;
  orderId: string;
}

/** Label/value row used inside the payment information card. */
function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">
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

  const calculateOrderSummary = () => {
    let originalSubtotal = 0;
    let productDiscountTotal = 0;

    order.items.forEach((item) => {
      const originalItemPrice = item.product.sellingPrice * item.quantity;
      originalSubtotal += originalItemPrice;

      // Only calculate discount if it's valid and not expired
      const hasValidDiscount =
        item.product.discountValue &&
        item.product.discountValue > 0 &&
        item.product.discountStartDate &&
        item.product.discountEndDate &&
        new Date(item.product.discountStartDate) <= new Date() &&
        new Date(item.product.discountEndDate) >= new Date();

      if (hasValidDiscount) {
        let discountAmount = 0;
        if (item.product.discountType === "percentage") {
          discountAmount =
            originalItemPrice * (Number(item.product.discountValue) / 100);
        } else if (item.product.discountType === "fixed") {
          discountAmount = Number(item.product.discountValue) * item.quantity;
        }
        productDiscountTotal += discountAmount;
      }
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

  const calculateDiscountedPrice = (
    price: number,
    discountType: string,
    discountValue: string
  ) => {
    if (discountType === "percentage") {
      return price - price * (Number.parseFloat(discountValue) / 100);
    }
    return price - Number.parseFloat(discountValue);
  };

  const getStatusSpecificContent = () => {
    switch (status) {
      case "success":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Transaction ID:">
              {order.orderNo}
            </InfoRow>
            <InfoRow label="Amount Paid:">
              <span className="text-green-600">
                {formatCurrencyEnglish(order.paidAmount)}
              </span>
            </InfoRow>
          </div>
        );
      case "failed":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Failed Amount:">
                <span className="text-red-600">
                  {formatCurrencyEnglish(order.totalValue)}
                </span>
              </InfoRow>
              <InfoRow label="Reason:">
                <span className="text-red-600">Payment Declined</span>
              </InfoRow>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
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
          </div>
        );
      case "canceled":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Canceled Amount:">
                <span className="text-orange-600">
                  {formatCurrencyEnglish(order.totalValue)}
                </span>
              </InfoRow>
              <InfoRow label="Reason:">
                <span className="text-orange-600">User Canceled</span>
              </InfoRow>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-700">
                Your order is still reserved for 24 hours. You can complete the
                payment anytime within this period.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-linear-to-b ${config.bgGradient} p-4`}>
      <div className="mx-auto container py-8">
        {/* Status Header */}
        <div className="relative text-center mb-8">
          {/* soft radial glow behind the header */}
          <div
            className={`pointer-events-none absolute left-1/2 top-0 -z-10 size-64 -translate-x-1/2 -translate-y-6 rounded-full opacity-25 blur-3xl ${config.pingClass}`}
          />

          <div className="relative mx-auto mb-5 size-24">
            <span
              className={`absolute left-0 top-0 inline-flex size-24 rounded-full opacity-30 animate-ping ${config.pingClass}`}
            />
            <div
              className={`relative mx-auto flex size-24 items-center justify-center rounded-full text-white animate-in zoom-in-50 fade-in duration-700 ${config.badgeGradient} ${config.badgeShadow}`}
            >
              <BadgeIcon className="size-12" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            {config.title}
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            {config.description}
          </p>
        </div>

        {/* Payment Details */}
        <Card
          className={`rounded-xl shadow-sm border ${config.cardBorder} ${config.cardBg} mb-6`}
        >
          <CardContent className="pt-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              <CreditCard className="size-4.5 text-gray-700" />
              Payment Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
              <InfoRow label="Order Number:">#{order.orderNo}</InfoRow>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">Payment Status:</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-500 ${config.badgeClass}`}
                >
                  <span className="size-1.5 rounded-full bg-current animate-pulse" />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
              <InfoRow label="Payment Method:">
                {order.paymentMethod.name}
              </InfoRow>
              <InfoRow label="Date & Time:">
                {formatDateTime(order.updatedAt)}
              </InfoRow>
            </div>

            <Separator className="my-4" />

            {getStatusSpecificContent()}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Summary */}
          <Card className="rounded-xl shadow-sm border-gray-200">
            <CardContent className="pt-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
                <Package className="size-4.5 text-gray-700" />
                Order Summary
              </h2>

              <div className="divide-y divide-gray-100">
                {order.items.map((item: OrderItem) => {
                  // Check if discount is valid and not expired
                  const hasValidDiscount =
                    item.product.discountValue &&
                    item.product.discountValue > 0 &&
                    item.product.discountStartDate &&
                    item.product.discountEndDate &&
                    new Date(item.product.discountStartDate) <= new Date() &&
                    new Date(item.product.discountEndDate) >= new Date();

                  const discountedPrice = hasValidDiscount
                    ? calculateDiscountedPrice(
                      item.product.sellingPrice,
                      item.product.discountType ?? "",
                      (item.product.discountValue ?? 0).toString()
                    )
                    : item.product.sellingPrice;

                  const hasDiscount = hasValidDiscount;

                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-start gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Image
                          src={item.product?.attachment?.url || FALLBACK_IMAGE}
                          alt={item.product.name}
                          width={40}
                          height={40}
                          className="size-10 shrink-0 rounded-lg border border-gray-100 object-cover bg-gray-50"
                        />
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                            <span>
                              Qty: {item.quantity} ×{" "}
                              {hasDiscount ? (
                                <span className="line-through">
                                  {formatCurrencyEnglish(item.product.sellingPrice)}
                                </span>
                              ) : (
                                <span>
                                  {formatCurrencyEnglish(item.product.sellingPrice)}
                                </span>
                              )}
                            </span>
                            {hasDiscount && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[0.7rem] font-medium text-green-800">
                                {item.product.discountType === "percentage"
                                  ? `${item.product.discountValue}% OFF`
                                  : `${formatCurrencyEnglish(item.product.discountValue ?? 0)} OFF`}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrencyEnglish(discountedPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrencyEnglish(orderSummary.originalSubtotal)}
                  </span>
                </div>

                {orderSummary.productDiscountTotal > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <Tag className="size-3.5" />
                      Product Discounts:
                    </span>
                    <span className="font-medium text-green-600">
                      -
                      {formatCurrencyEnglish(orderSummary.productDiscountTotal)}
                    </span>
                  </div>
                )}

                {order.coupon && orderSummary.couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <Tag className="size-3.5" />
                      Coupon Discount ({order.coupon.code}):
                    </span>
                    <span className="font-medium text-green-600">
                      -{formatCurrencyEnglish(orderSummary.couponDiscount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  {orderSummary.shippingCost === 0 ? (
                    <span className="font-semibold text-green-600">FREE</span>
                  ) : (
                    <span className="font-medium text-gray-900">
                      {formatCurrencyEnglish(orderSummary.shippingCost)}
                    </span>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between pt-1">
                  <span className="text-base font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {formatCurrencyEnglish(orderSummary.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="rounded-xl shadow-sm border-gray-200">
            <CardContent className="pt-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
                <MapPin className="size-4.5 text-gray-700" />
                Delivery Information
              </h2>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Delivery Address
                </h4>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-900">
                    {order.user.name}
                  </p>
                  <p>{order.address.address}</p>
                  <p>
                    {order.address.area}, {order.address.city}
                  </p>
                  <p>{order.address.division}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Contact Information
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-gray-400" />
                    <span>{order.user.mobileNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-gray-400" />
                    <span>{order.user.email}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Shipping Method
                </h4>
                <div className="text-sm text-gray-600">
                  <p>{order.shippingMethod.name}</p>
                  <p>{order.shippingMethod.deliveryTime}</p>
                </div>
              </div>

              {status !== "success" && (
                <>
                  <Separator className="my-4" />
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
