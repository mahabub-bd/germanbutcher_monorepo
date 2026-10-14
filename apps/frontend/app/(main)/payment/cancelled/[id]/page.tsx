import PaymentStatusPage from "@/components/payment/payment-status";
import { fetchProtectedData } from "@/utils/api-utils";
import { Order } from "@/utils/types";
import { notFound } from "next/navigation";

export default async function PaymentCanceledPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let order: Order | null = null;
  try {
    order = await fetchProtectedData<Order>(`orders/${id}`);
  } catch {
    // Invalid/expired token or missing order -> 404, not a 500
    order = null;
  }

  if (!order) {
    notFound();
  }

  return <PaymentStatusPage order={order} status="canceled" orderId={id} />;
}
