import CategoryBrandProductList from "@/components/products/brand-category-product-list";

import { SortBar } from "@/components/products/sort-bar";
import { formatSlugToTitle } from "@/lib/utils";
import { buildQueryString } from "@/utils/api-utils";
import { CategoryBreadcrumb } from "../category-breadcrumb";

export default async function CategoryPage({
  searchParams,
  params,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    featured?: string;
    tags?: string;
  }>;
}) {
  const { slug } = await params;
  const queryParams = {
    slug,
    sort: (await searchParams).sort,
    minPrice: (await searchParams).minPrice,
    maxPrice: (await searchParams).maxPrice,
    featured: (await searchParams).featured,
    tags: (await searchParams).tags,
  };

  const url = `categories?${buildQueryString(queryParams)}`;

  return (
    <div className="container mx-auto md:px-0 px-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <CategoryBreadcrumb categoryName={formatSlugToTitle(slug)} />
        <SortBar currentSort={(await searchParams).sort} />
      </div>

      <CategoryBrandProductList endpoint={url} path="categories" />
    </div>
  );
}
