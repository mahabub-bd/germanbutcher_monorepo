export const dynamic = "force-dynamic";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import LateDeliveryList from "@/components/admin/reports/late-delivery/late-delivery-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function LateDeliveryReportPage({
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
      totalDelivered: number;
      totalLate: number;
      lateRate: number;
      onTimeRate: number;
      thresholdHours: number;
      lateMenCount: number;
    };
    deliveryMen: {
      id: number | null;
      name: string;
      delivered: number;
      late: number;
      avgHours: number;
      worstHours: number;
    }[];
    lateOrders: {
      orderId: number;
      orderNo: string;
      customerName: string;
      mobileNumber: string;
      deliveryMan: string;
      totalValue: number;
      orderDate: string;
      deliveredAt: string;
      hours: number;
    }[];
    pendingOrders: {
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

    const endpoint = `orders/reports/late-delivery${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch late delivery report:", error);
  }

  return (
    <AdminPageContainer>
      <LateDeliveryList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        deliveryMen={reportData?.deliveryMen ?? []}
        lateOrders={reportData?.lateOrders ?? []}
        pendingOrders={reportData?.pendingOrders ?? []}
        deliveredOrders={reportData?.deliveredOrders ?? []}
      />
    </AdminPageContainer>
  );
}
