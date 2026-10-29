export const dynamic = "force-dynamic";

import { Suspense } from "react";

import { AnalyticsWidget } from "@/components/admin/analytics";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import CombinedOrdersSalesChart from "@/components/admin/dashboard/combined-order-saleschart";
import DashboardClient from "@/components/admin/dashboard/DashboardClient";

import Last30DaysDeliveredChart from "@/components/admin/dashboard/last-30-days-delivered-chart";

import { StockReportTabs } from "@/components/admin/dashboard/StockReportTabs";
import { TopCustomersList } from "@/components/admin/dashboard/top-customer-list";
import TopSaleProductsList from "@/components/admin/dashboard/top-sale-product-list";
import { OrderList } from "@/components/admin/orders/order-list";

import { fetchAnalyticsOverview } from "@/utils/analytics-utils";
import {
  fetchDataPagination,
  fetchProtectedData,
} from "@/utils/api-utils";
import type {
  AnalyticsOverview,
  ApiResponseusers,
  DashboardReports,
  StockSummary,
} from "@/utils/types";


const DASHBOARD_REVALIDATE = 60;

async function DashboardReportsSection() {
  // One consolidated request replaces the eight per-report round trips; the
  // stock summary and customer count are lightweight count endpoints.
  const [reports, stockSummary, customers] = await Promise.all([
    fetchProtectedData<DashboardReports>("orders/reports/dashboard", {
      revalidate: DASHBOARD_REVALIDATE,
    }),
    fetchProtectedData<StockSummary>("products/reports/stock-summary", {
      revalidate: DASHBOARD_REVALIDATE,
    }),
    fetchDataPagination<ApiResponseusers>("users/customers?limit=1", {
      revalidate: DASHBOARD_REVALIDATE,
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <DashboardClient
        initialChartData={reports.monthly}
        initialStatsData={reports.statistics}
        productsCount={stockSummary.totalProducts}
        customersCount={customers.data.pagination.total}
        paymentMethodShare={reports.paymentMethodShare}
        categorySales={reports.categorySales}
        customerType={reports.customerType}
        todaySnapshot={reports.todaySnapshot}
        paymentDue={reports.paymentDue}
        stockAlerts={{
          outOfStock: stockSummary.outOfStock,
          lowStock: stockSummary.lowStock,
        }}
      />
      <CombinedOrdersSalesChart chartData={reports.monthly} />
      <Last30DaysDeliveredChart chartData={reports.last30DaysDelivered} />
    </div>
  );
}

async function AnalyticsSection() {
  try {
    const result = await fetchAnalyticsOverview("24h", {
      revalidate: DASHBOARD_REVALIDATE,
    });

    if (result && typeof result === "object" && "totalRequests" in result) {
      return <AnalyticsWidget data={result as AnalyticsOverview} />;
    }
    return null;
  } catch (error) {
    // Analytics is auxiliary — a failure must not break the dashboard.
    console.error("AnalyticsSection fetch failed:", error);
    return null;
  }
}

// Pulse placeholders so the shell paints instantly and each section streams
// in as its data resolves.
function ReportsSkeleton() {
  return (
    <AdminPageContainer className="md:p-4 p-2 space-y-6 rounded-sm flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-27.5 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-87.5 animate-pulse rounded-lg bg-muted" />
      <div className="h-87.5 animate-pulse rounded-lg bg-muted" />
    </AdminPageContainer>
  );
}

export default function DashboardPage() {
  return (
    <AdminPageContainer className="md:p-4 p-2 space-y-6 rounded-sm flex flex-col gap-4">
      <Suspense fallback={<ReportsSkeleton />}>
        <DashboardReportsSection />
      </Suspense>
      <Suspense fallback={null}>
        <AnalyticsSection />
      </Suspense>
      <OrderList initialPage={1} initialLimit={10} />
      <StockReportTabs />
      <TopCustomersList />
      <TopSaleProductsList />
    </AdminPageContainer>
  );
}
