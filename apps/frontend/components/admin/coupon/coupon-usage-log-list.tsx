"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllCouponUsageLogs,
  getCouponUsageLogsByCode,
  getCouponUsageStats,
} from "@/lib/coupon-usage-log-service";
import { formatDateTime } from "@/lib/utils";
import { CouponUsageLog } from "@/utils/types";
import { ArrowLeft, Calendar, DollarSign, Eye, MoreHorizontal, Package, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export function CouponUsageLogList({ couponCode }: { couponCode?: string }) {
  const [logs, setLogs] = useState<CouponUsageLog[]>([]);
  const [stats, setStats] = useState<{
    totalUses: number;
    totalDiscountGiven: number | string;
    avgDiscountAmount: number | string;
    totalOrderValue: number | string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const logs = couponCode
        ? await getCouponUsageLogsByCode(couponCode)
        : await getAllCouponUsageLogs();
      setLogs(logs);

      // Fetch stats if couponCode is provided
      if (couponCode) {
        try {
          const statsData = await getCouponUsageStats(couponCode);
          setStats(statsData);
        } catch (error) {
          console.error("Error fetching stats:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching coupon usage logs:", error);
      toast.error("Failed to load usage logs. Please try again.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [couponCode]);

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
    return typeof value === 'number' ? value.toString() : value;
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading coupon usage logs..." />;
  }

  return (
    <div className="w-full md:p-6 p-2">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title={couponCode ? `Usage Logs: ${couponCode}` : "Coupon Usage Logs"}
          description={couponCode ? "View coupon usage history and statistics" : "View all coupon usage history"}
        />
        <Button className="ml-2 bg-primaryColor text-primary-foreground hover:bg-primary/90" asChild>
          <Link href="/admin/marketing/coupon/coupon-list">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Coupons
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Discount Given</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{formatValue(stats.totalDiscountGiven)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Discount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{formatValue(stats.avgDiscountAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{formatValue(stats.totalOrderValue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Logs Table */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No usage logs found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This coupon hasn't been used yet.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coupon Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Order Total</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Used At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    <Badge variant="outline" className="font-mono">
                      {log.couponCode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{log.user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/order-management/orders/${log.order.id}`}
                      className="text-blue-600 hover:underline font-mono text-sm"
                    >
                      {log.order.orderNo}
                    </Link>
                  </TableCell>
                  <TableCell>৳{formatValue(log.orderTotal)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        -৳{formatValue(log.discountAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.discountType === "percentage" ? "Percentage" : "Fixed"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getOrderStatusVariant(log.order.orderStatus)}>
                      {log.order.orderStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusVariant(log.order.paymentStatus)}>
                      {log.order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/marketing/coupon/usage-logs/${log.id}/view`}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/order-management/orders/${log.order.id}`}
                          >
                            <Package className="mr-2 h-4 w-4" /> View Order
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <div className="text-xs text-muted-foreground">
          {logs.length} {logs.length === 1 ? "usage log" : "usage logs"}
        </div>
      </div>
    </div>
  );
}
