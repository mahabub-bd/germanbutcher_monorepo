import { OrderList } from "@/components/admin/orders/order-list";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const page =
    typeof resolvedParams.page === "string"
      ? Number.parseInt(resolvedParams.page)
      : 1;
  const limit =
    typeof resolvedParams.limit === "string"
      ? Number.parseInt(resolvedParams.limit)
      : 10;
  const modifiedParams = {
    ...resolvedParams,
    orderStatus: "cancelled",
  };
  return (
    <div className="p-6 space-y-6 border rounded-sm">
      <OrderList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={modifiedParams}
      />
    </div>
  );
}
