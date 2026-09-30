import DeliverymanPerformanceList from "@/components/admin/reports/deliveryman-performance/deliveryman-performance-list";
import { fetchProtectedData } from "@/utils/api-utils";

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
  const preset =
    typeof resolvedParams.preset === "string" ? resolvedParams.preset : "this_month";

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
    <div className="p-4 md:p-6">
      <DeliverymanPerformanceList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        deliveryMen={reportData?.deliveryMen ?? []}
      />
    </div>
  );
}
