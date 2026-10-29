import { AdminPageContainer } from "@/components/admin/admin-page-container";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";
import { OrderList } from "@/components/admin/orders/order-list";

export default async function OrderPage({ searchParams }: ListPageProps) {
  const { page, limit, searchParams: params } = await parseListSearchParams(searchParams, 14);
  return (
    <AdminPageContainer>
      <OrderList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={params}
      />
    </AdminPageContainer>
  );
}
