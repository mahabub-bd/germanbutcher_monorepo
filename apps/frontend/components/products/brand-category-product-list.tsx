import { fetchData } from "@/utils/api-utils";
import type { Brand, Category, Product, Recipe } from "@/utils/types";
import Link from "next/link";
import { HeadingPrimary } from "../common/heading-primary";
import RecipeCard from "../recipe/recipe-card";
import ProductCard from "./product-card";

interface ProductListProps {
  endpoint: string;
  path: "brands" | "categories";
  showTitle?: boolean;
  searchParams?: {
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export default async function CategoryBrandProductList({
  endpoint,
  path,
  showTitle = true,
}: ProductListProps) {
  let title = "";
  let products: Product[] = [];
  let recipes: Recipe[] = [];

  let productCount = 0;

  try {
    const response = (await fetchData(endpoint)) as unknown;

    if (path === "brands" && Array.isArray(response)) {
      const brand = response[0] as Brand;
      title = brand?.name || "";
      products = brand?.products || [];

      productCount = products.length;
    } else {
      const category = Array.isArray(response)
        ? (response[0] as Category)
        : null;
      title = category?.name || "";
      products = category?.products || [];
      recipes = category?.recipes || [];

      productCount = products.length;
    }
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
  }

  return (
    <div className="container mx-auto py-4 ">
      {/* Title Section - Only show if showTitle is true */}
      {showTitle && title && (
        <div className="flex flex-row px-2 md:px-0 justify-between items-center md:items-start">
          <HeadingPrimary title={title} />
          {productCount > 0 && (
            <p className="text-sm text-gray-600 md:mt-2">
              Showing {productCount} product{productCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Products Section */}
      {products?.length > 0 ? (
        <div className="md:px-2 px-8 grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-2 md:gap-5 md:py-5 py-5">
          {products?.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 md:py-20">
          <div className="flex flex-col items-center space-y-4">
            {/* Package/Box Icon */}
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 md:w-10 md:h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9l6-3"
                />
              </svg>
            </div>

            {/* Text Content */}
            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                No products found
              </h3>
              <p className="text-sm md:text-base text-gray-500 max-w-sm">
                We couldn&apos;t find any products matching your criteria. Try
                adjusting your search or filters.
              </p>
            </div>

            {/* Back to Categories Button */}
            <div className="mt-6">
              <Link
                href="/categories"
                className="inline-flex items-center px-4 py-2 bg-primaryColor text-white text-sm font-medium rounded-lg hover:bg-primaryColor/90 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Browse All Categories
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recipes Section */}
      {recipes?.length > 0 && (
        <div className="mt-12">
          <div className="mb-8">
            <HeadingPrimary
              title="Related Recipes"
              subtitle={`Discover delicious recipes using our ${title.toLowerCase()}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {recipes?.map((recipe: Recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
