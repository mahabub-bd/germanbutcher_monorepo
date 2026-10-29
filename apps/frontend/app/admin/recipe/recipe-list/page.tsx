import { AdminPageContainer } from "@/components/admin/admin-page-container";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";
import { RecipeList } from "@/components/admin/recipe/recipie-list";

export default async function RecipePage({ searchParams }: ListPageProps) {
  const { page, limit, searchParams: params } = await parseListSearchParams(searchParams);
  return (
    <AdminPageContainer>
      <RecipeList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={params}
      />
    </AdminPageContainer>
  );
}
