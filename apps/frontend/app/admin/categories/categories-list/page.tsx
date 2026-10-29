import { AdminPageContainer } from "@/components/admin/admin-page-container";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";
import { CategoryList } from "@/components/admin/category/category-list";

export default async function CategoryPage({ searchParams }: ListPageProps) {
  const { page, limit, searchParams: params } = await parseListSearchParams(searchParams);
  return (
    <AdminPageContainer>
      <CategoryList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={params}
      />
    </AdminPageContainer>
  );
}
