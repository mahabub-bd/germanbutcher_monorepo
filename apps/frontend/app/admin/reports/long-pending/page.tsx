export const dynamic = "force-dynamic";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import LongPendingList from "@/components/admin/reports/long-pending/long-pending-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function LongPendingReportPage({
  searchParams,
}: Props) {
  const resolvedParams = await searchParams;

  const fromDate =
    typeof resolvedParams.fromDate === "string"
      ? resolvedParams.fromDate
      : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string" ? resolvedParams.toDate : undefined;
  const thresholdHours =
    typeof resolvedParams.thresholdHours === "string"
      ? resolvedParams.thresholdHours
      : undefined;
  // Only fall back to a preset when the URL has no explicit date range,
  // otherwise manual fromDate/toDate would be ignored below.
  const preset =
    typeof resolvedParams.preset === "string"
      ? resolvedParams.preset
      : fromDate || toDate
        ? undefined
        : "this_month";

  let reportData: {
    summary: {
      totalLongPending: number;
      worstHours: number;
      avgHours: number;
      totalValue: number;
      thresholdHours: number;
      totalDelivered: number;
      byStatus: { status: string; count: number }[];
    };
    orders: {
      orderId: number;
      orderNo: string;
      status: string;
      customerName: string;
      mobileNumber: string;
      deliveryMan: string;
      shippingMethod: string | null;
      totalValue: number;
      orderDate: string;
      hours: number;
    }[];
    deliveredOrders: {
      orderId: number;
      orderNo: string;
      customerName: string;
      mobileNumber: string;
      deliveryMan: string;
      shippingMethod: string | null;
      totalValue: number;
      orderDate: string;
      deliveredAt: string;
      hours: number;
    }[];
  } | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) queryParams.append("preset", preset);
    else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }
    if (thresholdHours) queryParams.append("thresholdHours", thresholdHours);

    const endpoint = `orders/reports/long-pending${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch long pending report:", error);
  }

  return (
    <AdminPageContainer>
      <LongPendingList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        orders={reportData?.orders ?? []}
        deliveredOrders={reportData?.deliveredOrders ?? []}
      />
    </AdminPageContainer>
  );
}
