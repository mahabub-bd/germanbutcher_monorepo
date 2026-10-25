export const dynamic = "force-dynamic";

import AreaWiseOrdersList from "@/components/admin/reports/area-wise-orders/area-wise-orders-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function AreaWiseOrdersReportPage({
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
      totalOrders: number;
      deliveredOrders: number;
      cancelledOrders: number;
      totalValue: number;
      deliveredValue: number;
      totalAreas: number;
    };
    areas: {
      area: string;
      totalOrders: number;
      deliveredOrders: number;
      cancelledOrders: number;
      totalValue: number;
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

    const endpoint = `orders/reports/area-wise-orders${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch area wise order report:", error);
  }

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <AreaWiseOrdersList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        areas={reportData?.areas ?? []}
      />
    </div>
  );
}
