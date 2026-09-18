import type {
  CategorySales,
  CustomerTypeShare,
  DashboardReports,
  OrderSummary,
  PaymentDueSummary,
  PaymentMethodShare,
  TodaySnapshot,
} from "@/utils/types";
import DashboardStatsGrid from "./DashboardStatsGrid";
import { OrderStatsGrid } from "./OrderStatsGrid";

interface DashboardClientProps {
  initialChartData: OrderSummary[];
  initialStatsData: DashboardReports["statistics"];
  productsCount: number;
  customersCount: number;
  paymentMethodShare: PaymentMethodShare[];
  categorySales: CategorySales[];
  customerType: CustomerTypeShare;
  todaySnapshot: TodaySnapshot;
  paymentDue: PaymentDueSummary;
  stockAlerts: { outOfStock: number; lowStock: number };
}

export default function DashboardClient({
  initialChartData,
  initialStatsData,
  productsCount,
  customersCount,
  paymentMethodShare,
  categorySales,
  customerType,
  todaySnapshot,
  paymentDue,
  stockAlerts,
}: DashboardClientProps) {
  return (
    <>
      <DashboardStatsGrid
        chartData={initialChartData}
        productsCount={productsCount}
        customersCount={customersCount}
        statsData={initialStatsData}
        paymentMethodShare={paymentMethodShare}
        categorySales={categorySales}
        customerType={customerType}
        todaySnapshot={todaySnapshot}
        paymentDue={paymentDue}
        stockAlerts={stockAlerts}
      />
      <OrderStatsGrid data={initialStatsData} />
    </>
  );
}
