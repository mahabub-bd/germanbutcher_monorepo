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
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
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
  Eye,
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
            The delivery man you&apos;re looking for doesn&apos;t exist or has been removed.
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
    <div className="w-full min-h-screen bg-linear-to-b from-background to-muted/20">
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
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                  <p className="text-xl font-bold">
                    {formatCurrencyEnglish(deliveryMan.totalEarnings)}
                  </p>
                </div>
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
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md shrink-0">
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
                      This delivery man hasn&apos;t been assigned any orders yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="min-w-140 text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID / Date</TableHead>
                          <TableHead>Order Status</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id} className="hover:bg-muted/50">
                            <TableCell>
                              <Link
                                href={`/admin/order/${order.id}/view`}
                                className="block font-medium leading-tight hover:underline"
                              >
                                {order.orderNo}
                              </Link>
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Calendar className="h-3 w-3 shrink-0" />
                                {formatDateTime(order.createdAt)}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`capitalize ${getOrderStatusColor(order.orderStatus)}`}
                              >
                                {order.orderStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`capitalize ${getPaymentStatusColor(order.paymentStatus)}`}
                              >
                                {order.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrencyEnglish(order.totalValue)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/order/${order.id}/view`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
