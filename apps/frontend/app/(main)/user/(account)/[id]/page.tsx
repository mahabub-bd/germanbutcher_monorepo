import { getUser } from "@/actions/auth";
import DashboardContent from "@/components/user/dashboard-content";
import { fetchProtectedData } from "@/utils/api-utils";
import type { Order } from "@/utils/types";

export default async function UserDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, orders] = await Promise.all([
    getUser(),
    // A failed orders fetch must not take down the whole account home.
    fetchProtectedData<Order[]>(`orders/user/${id}`).catch(() => []),
  ]);

  return (
    <div className="md:p-4 p-2">
      <DashboardContent user={user} orders={orders} />
    </div>
  );
}
