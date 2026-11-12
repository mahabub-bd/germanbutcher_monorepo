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

const asString = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : undefined;

export default async function LateDeliveryReportPage({
  searchParams,
}: Props) {
  const resolvedParams = await searchParams;

  const fromDate = asString(resolvedParams.fromDate);
  const toDate = asString(resolvedParams.toDate);
  const thresholdHours = asString(resolvedParams.thresholdHours);
  // Only fall back to a preset when the URL has no explicit date range,
  // otherwise manual fromDate/toDate would be ignored below.
  const preset =
    asString(resolvedParams.preset) ?? (fromDate || toDate ? undefined : "this_month");

  // Independent pagination for the three order lists.
  const pendingPage = asString(resolvedParams.pendingPage) ?? "1";
  const pendingLimit = asString(resolvedParams.pendingLimit) ?? "25";
  const paidPage = asString(resolvedParams.paidPage) ?? "1";
  const paidLimit = asString(resolvedParams.paidLimit) ?? "25";
  const deliveredPage = asString(resolvedParams.deliveredPage) ?? "1";
  const deliveredLimit = asString(resolvedParams.deliveredLimit) ?? "25";

  let reportData: {
    summary: {
      totalDelivered: number;
      totalLate: number;
      lateRate: number;
      onTimeRate: number;
      thresholdHours: number;
      lateMenCount: number;
      pendingTotal: number;
      pendingValue: number;
      pendingPaidTotal: number;
      pendingUnpaidTotal: number;
      deliveredTotal: number;
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
      paymentStatus: string;
      customerName: string;
      mobileNumber: string;
      deliveryMan: string;
      shippingMethod: string | null;
      totalValue: number;
      orderDate: string;
      hours: number;
      threshold?: number;
    }[];
    paidOrders: {
      orderId: number;
      orderNo: string;
      status: string;
      paymentStatus: string;
      customerName: string;
      mobileNumber: string;
      deliveryMan: string;
      shippingMethod: string | null;
      totalValue: number;
      orderDate: string;
      hours: number;
      threshold?: number;
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
      threshold?: number;
      late?: boolean;
    }[];
    pending: { page: number; limit: number; total: number };
    paid: { page: number; limit: number; total: number };
    delivered: { page: number; limit: number; total: number };
  } | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) queryParams.append("preset", preset);
    else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }
    if (thresholdHours) queryParams.append("thresholdHours", thresholdHours);
    queryParams.append("pendingPage", pendingPage);
    queryParams.append("pendingLimit", pendingLimit);
    queryParams.append("paidPage", paidPage);
    queryParams.append("paidLimit", paidLimit);
    queryParams.append("deliveredPage", deliveredPage);
    queryParams.append("deliveredLimit", deliveredLimit);

    const endpoint = `orders/reports/late-delivery?${queryParams.toString()}`;

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
        paidOrders={reportData?.paidOrders ?? []}
        deliveredOrders={reportData?.deliveredOrders ?? []}
        pendingPage={reportData?.pending?.page ?? 1}
        pendingLimit={reportData?.pending?.limit ?? Number(pendingLimit)}
        pendingTotal={reportData?.pending?.total ?? 0}
        paidPage={reportData?.paid?.page ?? 1}
        paidLimit={reportData?.paid?.limit ?? Number(paidLimit)}
        paidTotal={reportData?.paid?.total ?? 0}
        deliveredPage={reportData?.delivered?.page ?? 1}
        deliveredLimit={reportData?.delivered?.limit ?? Number(deliveredLimit)}
        deliveredTotal={reportData?.delivered?.total ?? 0}
      />
    </AdminPageContainer>
  );
}
