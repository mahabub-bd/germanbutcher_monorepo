export const dynamic = "force-dynamic";

import RefundsList from "@/components/admin/reports/refunds/refunds-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function RefundsReportPage({ searchParams }: Props) {
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
    summary: {
      cancelledOrders: number;
      cancelledValue: number;
      refundedAmount: number;
    };
    orders: {
      id: number;
      orderNo: string;
      date: string;
      totalValue: number;
      paidAmount: number;
      paymentStatus: string;
      reason: string | null;
    }[];
  } | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) queryParams.append("preset", preset);
    else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }

    const endpoint = `orders/reports/refunds${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch refund report:", error);
  }

  return (
    <div className="p-4 md:p-6">
      <RefundsList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        orders={reportData?.orders ?? []}
      />
    </div>
  );
}
