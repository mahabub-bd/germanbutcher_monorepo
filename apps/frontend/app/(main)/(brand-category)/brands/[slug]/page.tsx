import CategoryBrandProductList from "@/components/products/brand-category-product-list";
import { SortBar } from "@/components/products/sort-bar";
import { buildQueryString } from "@/utils/api-utils";

export default async function BrandPage({
  params,
  searchParams,
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
  const queryParams = {
    slug: (await params).slug,
    sort: (await searchParams).sort,
    minPrice: (await searchParams).minPrice,
    maxPrice: (await searchParams).maxPrice,
    featured: (await searchParams).featured,
    tags: (await searchParams).tags,
  };

  const url = `brands?${buildQueryString(queryParams)}`;

  return (
    <div className="container mx-auto">
      <SortBar currentSort={(await searchParams).sort} />
      <CategoryBrandProductList endpoint={url} path="brands" />
    </div>
  );
}
