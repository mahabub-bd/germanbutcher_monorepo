"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { formatCurrencyEnglish } from "@/lib/utils";
import { Calendar, Package, TrendingDown, TrendingUp, Users, XCircle } from "lucide-react";
import { PiePanel } from "./pie-panel";

interface DashboardStatsGridProps {
  chartData: any[];
  productsCount: number;
  customersCount: number;
  statsData?: {
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

export default function DashboardStatsGrid({
  chartData,
  productsCount,
  customersCount,
  statsData,
}: DashboardStatsGridProps) {
  const { current, previous, totals, salesGrowth, cancelGrowth } = useDashboardMetrics(chartData);

  /**
   * Dynamic labels
   */
  const currentMonthLabel = current.month && current.year ? `${current.month} ${current.year}` : "N/A";
  const lastMonthLabel = previous.month && previous.year ? `${previous.month} ${previous.year}` : "N/A";

  const isSalesUp = salesGrowth >= 0;
  const isCancelUp = cancelGrowth >= 0;

  /**
   * Calculate percentages for pie charts
   */
  const currentMonthTotal = current.orderCount + (current.cancelOrderCount ?? 0);
  const orderStatusTotal = statsData?.totalOrders ?? 0;
  const currentMonthData = [
    {
      name: "Completed",
      value: current.orderCount,
      color: "#10b981",
      percentage: currentMonthTotal > 0 ? (current.orderCount / currentMonthTotal) * 100 : 0,
    },
    {
      name: "Cancelled",
      value: current.cancelOrderCount ?? 0,
      color: "#ef4444",
      percentage: currentMonthTotal > 0 ? ((current.cancelOrderCount ?? 0) / currentMonthTotal) * 100 : 0,
    },
  ];

  const totalRevenueAll = totals.sales + totals.cancelValue;
  const totalRevenueData = [
    {
      name: "Sales",
      value: totals.sales,
      color: "#10b981",
      percentage: totalRevenueAll > 0 ? (totals.sales / totalRevenueAll) * 100 : 0,
    },
    {
      name: "Cancelled",
      value: totals.cancelValue,
      color: "#ef4444",
      percentage: totalRevenueAll > 0 ? (totals.cancelValue / totalRevenueAll) * 100 : 0,
    },
  ];

  return (
    <div className="space-y-3">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {/* Total Sales */}
        <StatsCard
          title="Total Sales"
          value={formatCurrencyEnglish(totals.sales)}
          count={String(totals.orders)}
          description="All-time revenue"
          icon={TrendingUp}
          bgColor="green"
        />

        {/* Total Cancel */}
        <StatsCard
          title="Total Cancel"
          value={formatCurrencyEnglish(totals.cancelValue)}
          count={String(totals.cancelOrders)}
          description="All-time cancellations"
          icon={XCircle}
          bgColor="amber"
        />

        {/* Sales - Current Month */}
        <StatsCard
          title={`Sales (${currentMonthLabel})`}
          value={formatCurrencyEnglish(current.totalValue)}
          count={String(current.orderCount)}
          description={` ${isSalesUp ? "▲" : "▼"} ${Math.abs(salesGrowth).toFixed(2)}%`}
          icon={isSalesUp ? TrendingUp : TrendingDown}
          bgColor={isSalesUp ? "green" : "red"}
        />

        {/* Cancel - Current Month */}
        <StatsCard
          title={`Cancel (${currentMonthLabel})`}
          value={formatCurrencyEnglish(current.cancelValue ?? 0)}
          count={String(current.cancelOrderCount ?? 0)}
          description={` ${isCancelUp ? "▲" : "▼"} ${Math.abs(cancelGrowth).toFixed(2)}%`}
          icon={isCancelUp ? TrendingUp : TrendingDown}
          bgColor={isCancelUp ? "orange" : "pink"}
        />

        {/* Sales - Last Month */}
        <StatsCard
          title={`Sales (${lastMonthLabel})`}
          value={formatCurrencyEnglish(previous.totalValue)}
          count={String(previous.orderCount)}
          description="Previous month revenue"
          icon={Calendar}
          bgColor="blue"
        />

        {/* Cancel - Last Month */}
        <StatsCard
          title={`Cancel (${lastMonthLabel})`}
          value={formatCurrencyEnglish(previous.cancelValue ?? 0)}
          count={String(previous.cancelOrderCount ?? 0)}
          description="Previous month cancellations"
          icon={TrendingDown}
          bgColor="pink"
        />

        {/* Products */}
        <StatsCard
          title="Products"
          value={productsCount.toString()}
          description="Total inventory count"
          icon={Package}
          bgColor="indigo"
        />

        {/* Customers */}
        <StatsCard
          title="Customers"
          value={customersCount.toString()}
          description="Total registered users"
          icon={Users}
          bgColor="blue"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Current Month Orders - Pie Chart */}
        <PiePanel
          title={`Order Status - ${currentMonthLabel}`}
          subtitle="Completed vs cancelled"
          data={currentMonthData}
          size="sm"
        />

        {/* Revenue Overview - Pie Chart */}
        <PiePanel
          title="Revenue Overview"
          subtitle="Sales vs cancelled · all time"
          data={totalRevenueData}
          size="sm"
        />

        {/* Order Distribution by Quantity - Donut Chart - All 5 Statuses */}
        {statsData && (
          <PiePanel
            title="Order Distribution"
            subtitle="Order status · all time"
            data={[
              {
                name: "Delivered",
                value: statsData.delivered,
                color: "#10b981",
                percentage:
                  orderStatusTotal > 0
                    ? (statsData.delivered / orderStatusTotal) * 100
                    : 0,
              },
              {
                name: "Processing",
                value: statsData.processing,
                color: "#3b82f6",
                percentage:
                  orderStatusTotal > 0
                    ? (statsData.processing / orderStatusTotal) * 100
                    : 0,
              },
              {
                name: "Shipped",
                value: statsData.shipped,
                color: "#a855f7",
                percentage:
                  orderStatusTotal > 0
                    ? (statsData.shipped / orderStatusTotal) * 100
                    : 0,
              },
              {
                name: "Pending",
                value: statsData.pending,
                color: "#eab308",
                percentage:
                  orderStatusTotal > 0
                    ? (statsData.pending / orderStatusTotal) * 100
                    : 0,
              },
              {
                name: "Cancelled",
                value: statsData.cancelled,
                color: "#ef4444",
                percentage:
                  orderStatusTotal > 0
                    ? (statsData.cancelled / orderStatusTotal) * 100
                    : 0,
              },
            ]}
            size="sm"
            donut={true}
          />
        )}
      </div>
    </div>
  );
}
