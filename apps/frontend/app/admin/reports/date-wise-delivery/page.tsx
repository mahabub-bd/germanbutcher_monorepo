export const dynamic = "force-dynamic";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import DateWiseDeliveryList from "@/components/admin/reports/date-wise-delivery/date-wise-delivery-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

interface DeliveryManOption {
  id: number;
  name: string;
}

export default async function DateWiseDeliveryReportPage({
  searchParams,
}: Props) {
  const resolvedParams = await searchParams;

  const fromDate =
    typeof resolvedParams.fromDate === "string"
      ? resolvedParams.fromDate
      : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string" ? resolvedParams.toDate : undefined;
  const deliveryManId =
    typeof resolvedParams.deliveryManId === "string"
      ? resolvedParams.deliveryManId
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
      totalDeliveries: number;
      totalDeliveredValue: number;
      totalCashCollected: number;
      totalOnlineAmount: number;
      deliveryDays: number;
      activeDeliveryMen: number;
      avgPerDay: number;
    };
    days: {
      date: string;
      totalDeliveries: number;
      totalValue: number;
      totalCash: number;
      totalOnline: number;
      deliveryMen: {
        id: number | null;
        name: string;
        deliveries: number;
        deliveredValue: number;
        cashCollected: number;
        onlineAmount: number;
      }[];
    }[];
  } | null = null;
  let deliveryMen: DeliveryManOption[] = [];

  try {
    const queryParams = new URLSearchParams();
    if (preset) queryParams.append("preset", preset);
    else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }
    if (deliveryManId) queryParams.append("deliveryManId", deliveryManId);

    const endpoint = `orders/reports/date-wise-delivery${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch date-wise delivery report:", error);
  }

  // Active delivery men for the filter dropdown; non-fatal if it fails.
  try {
    const active = await fetchProtectedData<{ id: number; name: string }[]>(
      "delivery-man/active"
    );
    deliveryMen = active ?? [];
  } catch (error) {
    console.error("Failed to fetch active delivery men:", error);
  }

  return (
    <AdminPageContainer>
      <DateWiseDeliveryList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        deliveryManId={deliveryManId}
        deliveryMenOptions={deliveryMen}
        summary={reportData?.summary ?? null}
        days={reportData?.days ?? []}
      />
    </AdminPageContainer>
  );
}
