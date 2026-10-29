export const dynamic = "force-dynamic";

import OrderPaymentList, {
  type PaymentRecord,
} from "@/components/admin/reports/order-payments/order-payment-list";
import { fetchProtectedData } from "@/utils/api-utils";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function PaymentsPage({ searchParams }: Props) {
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

  let payments: PaymentRecord[] = [];

  try {
    const queryParams = new URLSearchParams();
    if (preset) {
      queryParams.append("preset", preset);
    } else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }
    if (orderStatus) queryParams.append("orderStatus", orderStatus);

    const endpoint = `orders/payments/all${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    payments = (await fetchProtectedData(endpoint)) as PaymentRecord[];
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    payments = [];
  }

  return (
    <AdminPageContainer>
      <OrderPaymentList
        payments={payments || []}
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        orderStatus={orderStatus}
      />
    </AdminPageContainer>
  );
}
