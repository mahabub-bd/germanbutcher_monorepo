"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
} from "@/utils/order-helper";
import { CustomerData } from "@/utils/types";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  MapPinned,
  Package,
  Phone,
  ShoppingBag,
  TrendingUp,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";

export function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetchProtectedData<CustomerData>(
          `users/${customerId}`
        );
        setCustomer(response);
      } catch (error) {
        console.error("Error fetching customer details:", error);
        toast.error("Failed to load customer details. Please try again.");
        router.push("/admin/customers");
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerDetail();
    }
  }, [customerId, router]);

  const calculateOrderStats = () => {
    if (!customer?.orders) return { total: 0, totalSpent: 0, avgOrder: 0 };

    const totalSpent = customer.orders.reduce((sum, order) => {
      const numericValue =
        parseFloat(order.totalValue?.toString().replace(/[^\d.]/g, "")) || 0;
      return sum + numericValue;
    }, 0);

    return {
      total: customer.orders.length,
      totalSpent,
      avgOrder:
        customer.orders.length > 0 ? totalSpent / customer.orders.length : 0,
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator message="Loading customer details..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="rounded-full bg-muted p-4">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">Customer Not Found</h2>
          <p className="text-sm text-muted-foreground mb-3">
            The customer you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild size="sm">
            <Link href="/admin/customers">
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to Customers
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const orderStats = calculateOrderStats();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto space-y-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold tracking-tight capitalize leading-tight">
              {customer.name}
            </h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-0.5 text-xs">
              <Calendar className="h-3 w-3" />
              Joined {formatDateTime(customer.createdAt)}
            </p>
          </div>
          <Button variant="default" asChild size="sm" className="h-7 text-xs px-2.5">
            <Link href="/admin/customer/customer-list?page=1&limit=10">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Link>
          </Button>
        </div>

        {/* Stats Bar */}
        <Card>
          <CardContent className="px-2 py-2">
            <div className="grid grid-cols-3 divide-x">
              <div className="flex items-center justify-center gap-2 px-1">
                <div className="rounded-full bg-blue-500/10 p-1.5 shrink-0">
                  <ShoppingBag className="h-4 w-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">
                    Total Orders
                  </p>
                  <p className="text-base font-bold leading-tight">
                    {orderStats.total}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 px-1">
                <div className="rounded-full bg-green-500/10 p-1.5 shrink-0">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">
                    Total Spent
                  </p>
                  <p className="text-base font-bold leading-tight">
                    ৳{orderStats.totalSpent.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 px-1">
                <div className="rounded-full bg-purple-500/10 p-1.5 shrink-0">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">
                    Average Order
                  </p>
                  <p className="text-base font-bold leading-tight">
                    ৳
                    {orderStats.avgOrder.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {/* Profile Card */}
            <Card>
              <CardHeader className="pb-1.5 px-3 pt-2.5">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  {customer.profilePhoto ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-background shadow-md shrink-0">
                      <Image
                        src={customer.profilePhoto.url}
                        alt={customer.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold capitalize truncate text-sm leading-tight">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-muted-foreground capitalize leading-tight">
                      {customer.role.rolename}
                    </p>
                    {customer.isVerified && (
                      <Badge variant="default" className="mt-0.5 text-xs h-4 px-1">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-start gap-1.5 p-1.5 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors">
                    <Mail className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs break-all leading-snug">
                      {customer.email}
                    </p>
                  </div>

                  {customer.mobileNumber && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors">
                      <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-xs">{customer.mobileNumber}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/40">
                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Last Login</span>
                      <span className="font-medium">
                        {customer.lastLoginAt
                          ? formatDateTime(customer.lastLoginAt)
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Addresses Card */}
            <Card>
              <CardHeader className="px-3 pt-2.5 pb-1">
                <CardTitle className="flex items-center gap-1.5 text-xs">
                  <MapPinned className="h-3.5 w-3.5" />
                  Saved Addresses
                  <span className="font-normal text-muted-foreground">
                    ({customer.addresses.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {customer.addresses.length === 0 ? (
                  <div className="text-center py-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mx-auto mb-1 opacity-50" />
                    <p className="text-xs text-muted-foreground">
                      No addresses saved yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {customer.addresses.map((address) => (
                      <div
                        key={address.id}
                        className="border rounded-md p-2 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-0.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge
                              variant={
                                address.type === "shipping"
                                  ? "default"
                                  : "secondary"
                              }
                              className="capitalize text-xs h-4 px-1"
                            >
                              {address.type}
                            </Badge>
                            {address.isDefault && (
                              <Badge
                                variant="outline"
                                className="border-green-500 text-green-700 text-xs h-4 px-1"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                        <p className="font-medium text-xs capitalize leading-snug">
                          {address.address}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize leading-snug">
                          {address.area}, {address.city}, {address.division}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-1.5 px-3 pt-2.5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-1.5 text-sm">
                    <Package className="h-4 w-4" />
                    Order History
                    <span className="font-normal text-muted-foreground">
                      ({customer.orders.length})
                    </span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {customer.orders.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="rounded-full bg-muted p-3 w-fit mx-auto mb-2">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm mb-0.5">No Orders Yet</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      This customer hasn't placed any orders.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customer.orders.map((order) => (
                      <Card
                        key={order.id}
                        className="border hover:border-primary/50 transition-colors"
                      >
                        <CardContent className="p-2.5 space-y-2">
                          {/* Order Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <Link
                                href={`/admin/order/${order.id}/view`}
                                className="font-semibold text-sm hover:underline"
                              >
                                {order.orderNo}
                              </Link>
                              <Badge
                                className={`${getOrderStatusColor(
                                  order.orderStatus
                                )} capitalize text-xs h-5 px-1.5`}
                              >
                                {order.orderStatus}
                              </Badge>
                              <Badge
                                className={`${getPaymentStatusColor(
                                  order.paymentStatus
                                )} capitalize text-xs h-5 px-1.5`}
                              >
                                {order.paymentStatus}
                              </Badge>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(order.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-left sm:text-right">
                                <p className="text-base font-bold leading-tight">
                                  ৳{order.totalValue.toLocaleString()}
                                </p>
                                {parseFloat(order.totalDiscount.toString()) > 0 && (
                                  <p className="text-xs text-green-600 font-medium leading-tight">
                                    Saved ৳
                                    {parseFloat(
                                      order.totalDiscount.toString()
                                    ).toFixed(2)}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs"
                                asChild
                              >
                                <Link href={`/admin/order/${order.id}/view`}>
                                  View
                                  <ArrowLeft className="ml-0.5 h-3 w-3 rotate-180" />
                                </Link>
                              </Button>
                            </div>
                          </div>

                          {/* Items Table */}
                          <div className="rounded-md border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="font-medium text-xs h-7">
                                    Product
                                  </TableHead>
                                  <TableHead className="font-medium text-center text-xs h-7">
                                    Qty
                                  </TableHead>
                                  <TableHead className="font-medium text-right text-xs h-7">
                                    Unit Price
                                  </TableHead>
                                  <TableHead className="font-medium text-right text-xs h-7">
                                    Total
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items.map((item) => (
                                  <TableRow key={item.id} className="h-7">
                                    <TableCell className="font-medium capitalize text-xs py-1">
                                      {item.product.name}
                                    </TableCell>
                                    <TableCell className="text-center text-xs py-1">
                                      {item.quantity}
                                    </TableCell>
                                    <TableCell className="text-right text-xs py-1">
                                      ৳{item.unitPrice}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-xs py-1">
                                      ৳{item.totalPrice}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Order Meta */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-0.5 text-xs leading-snug">
                            <p>
                              <span className="text-muted-foreground">
                                Shipping:{" "}
                              </span>
                              <span className="font-medium capitalize">
                                {order.shippingMethod.name} (
                                {Number(
                                  order.shippingCost ?? order.shippingMethod.cost
                                ) === 0
                                  ? "FREE"
                                  : `৳${parseFloat(
                                      String(
                                        order.shippingCost ??
                                          order.shippingMethod.cost
                                      )
                                    ).toFixed(0)}`}
                                )
                              </span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Payment:{" "}
                              </span>
                              <span className="font-medium capitalize">
                                {order.paymentMethod.name}, paid ৳
                                {order.paidAmount}
                              </span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Address:{" "}
                              </span>
                              <span className="font-medium capitalize">
                                {order.address.address}, {order.address.area},{" "}
                                {order.address.city}
                              </span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
