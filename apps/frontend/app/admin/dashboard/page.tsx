export const dynamic = "force-dynamic";

import { AnalyticsWidget } from "@/components/admin/analytics";
import CombinedOrdersSalesChart from "@/components/admin/dashboard/combined-order-saleschart";
import DashboardClient from "@/components/admin/dashboard/DashboardClient";

import Last30DaysDeliveredChart, {
  type Last30DaysData,
} from "@/components/admin/dashboard/last-30-days-delivered-chart";

import OrdersTable from "@/components/admin/dashboard/orders-table";
import { StockReportTabs } from "@/components/admin/dashboard/StockReportTabs";
import { TopCustomersList } from "@/components/admin/dashboard/top-customer-list";
import TopSaleProductsList from "@/components/admin/dashboard/top-sale-product-list";

import { fetchAnalyticsOverview } from "@/utils/analytics-utils";
import {
  fetchData,
  fetchDataPagination,
  fetchProtectedData,
} from "@/utils/api-utils";
import type {
  AnalyticsOverview,
  ApiResponseusers,
  Brand,
  Category,
  OrderSummary,
  Product,
} from "@/utils/types";

export default async function DashboardPage() {
  const products = await fetchData<Product[]>("products?limit=300");
  const categories = await fetchData<Category[]>("categories");
  const brands = await fetchData<Brand[]>("brands");
  const response =
    await fetchDataPagination<ApiResponseusers>("users/customers");
  const chartdata = await fetchProtectedData("orders/reports/monthly");
  const last30DaysData = await fetchProtectedData<Last30DaysData[]>(
    "orders/reports/last-30-days-delivered"
  );
  const statsData = await fetchProtectedData<{
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
  }>("orders/reports/statistics");

  // Fetch analytics overview data
  let analyticsOverview: AnalyticsOverview | null = null;
  try {
    const result = await fetchAnalyticsOverview("24h");
    

    // Ensure result has required fields before assigning
    if (result && typeof result === "object" && "totalRequests" in result) {
      analyticsOverview = result as AnalyticsOverview;
    }
  } catch (error) {
    console.error("Failed to fetch analytics overview:", error);
  }

  return (
    <div className="space-y-6">
      <DashboardClient
        initialChartData={chartdata as OrderSummary[]}
        initialStatsData={statsData}
        productsCount={products?.length || 0}
        customersCount={response.data.pagination.total}
        categories={categories}
        brands={brands}
      />
      {analyticsOverview && <AnalyticsWidget data={analyticsOverview} />}

      <CombinedOrdersSalesChart chartData={chartdata as OrderSummary[]} />
      <Last30DaysDeliveredChart chartData={last30DaysData || []} />
      <OrdersTable />
      <StockReportTabs />
      <TopCustomersList />
      <TopSaleProductsList />
    </div>
  );
}
