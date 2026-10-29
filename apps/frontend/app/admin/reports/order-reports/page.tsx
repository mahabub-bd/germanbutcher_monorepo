export const dynamic = "force-dynamic";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import OrderReportList, {
  type Order,
} from "@/components/admin/reports/order-reports/order-report-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface OrderReportData {
  orders: Order[];
  totalOrders: number;
  totalValue: number;
  totalDiscount: number;
  totalPaid: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
  // Only fall back to a preset when the URL has no explicit date range,
  // otherwise manual fromDate/toDate would be ignored below.
  const preset =
    typeof resolvedParams.preset === "string"
      ? resolvedParams.preset
      : fromDate || toDate
        ? undefined
        : "this_month";
  const orderStatus =
    typeof resolvedParams.orderStatus === "string"
      ? resolvedParams.orderStatus
      : undefined;
  const paymentStatus =
    typeof resolvedParams.paymentStatus === "string"
      ? resolvedParams.paymentStatus
      : undefined;
  const page =
    typeof resolvedParams.page === "string"
      ? Math.max(1, parseInt(resolvedParams.page, 10) || 1)
      : 1;

  let reportData: OrderReportData | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) {
      queryParams.append("preset", preset);
    } else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }
    if (orderStatus) queryParams.append("orderStatus", orderStatus);
    if (paymentStatus) queryParams.append("paymentStatus", paymentStatus);
    queryParams.append("page", String(page));
    queryParams.append("limit", "50");

    const endpoint = `orders/reports/date-range${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetchProtectedData<OrderReportData>(endpoint);

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
    <AdminPageContainer>
      <OrderReportList
        orders={orders}
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        orderStatus={orderStatus}
        paymentStatus={paymentStatus}
        totalOrders={totalOrders}
        totalValue={totalValue}
        totalDiscount={totalDiscount}
        totalPaid={totalPaid}
        currentPage={reportData?.page || page}
        limit={reportData?.limit || 50}
        totalPages={reportData?.totalPages || 1}
      />
    </AdminPageContainer>
  );
}
