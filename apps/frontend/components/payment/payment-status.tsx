import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { PAYMENT_STATUS_CONFIG } from "@/utils/payment-status-config";
import { Order, OrderItem, PaymentStatusOption } from "@/utils/types";
import { CreditCard, Mail, MapPin, Package, Phone, Tag } from "lucide-react";

interface PaymentStatusPageProps {
  order: Order;
  status: PaymentStatusOption;
  orderId: string;
}

export default function PaymentStatusPage({
  order,
  status,
  orderId,
}: PaymentStatusPageProps) {
  const config = PAYMENT_STATUS_CONFIG[status];
  const IconComponent = config.icon;

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
      shippingCost: Number(order.shippingMethod?.cost ?? 0),
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
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-semibold">{order.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold text-green-600">
                {formatCurrencyEnglish(order.paidAmount)}
              </span>
            </div>
          </div>
        );
      case "failed":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Failed Amount:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrencyEnglish(order.totalValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reason:</span>
                <span className="font-semibold text-red-600">
                  Payment Declined
                </span>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
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
              <div className="flex justify-between">
                <span className="text-gray-600">Canceled Amount:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrencyEnglish(order.totalValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reason:</span>
                <span className="font-semibold text-orange-600">
                  User Canceled
                </span>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
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
    <div className={`min-h-screen bg-linear-to-br ${config.bgGradient} p-4`}>
      <div className="container mx-auto py-8">
        {/* Status Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
            <IconComponent className={`w-12 h-12 ${config.iconColor}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {config.title}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {config.description}
          </p>
          <p className="text-sm text-gray-500 mt-2">Order ID: {orderId}</p>
        </div>

        {/* Payment Details */}
        <Card className={`${config.cardBorder} ${config.cardBg} mb-6`}>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-semibold">#{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <Badge className={config.badgeClass}>
                  <IconComponent className="w-3 h-3 mr-1" />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold">
                  {order.paymentMethod.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-semibold">
                  {formatDateTime(order.updatedAt)}
                </span>
              </div>
            </div>

            <Separator />

            {getStatusSpecificContent()}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    className="flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        <span>×</span>
                        {hasDiscount ? (
                          <div className="flex items-center gap-1">
                            <span className="line-through">
                              {formatCurrencyEnglish(item.product.sellingPrice)}
                            </span>
                            <span className="text-green-600 font-medium">
                              {formatCurrencyEnglish(discountedPrice)}
                            </span>
                          </div>
                        ) : (
                          <span>
                            {formatCurrencyEnglish(item.product.sellingPrice)}
                          </span>
                        )}
                      </div>
                      {hasDiscount && (
                        <Badge
                          variant="outline"
                          className="mt-1 text-[0.7rem] bg-green-100 text-green-800 border-green-200"
                        >
                          {item.product.discountType === "percentage"
                            ? `${item.product.discountValue}% OFF`
                            : `${formatCurrencyEnglish(item.product.discountValue ?? 0)} OFF`}
                        </Badge>
                      )}
                    </div>
                    <span className="font-semibold">
                      {formatCurrencyEnglish(discountedPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {formatCurrencyEnglish(orderSummary.originalSubtotal)}
                  </span>
                </div>

                {orderSummary.productDiscountTotal > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      Product Discounts:
                    </span>
                    <span className="text-green-600">
                      -
                      {formatCurrencyEnglish(orderSummary.productDiscountTotal)}
                    </span>
                  </div>
                )}

                {order.coupon && orderSummary.couponDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      Coupon Discount ({order.coupon.code}):
                    </span>
                    <span className="text-green-600">
                      -{formatCurrencyEnglish(orderSummary.couponDiscount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>
                    {formatCurrencyEnglish(orderSummary.shippingCost)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrencyEnglish(orderSummary.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Delivery Address</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium">{order.user.name}</p>
                  <p>{order.address.address}</p>
                  <p>
                    {order.address.area}, {order.address.city}
                  </p>
                  <p>{order.address.division}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{order.user.mobileNumber}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{order.user.email}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Shipping Method</h4>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{order.shippingMethod.name}</p>
                  <p>{order.shippingMethod.deliveryTime}</p>
                </div>
              </div>

              {status !== "success" && (
                <>
                  <Separator />
                  <div
                    className={`p-3 rounded-md ${
                      status === "failed"
                        ? "bg-red-50 border border-red-200"
                        : "bg-orange-50 border border-orange-200"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        status === "failed" ? "text-red-700" : "text-orange-700"
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
