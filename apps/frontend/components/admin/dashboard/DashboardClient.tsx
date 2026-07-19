import type { Brand, Category, OrderSummary } from "@/utils/types";
import DashboardStatsGrid from "./DashboardStatsGrid";
import { OrderStatsGrid } from "./OrderStatsGrid";

interface DashboardClientProps {
  initialChartData: OrderSummary[];
  initialStatsData: {
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
  productsCount: number;
  customersCount: number;
  categories: Category[];
  brands: Brand[];
}

export default function DashboardClient({
  initialChartData,
  initialStatsData,
  productsCount,
  customersCount,
}: DashboardClientProps) {
  return (
    <>
      <DashboardStatsGrid
        chartData={initialChartData}
        productsCount={productsCount}
        customersCount={customersCount}
        statsData={initialStatsData}
      />
      <OrderStatsGrid data={initialStatsData} />
    </>
  );
}
