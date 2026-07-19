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
import { formatDateTime } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
} from "@/utils/order-helper";
import type { DeliveryMan } from "@/utils/types";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Phone,
  ShoppingBag,
  TrendingUp,
  User,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";

export function DeliveryManDetail() {
  const params = useParams();
  const router = useRouter();
  const deliveryManId = params?.id as string;

  const [deliveryMan, setDeliveryMan] = useState<DeliveryMan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveryManDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetchProtectedData<DeliveryMan>(
          `delivery-man/${deliveryManId}`
        );
        setDeliveryMan(response);
      } catch (error) {
        console.error("Error fetching delivery man details:", error);
        toast.error("Failed to load delivery man details. Please try again.");
        router.push("/admin/delivery-man");
      } finally {
        setIsLoading(false);
      }
    };

    if (deliveryManId) {
      fetchDeliveryManDetail();
    }
  }, [deliveryManId, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator message="Loading delivery man details..." />
      </div>
    );
  }

  if (!deliveryMan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="rounded-full bg-muted p-4">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">Delivery Man Not Found</h2>
          <p className="text-sm text-muted-foreground mb-3">
            The delivery man you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild size="sm">
            <Link href="/admin/delivery-man">
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to Delivery Men
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const orders = deliveryMan.orders || [];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto space-y-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold tracking-tight capitalize">
              {deliveryMan.name}
            </h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-0.5 text-xs">
              <Calendar className="h-3 w-3" />
              Joined {formatDateTime(deliveryMan.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild size="sm" className="h-7 text-xs px-2.5">
              <Link href={`/admin/delivery-man/${deliveryMan.id}/edit`}>
                Edit
              </Link>
            </Button>
            <Button variant="default" asChild size="sm" className="h-7 text-xs px-2.5">
              <Link href="/admin/delivery-man">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-2 pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Deliveries</p>
                  <p className="text-xl font-bold">{deliveryMan.totalDeliveries}</p>
                </div>
                <div className="rounded-full bg-blue-500/10 p-1.5 shrink-0">
                  <Package className="h-3.5 w-3.5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-2 pb-2">
              <div className="flex items-center justify-between gap-2">
               
                <div className="rounded-full bg-green-500/10 p-1.5 shrink-0">
                  <Wallet className="h-3.5 w-3.5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-2 pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-xl font-bold capitalize">
                    {deliveryMan.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className={`rounded-full p-1.5 shrink-0 ${
                  deliveryMan.isActive
                    ? "bg-green-500/10"
                    : "bg-gray-500/10"
                }`}>
                  {deliveryMan.isActive ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {/* Profile Card */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md shrink-0">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold capitalize truncate text-xs">
                      {deliveryMan.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Delivery Man
                    </p>
                    <Badge
                      variant={deliveryMan.isActive ? "default" : "secondary"}
                      className="mt-0.5 text-xs h-4 px-1"
                    >
                      {deliveryMan.isActive ? (
                        <>
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                          Active
                        </>
                      ) : (
                        <>
                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors">
                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-xs">{deliveryMan.mobileNumber}</p>
                  </div>

                  <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/40">
                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Joined</span>
                      <span className="font-medium">
                        {formatDateTime(deliveryMan.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/40">
                    <TrendingUp className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Avg. Earning/Delivery</span>
                      <span className="font-medium">
                        ৳
                        {deliveryMan.totalDeliveries > 0
                          ? (deliveryMan.totalEarnings / deliveryMan.totalDeliveries).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <ShoppingBag className="h-4 w-4" />
                      Assigned Orders
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-xs">
                      Orders assigned for delivery
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {orders.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {orders.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-3">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">No Orders Assigned</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      This delivery man hasn't been assigned any orders yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orders.map((order) => (
                      <Card
                        key={order.id}
                        className="border-2 hover:border-primary/50 transition-all"
                      >
                        <CardContent className="p-3 space-y-2.5">
                          {/* Order Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-base">
                                  {order.orderNo}
                                </h4>
                                <Badge
                                  className={`${getOrderStatusColor(
                                    order.orderStatus
                                  )} capitalize text-xs h-5`}
                                >
                                  {order.orderStatus}
                                </Badge>
                                <Badge
                                  className={`${getPaymentStatusColor(
                                    order.paymentStatus
                                  )} capitalize text-xs h-5`}
                                >
                                  {order.paymentStatus}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(order.createdAt)}
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-xs text-muted-foreground">
                                Order Total
                              </p>
                              <p className="text-xl font-bold">
                                ৳{order.totalValue.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Order Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                            <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                              <p className="text-xs font-medium text-blue-700 mb-0.5">
                                Order Value
                              </p>
                              <p className="font-semibold text-xs">
                                ৳{Number(order.totalValue).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.totalDiscount > 0 ? `Discount: ৳${Number(order.totalDiscount).toLocaleString()}` : "No discount"}
                              </p>
                            </div>

                            <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/20">
                              <p className="text-xs font-medium text-green-700 mb-0.5">
                                Payment Status
                              </p>
                              <p className="font-semibold capitalize text-xs">
                                {order.paymentStatus}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Paid: ৳{Number(order.paidAmount).toLocaleString()}
                              </p>
                            </div>

                            <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
                              <p className="text-xs font-medium text-purple-700 mb-0.5">
                                Order Status
                              </p>
                              <p className="font-semibold capitalize text-xs">
                                {order.orderStatus}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Updated: {formatDateTime(order.updatedAt)}
                              </p>
                            </div>
                          </div>

                          {/* View Details Button */}
                          <Button variant="outline" size="sm" className="w-full text-xs h-8" asChild>
                            <Link href={`/admin/order/${order.id}/view`}>
                              View Full Order Details
                              <ArrowLeft className="ml-1.5 h-3 w-3 rotate-180" />
                            </Link>
                          </Button>
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
