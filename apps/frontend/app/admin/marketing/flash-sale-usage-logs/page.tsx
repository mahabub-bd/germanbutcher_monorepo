import { AdminPageContainer } from "@/components/admin/admin-page-container";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";
import { FlashSaleUsageLogList } from "@/components/admin/marketing/flash-sale-usage-log-list";

export default async function FlashSaleUsageLogsPage({
  searchParams,
}: ListPageProps) {
  const { page, limit, searchParams: params } =
    await parseListSearchParams(searchParams);
  return (
    <AdminPageContainer>
      <FlashSaleUsageLogList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={params}
      />
    </AdminPageContainer>
  );
}
