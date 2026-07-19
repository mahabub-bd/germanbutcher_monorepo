import { CategoryFilters } from "@/components/products/filter/category-filters";
import ProductBarList from "@/components/products/product-grid";
import { SortBar } from "@/components/products/sort-bar";
import { formatSlugToTitle } from "@/lib/utils";
import { fetchData, fetchProtectedData } from "@/utils/api-utils";
import type { Brand, Category } from "@/utils/types";
import { ProductsBreadcrumb } from "./product-breadcrumb";

// Combined data fetching
async function fetchInitialData() {
  try {
    const [categories, brands, tags] = await Promise.all([
      fetchData<Category[]>("categories/tree"),
      fetchData<Brand[]>("brands"),
      fetchProtectedData<string[]>("products/tags").catch(() => []),
    ]);
    return {
      categories,
      brands,
      tags: tags || []
    };
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return { categories: [], brands: [], tags: [] };
  }
}

const priceRanges = [
  { min: 0, max: 200, label: "Under BDT 200" },
  { min: 200, max: 500, label: "BDT 200 - 500" },
  { min: 500, max: 1000, label: "BDT 500 - 1,000" },
  { min: 1000, max: 1500, label: "BDT 1,000 - 1,500" },
  { min: 1500, max: 2000, label: "BDT 1,500 - 2,000" },
  { min: 2000, max: Number.POSITIVE_INFINITY, label: "Above BDT 2,000" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    limit?: string;
    page?: string;
    category?: string;
    brand?: string;
    featured?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    tags?: string;
  }>;
}) {
  const { categories, brands, tags } = await fetchInitialData();

  const filterParams = {
    limit: (await searchParams).limit || "24",
    page: (await searchParams).page || "1",
    category: (await searchParams).category,
    brand: (await searchParams).brand,
    featured: (await searchParams).featured,
    sort: (await searchParams).sort,
    minPrice: (await searchParams).minPrice,
    maxPrice: (await searchParams).maxPrice,
    tags: (await searchParams).tags,
  };

  return (
    <div className="container mx-auto md:px-0 px-2">
      {/* Mobile Header */}
      <div className="md:hidden">
        <ProductsBreadcrumb
          categoryName={
            (await searchParams).category
              ? formatSlugToTitle((await searchParams).category ?? "")
              : undefined
          }
          categorySlug={(await searchParams).category}
          brandName={
            (await searchParams).brand
              ? formatSlugToTitle((await searchParams).brand ?? "")
              : undefined
          }
          brandSlug={(await searchParams).brand}
        />
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex md:flex-row md:justify-between md:items-center">
        <ProductsBreadcrumb
          categoryName={
            (await searchParams).category
              ? formatSlugToTitle((await searchParams).category ?? "")
              : undefined
          }
          categorySlug={(await searchParams).category}
          brandName={
            (await searchParams).brand
              ? formatSlugToTitle((await searchParams).brand ?? "")
              : undefined
          }
          brandSlug={(await searchParams).brand}
        />
        <SortBar currentSort={(await searchParams).sort} />
      </div>

      {/* Mobile Filters */}
      <div className="flex flex-row justify-between items-center gap-4  md:hidden">
        <CategoryFilters
          categories={categories}
          brands={brands}
          priceRanges={priceRanges}
          tags={tags}
          currentCategory={(await searchParams).category}
          currentBrand={(await searchParams).brand}
          currentFeatured={(await searchParams).featured === "true"}
          currentPriceRange={{
            min: (await searchParams).minPrice,
            max: (await searchParams).maxPrice,
          }}
          currentTags={(await searchParams).tags}
        />
        <SortBar currentSort={(await searchParams).sort} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex md:flex-row md:justify-between gap-6">
        <CategoryFilters
          categories={categories}
          brands={brands}
          priceRanges={priceRanges}
          tags={tags}
          currentCategory={(await searchParams).category}
          currentBrand={(await searchParams).brand}
          currentFeatured={(await searchParams).featured === "true"}
          currentPriceRange={{
            min: (await searchParams).minPrice,
            max: (await searchParams).maxPrice,
          }}
          currentTags={(await searchParams).tags}
        />
        <div className="flex-1">
          <ProductBarList filterParams={filterParams} />
        </div>
      </div>

      {/* Mobile Products */}
      <div className="md:hidden">
        <ProductBarList filterParams={filterParams} />
      </div>
    </div>
  );
}
