export const dynamic = "force-dynamic";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import ShippingMethodReportList from "@/components/admin/reports/shipping-methods/shipping-method-report";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

interface MethodRow {
  name: string;
  code: string;
  orders: number;
  pendingOrders: number;
  processingOrders: number;
  onHoldOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalValue: number;
  avgHours: number;
  lateDeliveries: number;
}

export default async function ShippingMethodReportPage({
  searchParams,
}: Props) {
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
    summary: {
      totalOrders: number;
      totalDelivered: number;
      totalLate: number;
      lateRate: number;
      totalValue: number;
      avgOrderValue: number;
      methodCount: number;
    };
    methods: MethodRow[];
  } | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) queryParams.append("preset", preset);
    else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }

    const endpoint = `orders/reports/shipping-methods${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch shipping methods report:", error);
  }

  return (
    <AdminPageContainer>
      <ShippingMethodReportList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        methods={reportData?.methods ?? []}
      />
    </AdminPageContainer>
  );
}
