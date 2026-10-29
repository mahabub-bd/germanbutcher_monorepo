import { AdminPageContainer } from "@/components/admin/admin-page-container";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";
import { UserActivityList } from "@/components/admin/reports/user-activity/user-activity-list";

export default async function UserActivityPage({ searchParams }: ListPageProps) {
  const { page, limit, searchParams: params } = await parseListSearchParams(searchParams);
  return (
    <AdminPageContainer>
      <UserActivityList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={params}
      />
    </AdminPageContainer>
  );
}
