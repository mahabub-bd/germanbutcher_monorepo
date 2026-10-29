export const dynamic = "force-dynamic";

import DailySummaryList from "@/components/admin/reports/daily-summary/daily-summary-list";
import { fetchProtectedData } from "@/utils/api-utils";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function DailySummaryReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;

  const fromDate =
    typeof resolvedParams.fromDate === "string"
      ? resolvedParams.fromDate
      : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string" ? resolvedParams.toDate : undefined;
  // Only fall back to a preset when the URL has no explicit date range,
  // otherwise manual fromDate/toDate would be ignored below.
  const preset =
    typeof resolvedParams.preset === "string"
      ? resolvedParams.preset
      : fromDate || toDate
        ? undefined
        : "this_month";

  let reportData: {
    from: string | null;
    to: string | null;
    summary: {
      totalOrders: number;
      totalValue: number;
      deliveredOrders: number;
      deliveredValue: number;
      cancelledOrders: number;
      pendingOrders: number;
      pendingValue: number;
      processingOrders: number;
      processingValue: number;
      onHoldOrders: number;
      onHoldValue: number;
      paidAmount: number;
      dueAmount: number;
    };
    daily: {
      date: string;
      orderCount: number;
      orderValue: number;
      deliveredCount: number;
      deliveredValue: number;
      cancelledCount: number;
      cancelledValue: number;
      pendingCount: number;
      pendingValue: number;
      processingCount: number;
      processingValue: number;
      onHoldCount: number;
      onHoldValue: number;
      paidAmount: number;
      dueAmount: number;
    }[];
  } | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) {
      queryParams.append("preset", preset);
    } else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }

    const endpoint = `orders/reports/daily-summary${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch daily summary report:", error);
  }

  return (
    <AdminPageContainer>
      <DailySummaryList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        daily={reportData?.daily ?? []}
      />
    </AdminPageContainer>
  );
}
