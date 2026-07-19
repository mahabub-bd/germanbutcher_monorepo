export const dynamic = "force-dynamic";

import MonthlyOrderReportList from "@/components/admin/reports/monthly-orders/monthly-order-list";
import { fetchProtectedData } from "@/utils/api-utils";

export default async function MonthlyOrderReportPage() {
  let monthlyData: any[] = [];

  try {
    const endpoint = `orders/reports/monthly`;
    const response = await fetchProtectedData(endpoint);
    monthlyData = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("❌ Failed to fetch monthly order report:", error);
    monthlyData = [];
  }

  return (
    <div className="p-4 md:p-6">
      <MonthlyOrderReportList monthlyData={monthlyData} />
    </div>
  );
}
