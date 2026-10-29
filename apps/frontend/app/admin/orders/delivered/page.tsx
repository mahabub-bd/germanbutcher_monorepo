import { AdminPageContainer } from "@/components/admin/admin-page-container";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";
import { OrderList } from "@/components/admin/orders/order-list";

export default async function OrderPage({ searchParams }: ListPageProps) {
  const { page, limit, searchParams: params } = await parseListSearchParams(searchParams);
  const listParams = { ...params, orderStatus: "delivered" };
  return (
    <AdminPageContainer className="md:p-2 p-2 space-y-6 rounded-sm">
      <OrderList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={listParams}
      />
    </AdminPageContainer>
  );
}
