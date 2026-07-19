import { HeadingPrimary } from "@/components/common/heading-primary";
import CategoryList from "@/components/recipe/category-list";
import RecipeList from "@/components/recipe/recipe-list";
import SearchForm from "@/components/recipe/search-form";
import {
  BreadcrumbItem,
  PageBreadcrumb,
} from "@/components/ui/page-breadcrumb";
import { ChefHat } from "lucide-react";
import Link from "next/link";

export default async function RecipePage({
  searchParams,
}: {
  searchParams: Promise<{ recipesearch?: string; categorySlug?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.recipesearch || "";
  const categorySlug = params.categorySlug || "";

  // Build endpoint with both search and category filters
  const buildEndpoint = () => {
    const baseEndpoint = "recipes?isPublished=true";
    const filters = [];

    if (searchQuery) {
      filters.push(`recipesearch=${encodeURIComponent(searchQuery)}`);
    }

    if (categorySlug) {
      filters.push(`categorySlug=${encodeURIComponent(categorySlug)}`);
    }

    return filters.length > 0
      ? `${baseEndpoint}&${filters.join("&")}`
      : baseEndpoint;
  };

  const endpoint = buildEndpoint();

  const getCategoryDisplayName = (slug: string) => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const pageTitle = categorySlug
    ? `${getCategoryDisplayName(categorySlug)} Recipes`
    : searchQuery
      ? `Search Results for "${searchQuery}"`
      : "All Recipes";
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Recipe",
      icon: <ChefHat className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
      isActive: true,
    },
  ];
  return (
    <div className="container mx-auto px-2">
      <PageBreadcrumb items={breadcrumbItems} />
      <SearchForm initialQuery={searchQuery} />
      <CategoryList
        endpoint="categories?isMainCategory=true"
        activeCategory={categorySlug}
      />

      {/* Show active filters */}
      {(categorySlug || searchQuery) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categorySlug && (
            <div className="flex items-center gap-2 bg-secondaryColor/10 text-secondaryColor px-3 py-1 rounded-full text-sm">
              <span>Category: {getCategoryDisplayName(categorySlug)}</span>
              <Link
                href={
                  searchQuery
                    ? `/recipes?recipesearch=${encodeURIComponent(searchQuery)}`
                    : "/recipes"
                }
                className="hover:bg-secondaryColor/20 rounded-full p-1"
              >
                ×
              </Link>
            </div>
          )}
          {searchQuery && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
              <span>Search: &quot;{searchQuery}&quot;</span>
              <a
                href={
                  categorySlug
                    ? `/recipes?categorySlug=${encodeURIComponent(categorySlug)}`
                    : "/recipes"
                }
                className="hover:bg-blue-200 rounded-full p-1"
              >
                ×
              </a>
            </div>
          )}
          <Link
            href="/recipes"
            className="text-gray-500 hover:text-gray-700 px-3 py-1 text-sm underline"
          >
            Clear all filters
          </Link>
        </div>
      )}

      <RecipeList endpoint={endpoint}>
        <HeadingPrimary title={pageTitle} className="py-10" />
      </RecipeList>
    </div>
  );
}
