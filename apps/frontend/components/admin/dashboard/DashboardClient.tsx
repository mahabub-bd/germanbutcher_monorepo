import type {
  Brand,
  Category,
  CategorySales,
  CustomerTypeShare,
  OrderSummary,
  PaymentDueSummary,
  PaymentMethodShare,
  TodaySnapshot,
} from "@/utils/types";
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
  paymentMethodShare: PaymentMethodShare[];
  categorySales: CategorySales[];
  customerType: CustomerTypeShare;
  todaySnapshot: TodaySnapshot;
  paymentDue: PaymentDueSummary;
  stockAlerts: { outOfStock: number; lowStock: number };
  categories: Category[];
  brands: Brand[];
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
