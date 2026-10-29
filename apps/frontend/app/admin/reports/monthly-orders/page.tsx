export const dynamic = "force-dynamic";

import MonthlyOrderReportList, {
  type MonthlyData,
} from "@/components/admin/reports/monthly-orders/monthly-order-list";
import { fetchProtectedData } from "@/utils/api-utils";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default async function MonthlyOrderReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const yearParam =
    typeof resolvedParams.year === "string" ? resolvedParams.year : "";
  const year = /^\d{4}$/.test(yearParam) ? Number(yearParam) : undefined;

  let monthlyData: MonthlyData[] = [];
  let availableYears: number[] = [];

  try {
    const endpoint = year
      ? `orders/reports/monthly?year=${year}`
      : `orders/reports/monthly`;
    const response = await fetchProtectedData(endpoint);
    monthlyData = Array.isArray(response) ? (response as MonthlyData[]) : [];
  } catch (error) {
    console.error("❌ Failed to fetch monthly order report:", error);
    monthlyData = [];
  }

  try {
    const response = await fetchProtectedData(`orders/reports/monthly/years`);
    availableYears = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("❌ Failed to fetch report years:", error);
    availableYears = [];
  }

  return (
    <AdminPageContainer>
      <MonthlyOrderReportList
        monthlyData={monthlyData}
        availableYears={availableYears}
        selectedYear={year}
      />
    </AdminPageContainer>
  );
}
