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
  CategorySales,
  CustomerTypeShare,
  OrderSummary,
  PaymentDueSummary,
  PaymentMethodShare,
  Product,
  TodaySnapshot,
} from "@/utils/types";

export default async function DashboardPage() {
  // All independent reads run in parallel — sequential awaits here used to
  // stack 7+ round-trips before the page could render.
  const [
    products,
    categories,
    brands,
    response,
    chartdata,
    last30DaysData,
    statsData,
    paymentMethodShare,
    categorySales,
    customerType,
    todaySnapshot,
    paymentDue,
  ] = await Promise.all([
    fetchData<Product[]>("products?limit=300"),
    fetchData<Category[]>("categories"),
    fetchData<Brand[]>("brands"),
    fetchDataPagination<ApiResponseusers>("users/customers"),
    fetchProtectedData<OrderSummary[]>("orders/reports/monthly"),
    fetchProtectedData<Last30DaysData[]>(
      "orders/reports/last-30-days-delivered"
    ),
    fetchProtectedData<{
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
    }>("orders/reports/statistics"),
    fetchProtectedData<PaymentMethodShare[]>("orders/reports/payment-methods"),
    fetchProtectedData<CategorySales[]>("orders/reports/category-sales"),
    fetchProtectedData<CustomerTypeShare>("orders/reports/customer-type"),
    fetchProtectedData<TodaySnapshot>("orders/reports/today"),
    fetchProtectedData<PaymentDueSummary>("orders/reports/payment-due"),
  ]);

  // Stock alert counts from the already-fetched product list
  const stockAlerts = {
    outOfStock: products.filter((p) => (p.stock ?? 0) === 0).length,
    lowStock: products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5)
      .length,
  };

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
        paymentMethodShare={paymentMethodShare}
        categorySales={categorySales}
        customerType={customerType}
        todaySnapshot={todaySnapshot}
        paymentDue={paymentDue}
        stockAlerts={stockAlerts}
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
