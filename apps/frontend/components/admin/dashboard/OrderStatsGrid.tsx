"use client";

import {
  Ban,
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
  Truck,
} from "lucide-react";
import { StatusCard } from "./status-card";

interface OrderStatsGridProps {
  data: {
    totalOrders: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    pendingValue: number;
    processingValue: number;
    shippedValue: number;
    deliveredValue: number;
    cancelledValue: number;
  };
}

export function OrderStatsGrid({ data }: OrderStatsGridProps) {
  const getOrderUrl = (status?: string) => {
    if (!status) return "/admin/orders?page=1&limit=10";
    return `/admin/orders/${status}?page=1&limit=10&orderStatus=${status}`;
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
      {/* All Orders */}
      <StatusCard
        title="All Orders"
        value={data.totalOrders}
        icon={ListChecks}
        color="text-sky-600 dark:text-sky-400"
        gradient="from-sky-50 to-sky-100 dark:from-sky-950/20 dark:to-sky-900/10"
        href={getOrderUrl()}
      />

      {/* Delivered */}
      <StatusCard
        title="Delivered"
        value={data.delivered}
        icon={CheckCircle2}
        color="text-green-600 dark:text-green-400"
        gradient="from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10"
        href={getOrderUrl("delivered")}
        badge={{
          text: `${((data.delivered / data.totalOrders) * 100).toFixed(0)}%`,
          color: "success",
        }}
      />

      {/* Pending */}
      <StatusCard
        title="Pending"
        value={data.pending}
        icon={Clock}
        color="text-yellow-600 dark:text-yellow-400"
        gradient="from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/10"
        href={getOrderUrl("pending")}
        badge={{
          text: `${((data.pending / data.totalOrders) * 100).toFixed(0)}%`,
          color: "warning",
        }}
      />

      {/* Processing */}
      <StatusCard
        title="Processing"
        value={data.processing}
        icon={Loader2}
        color="text-blue-600 dark:text-blue-400"
        gradient="from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10"
        href={getOrderUrl("processing")}
        badge={{
          text: `${((data.processing / data.totalOrders) * 100).toFixed(0)}%`,
          color: "info",
        }}
      />

      {/* Shipped */}
      <StatusCard
        title="Shipped"
        value={data.shipped}
        icon={Truck}
        color="text-purple-600 dark:text-purple-400"
        gradient="from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10"
        href={getOrderUrl("shipped")}
        badge={{
          text: `${((data.shipped / data.totalOrders) * 100).toFixed(0)}%`,
          color: "info",
        }}
      />

      {/* Cancelled */}
      <StatusCard
        title="Cancelled"
        value={data.cancelled}
        icon={Ban}
        color="text-red-600 dark:text-red-400"
        gradient="from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/10"
        href={getOrderUrl("cancelled")}
        badge={{
          text: `${((data.cancelled / data.totalOrders) * 100).toFixed(0)}%`,
          color: "danger",
        }}
      />
    </div>
  );
}
