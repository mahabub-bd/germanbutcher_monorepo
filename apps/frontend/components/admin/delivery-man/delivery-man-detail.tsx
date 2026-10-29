"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
} from "@/utils/order-helper";
import type { DeliveryMan } from "@/utils/types";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Package,
  Pencil,
  Phone,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

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
          <Package className="h-10 w-10 text-muted-foreground" />
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
    <div className="w-full space-y-6">
      <PageHeader
        title={deliveryMan.name}
        description="Delivery man details — profile, stats and assigned orders"
        className="mb-0"
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/delivery-man/${deliveryMan.id}/edit`}>
            <Pencil className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </PageHeader>

      {/* Profile strip + stats */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-muted text-xl font-semibold text-muted-foreground uppercase">
            {deliveryMan.name?.charAt(0) || "?"}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold capitalize">
                {deliveryMan.name}
              </h2>
              <Badge
                variant={deliveryMan.isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {deliveryMan.isActive ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-0.5" />
                    Active
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-0.5" />
                    Inactive
                  </>
                )}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-4">
              {deliveryMan.mobileNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {deliveryMan.mobileNumber}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                Joined {formatDateTime(deliveryMan.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="Total Deliveries"
            value={deliveryMan.totalDeliveries}
            icon={Package}
            description="Orders delivered"
            bgColor="blue"
          />
          <StatsCard
            title="Total Earnings"
            value={formatCurrencyEnglish(deliveryMan.totalEarnings)}
            icon={Wallet}
            description="All-time earnings"
            bgColor="green"
          />
          <StatsCard
            title="Avg. Earning"
            value={formatCurrencyEnglish(
              deliveryMan.totalDeliveries > 0
                ? deliveryMan.totalEarnings / deliveryMan.totalDeliveries
                : 0
            )}
            icon={TrendingUp}
            description="Per delivery"
            bgColor="orange"
          />
          <StatsCard
            title="Status"
            value={deliveryMan.isActive ? "Active" : "Inactive"}
            icon={deliveryMan.isActive ? CheckCircle2 : Clock}
            description="Current availability"
            bgColor={deliveryMan.isActive ? "purple" : "red"}
          />
        </div>
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="scrollbar-hide h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-none bg-transparent p-0 sm:gap-2 md:w-fit">
          {(
            [
              {
                value: "orders",
                label: "Assigned Orders",
                icon: ShoppingBag,
                count: orders.length,
                colors:
                  "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
                activeColors:
                  "data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-400 dark:data-[state=active]:text-blue-950",
              },
            ] as const
          ).map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`h-auto flex-none gap-1.5 rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold shadow-none transition-colors sm:px-4 sm:py-2 sm:text-sm data-[state=active]:shadow-none ${tab.colors} ${tab.activeColors}`}
            >
              <tab.icon className="size-4" />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="sr-only md:hidden">{tab.label}</span>
              <span className="ml-0.5 rounded-full bg-white/40 px-1.5 text-[11px] font-medium tabular-nums dark:bg-black/20">
                {tab.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No orders assigned yet.
            </p>
          ) : (
            <div className="rounded-lg border bg-card">
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
                          <CalendarClock className="h-3 w-3 shrink-0" />
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
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
