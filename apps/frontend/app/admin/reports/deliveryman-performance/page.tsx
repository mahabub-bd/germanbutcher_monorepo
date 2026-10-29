export const dynamic = "force-dynamic";

import DeliverymanPerformanceList from "@/components/admin/reports/deliveryman-performance/deliveryman-performance-list";
import { fetchProtectedData } from "@/utils/api-utils";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function DeliverymanPerformanceReportPage({
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
      totalDeliveries: number;
      totalDeliveredValue: number;
      activeDeliveryMen: number;
    };
    deliveryMen: {
      id: number;
      name: string;
      mobileNumber: string;
      isActive: boolean;
      deliveries: number;
      deliveredValue: number;
    }[];
  } | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) queryParams.append("preset", preset);
    else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }

    const endpoint = `orders/reports/deliveryman-performance${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch deliveryman performance report:", error);
  }

  return (
    <AdminPageContainer>
      <DeliverymanPerformanceList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        deliveryMen={reportData?.deliveryMen ?? []}
      />
    </AdminPageContainer>
  );
}
