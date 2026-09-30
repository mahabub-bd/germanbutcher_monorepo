import DailySummaryList from "@/components/admin/reports/daily-summary/daily-summary-list";
import { fetchProtectedData } from "@/utils/api-utils";

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
  const preset =
    typeof resolvedParams.preset === "string" ? resolvedParams.preset : "this_month";

  let reportData: {
    from: string | null;
    to: string | null;
    summary: {
      totalOrders: number;
      totalValue: number;
      deliveredOrders: number;
      deliveredValue: number;
      cancelledOrders: number;
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
    <div className="p-4 md:p-6">
      <DailySummaryList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        daily={reportData?.daily ?? []}
      />
    </div>
  );
}
