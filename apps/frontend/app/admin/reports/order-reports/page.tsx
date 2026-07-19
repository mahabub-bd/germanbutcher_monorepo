import OrderReportList from "@/components/admin/reports/order-reports/order-report-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function OrderReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;

  const fromDate =
    typeof resolvedParams.fromDate === "string"
      ? resolvedParams.fromDate
      : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string"
      ? resolvedParams.toDate
      : undefined;
  const preset =
    typeof resolvedParams.preset === "string"
      ? resolvedParams.preset
      : "this_month";
  const orderStatus =
    typeof resolvedParams.orderStatus === "string"
      ? resolvedParams.orderStatus
      : undefined;

  let reportData: any = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) {
      queryParams.append("preset", preset);
    } else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }
    if (orderStatus) queryParams.append("orderStatus", orderStatus);

    const endpoint = `orders/reports/date-range${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetchProtectedData(endpoint);

    reportData = response || null;
  } catch (error) {
    console.error("❌ Failed to fetch order report:", error);
  }

  const orders = reportData?.orders || [];
  const totalOrders = reportData?.totalOrders || 0;
  const totalValue = reportData?.totalValue || 0;
  const totalDiscount = reportData?.totalDiscount || 0;
  const totalPaid = reportData?.totalPaid || 0;

  return (
    <div className="p-4 md:p-6">
      <OrderReportList
        orders={orders}
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        orderStatus={orderStatus}
        totalOrders={totalOrders}
        totalValue={totalValue}
        totalDiscount={totalDiscount}
        totalPaid={totalPaid}
      />
    </div>
  );
}
