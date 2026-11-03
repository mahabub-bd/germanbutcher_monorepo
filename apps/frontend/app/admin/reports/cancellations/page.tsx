export const dynamic = "force-dynamic";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import CancellationReport from "@/components/admin/reports/cancellations/cancellation-report";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

interface BreakdownRow {
  name: string;
  totalOrders: number;
  cancelledOrders: number;
  cancelRate: number;
  lostValue: number;
}

export interface RecentCancellation {
  id: number;
  orderNo: string;
  customerName: string;
  mobileNumber: string | null;
  area: string;
  method: string;
  totalValue: number;
  paidAmount: number;
  paymentStatus: string;
  placedAt: string;
  cancelledAt: string;
  cancelHours: number | null;
}

export default async function CancellationReportPage({
  searchParams,
}: Props) {
  const resolvedParams = await searchParams;

  const fromDate =
    typeof resolvedParams.fromDate === "string"
      ? resolvedParams.fromDate
      : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string"
      ? resolvedParams.toDate
      : undefined;
  // Only fall back to a preset when the URL has no explicit date range,
  // otherwise manual fromDate/toDate would be ignored below.
  const preset =
    typeof resolvedParams.preset === "string"
      ? resolvedParams.preset
      : fromDate || toDate
        ? undefined
        : "this_month";

  interface ReportData {
    summary: {
      totalOrders: number;
      cancelledOrders: number;
      cancelRate: number;
      lostValue: number;
      paidOnCancelled: number;
      avgCancelHours: number;
      sameDayCancellations: number;
    };
    byMethod: BreakdownRow[];
    byArea: BreakdownRow[];
    recent: RecentCancellation[];
  }

  let reportData: ReportData | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) queryParams.append("preset", preset);
    else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }

    const endpoint = `orders/reports/cancellations${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch cancellation report:", error);
  }

  return (
    <AdminPageContainer>
      <CancellationReport
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        byMethod={reportData?.byMethod ?? []}
        byArea={reportData?.byArea ?? []}
        recent={reportData?.recent ?? []}
      />
    </AdminPageContainer>
  );
}
