"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import { CouponUsageLog } from "@/utils/types";
import { getCouponUsageLogById } from "@/lib/coupon-usage-log-service";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Package,
  Tag,
  User,
  FileText,
  ShoppingCart,
  Percent,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export function CouponUsageLogDetail({ logId }: { logId: string | number }) {
  const [log, setLog] = useState<CouponUsageLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      setIsLoading(true);
      try {
        const data = await getCouponUsageLogById(logId);
        setLog(data);
      } catch (error) {
        console.error("Error fetching coupon usage log:", error);
        toast.error("Failed to load usage log. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLog();
  }, [logId]);

  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "processing":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Helper function to format values (handles both string and number)
  const formatValue = (value: number | string): string => {
    return typeof value === 'number' ? value.toFixed(2) : value;
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading coupon usage log details..." />;
  }

  if (!log) {
    return (
      <div className="w-full md:p-6 p-2">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Usage log not found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The requested usage log could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/marketing/coupon/coupon-list">
              Back to Coupons
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:p-6 p-2">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title={`Usage Log #${log.id}`}
          description="View detailed coupon usage information"
        />
        <Button
          className="ml-2 bg-primaryColor text-primary-foreground hover:bg-primary/90"
          asChild
        >
          <Link href="/admin/marketing/coupon/coupon-list">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Coupons
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coupon Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Coupon Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Coupon Code</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono text-sm">
                      {log.couponCode}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Discount Type</label>
                  <div className="font-medium mt-1">
                    {log.discountType === "percentage" ? (
                      <span className="flex items-center gap-1">
                        <Percent className="h-4 w-4" />
                        Percentage
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Fixed Amount
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Discount Value</label>
                  <div className="font-medium mt-1">
                    {log.discountType === "percentage"
                      ? `${formatValue(log.discountValue)}%`
                      : `৳${formatValue(log.discountValue)}`}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Discount Applied</label>
                  <div className="font-medium mt-1 text-green-600">
                    -৳{formatValue(log.discountAmount)}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm text-muted-foreground">Coupon Validity</label>
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div>
                    <span className="text-xs">Valid From:</span>
                    <div className="text-sm">
                      {log.coupon.validFrom ? formatDateTime(log.coupon.validFrom) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs">Valid Until:</span>
                    <div className="text-sm">
                      {log.coupon.validUntil ? formatDateTime(log.coupon.validUntil) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Order Number</label>
                  <div className="font-medium mt-1">
                    <Link
                      href={`/admin/order-management/orders/${log.order.id}`}
                      className="text-blue-600 hover:underline font-mono"
                    >
                      {log.order.orderNo}
                    </Link>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Order Status</label>
                  <div className="mt-1">
                    <Badge variant={getOrderStatusVariant(log.order.orderStatus)}>
                      {log.order.orderStatus}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Payment Status</label>
                  <div className="mt-1">
                    <Badge variant={getPaymentStatusVariant(log.order.paymentStatus)}>
                      {log.order.paymentStatus}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Order Total</label>
                  <div className="font-medium mt-1">৳{formatValue(log.orderTotal)}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Total Discount</label>
                  <div className="font-medium mt-1 text-green-600">
                    -৳{formatValue(log.order.totalDiscount)}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Paid Amount</label>
                  <div className="font-medium mt-1">
                    ৳{log.order.paidAmount ? formatValue(log.order.paidAmount) : '0.00'}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Order Created</label>
                  <div className="text-sm mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateTime(log.order.createdAt)}
                  </div>
                </div>
                {log.order.updatedAt && (
                  <div>
                    <label className="text-sm text-muted-foreground">Last Updated</label>
                    <div className="text-sm mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateTime(log.order.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <div className="font-medium text-sm mt-1">{log.user.name}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </label>
                <div className="text-sm mt-1">{log.user.email}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone
                </label>
                <div className="text-sm mt-1">{log.user.mobileNumber}</div>
              </div>
              {log.user.profilePhoto && (
                <div>
                  <label className="text-xs text-muted-foreground">Profile Photo</label>
                  <div className="mt-2">
                    <img
                      src={log.user.profilePhoto.url}
                      alt={log.user.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Usage Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Usage Log ID</label>
                <div className="font-medium text-sm mt-1">#{log.id}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Used At</label>
                <div className="text-sm mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(log.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/admin/order-management/orders/${log.order.id}`}>
                  <Package className="h-4 w-4 mr-2" />
                  View Order
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/admin/marketing/coupon/${log.couponCode}/usage-logs`}>
                  <FileText className="h-4 w-4 mr-2" />
                  View All Logs for Coupon
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
