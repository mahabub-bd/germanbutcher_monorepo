import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { ClientList } from "@/components/admin/client/client-list";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";

export default async function ClientListPage({ searchParams }: ListPageProps) {
  const { page, limit, searchParams: params } =
    await parseListSearchParams(searchParams);
  return (
    <AdminPageContainer>
      <ClientList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={params}
      />
    </AdminPageContainer>
  );
}
