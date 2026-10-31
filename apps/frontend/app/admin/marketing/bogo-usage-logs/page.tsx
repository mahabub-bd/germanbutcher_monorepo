import { AdminPageContainer } from "@/components/admin/admin-page-container";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";
import { BogoUsageLogList } from "@/components/admin/bogo/bogo-usage-log-list";

export default async function BogoUsageLogsPage({
  searchParams,
}: ListPageProps) {
  const { page, limit, searchParams: params } =
    await parseListSearchParams(searchParams);
  return (
    <AdminPageContainer>
      <BogoUsageLogList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={params}
      />
    </AdminPageContainer>
  );
}
