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
      : 14;

  return (
    <div className="md:p-4 p-2 border rounded-sm">
      <OrderList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={resolvedParams}
      />
    </div>
  );
}
