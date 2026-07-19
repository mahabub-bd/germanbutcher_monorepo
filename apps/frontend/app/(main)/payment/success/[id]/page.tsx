import PaymentStatusPage from "@/components/payment/payment-status";
import { fetchProtectedData } from "@/utils/api-utils";
import { Order } from "@/utils/types";
import { notFound } from "next/navigation";

export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await fetchProtectedData<Order>(`orders/${id}`);
  console.log(order);

  if (!order) {
    notFound();
  }

  return <PaymentStatusPage order={order} status="success" orderId={id} />;
}
