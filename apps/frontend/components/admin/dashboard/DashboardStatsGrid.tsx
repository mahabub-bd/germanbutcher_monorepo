"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { formatCurrencyEnglish } from "@/lib/utils";
import type { CategorySales, CustomerTypeShare, PaymentDueSummary, PaymentMethodShare, TodaySnapshot } from "@/utils/types";
import { AlertTriangle, Calendar, CalendarDays, Package, Receipt, TrendingDown, TrendingUp, Users, Wallet, XCircle } from "lucide-react";
import { PiePanel } from "./pie-panel";

// Validated categorical slots (light + dark); slices take slots in fixed
// order, overflow folds into a neutral "Other" slice.
const PIE_SLOTS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];
const OTHER_SLICE_COLOR = "#898781";

function toSharePieData(rows: { name: string; totalValue: number }[]) {
  const total = rows.reduce((sum, row) => sum + row.totalValue, 0);
  if (total <= 0) return [];

  const items = rows.slice(0, 5).map((row, i) => ({
    name: row.name,
    value: row.totalValue,
    color: PIE_SLOTS[i],
    percentage: (row.totalValue / total) * 100,
  }));

  const rest = rows.slice(5);
  if (rest.length > 0) {
    const restValue = rest.reduce((sum, row) => sum + row.totalValue, 0);
    items.push({
      name: `Other (${rest.length})`,
      value: restValue,
      color: OTHER_SLICE_COLOR,
      percentage: (restValue / total) * 100,
    });
  }

  return items;
}

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
  paymentMethodShare: PaymentMethodShare[];
  categorySales: CategorySales[];
  customerType: CustomerTypeShare;
  todaySnapshot: TodaySnapshot;
  paymentDue: PaymentDueSummary;
  stockAlerts: { outOfStock: number; lowStock: number };
}

export default function DashboardStatsGrid({
  chartData,
  productsCount,
  customersCount,
  statsData,
  paymentMethodShare,
  categorySales,
  customerType,
  todaySnapshot,
  paymentDue,
  stockAlerts,
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
   * Pie data
   */
  const orderStatusTotal = statsData?.totalOrders ?? 0;
  const paymentMethodData = toSharePieData(paymentMethodShare);
  const categoryData = toSharePieData(categorySales);

  // New vs returning — customers active this month
  const customerTotal = customerType.newCustomers + customerType.returningCustomers;
  const customerTypeData =
    customerTotal > 0
      ? [
        {
          name: "New",
          value: customerType.newCustomers,
          color: "#2a78d6",
          percentage: (customerType.newCustomers / customerTotal) * 100,
        },
        {
          name: "Returning",
          value: customerType.returningCustomers,
          color: "#eb6834",
          percentage: (customerType.returningCustomers / customerTotal) * 100,
        },
      ]
      : [];

  // Today vs yesterday (non-cancelled orders)
  const todayGrowth =
    todaySnapshot.yesterdayValue > 0
      ? ((todaySnapshot.todayValue - todaySnapshot.yesterdayValue) /
        todaySnapshot.yesterdayValue) *
      100
      : todaySnapshot.todayValue > 0
        ? 100
        : 0;
  const isTodayUp = todayGrowth >= 0;

  // Average order value — delivered revenue per delivered order
  const avgOrderValue =
    totals.orders > 0 ? totals.sales / totals.orders : 0;

  return (
    <div className="space-y-3">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">

        {/* Today */}
        <StatsCard
          title="Today"
          value={formatCurrencyEnglish(todaySnapshot.todayValue)}
          count={String(todaySnapshot.todayOrders)}
          description={`${isTodayUp ? "▲" : "▼"} ${Math.abs(todayGrowth).toFixed(1)}% vs yesterday`}
          icon={CalendarDays}
          bgColor="blue"
        />

        {/* Avg. Order Value */}
        <StatsCard
          title="Avg. Order Value"
          value={formatCurrencyEnglish(avgOrderValue)}
          count={String(totals.orders)}
          description="Delivered revenue / orders"
          icon={Receipt}
          bgColor="indigo"
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
          bgColor="indigo"
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
          bgColor="red"
        />
        {/* Products */}
        <StatsCard
          title="Products"
          value={productsCount.toString()}
          description="Total inventory count"
          icon={Package}
          bgColor="violet"
        />

        {/* Customers */}
        <StatsCard
          title="Customers"
          value={customersCount.toString()}
          description="Total registered users"
          icon={Users}
          bgColor="amber"
        />



        {/* Stock Alerts */}
        <StatsCard
          title="Stock Alerts"
          value={stockAlerts.outOfStock.toString()}
          count={stockAlerts.lowStock.toString()}
          description="Out of stock / low stock (<5)"
          icon={AlertTriangle}
          bgColor="orange"
        />

        {/* Payment Due */}
        <StatsCard
          title="Payment Due"
          value={formatCurrencyEnglish(paymentDue.dueAmount)}
          count={String(paymentDue.dueOrders)}
          description="Delivered · partially paid"
          icon={Wallet}
          bgColor="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* New vs Returning Customers - Pie */}
        {customerTypeData.length > 0 && (
          <PiePanel
            title={`Customers - ${currentMonthLabel}`}
            subtitle="New vs returning · this month"
            data={customerTypeData}
            size="sm"
          />
        )}

        {/* Revenue by Payment Method - Donut */}
        {paymentMethodData.length > 0 && (
          <PiePanel
            title="Revenue by Payment Method"
            subtitle="Delivered orders · all time"
            data={paymentMethodData}
            size="sm"
            donut={true}
            showCurrency
          />
        )}

        {/* Revenue by Category - Pie */}
        {categoryData.length > 0 && (
          <PiePanel
            title="Revenue by Category"
            subtitle="Item totals · delivered orders"
            data={categoryData}
            size="sm"
            showCurrency
          />
        )}

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
