import { AdminPageContainer } from "@/components/admin/admin-page-container";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";
import { FreeDeliveryUsageLogList } from "@/components/admin/marketing/free-delivery-usage-log-list";

export default async function FreeDeliveryUsageLogsPage({
  searchParams,
}: ListPageProps) {
  const { page, limit, searchParams: params } =
    await parseListSearchParams(searchParams);
  return (
    <AdminPageContainer>
      <FreeDeliveryUsageLogList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={params}
      />
    </AdminPageContainer>
  );
}
