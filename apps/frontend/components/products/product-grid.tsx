import { fetchDataPagination } from "@/utils/api-utils";
import type { Product } from "@/utils/types";
import { AlertCircle, Package, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PaginationComponent } from "../common/pagination";
import ProductCard from "./product-card";
import { ProductSkeleton } from "./product-skeleton";

interface ProductListProps {
  filterParams: {
    limit?: string;
    page?: string;
    category?: string;
    brand?: string;
    featured?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

interface PaginatedResponse {
  data: Product[];
  total: number;
  totalPages: number;
}

const createUrlParams = (
  filterParams: ProductListProps["filterParams"]
): URLSearchParams => {
  const params = new URLSearchParams();

  Object.entries(filterParams).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, value);
    }
  });

  return params;
};

const generatePaginationUrls = (
  baseParams: URLSearchParams,
  totalPages: number
): Record<number, string> => {
  const urls: Record<number, string> = {};

  for (let page = 1; page <= totalPages; page++) {
    const newParams = new URLSearchParams(baseParams.toString());
    newParams.set("page", page.toString());
    urls[page] = `?${newParams.toString()}`;
  }

  return urls;
};

const ErrorState = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Oops! Something went wrong
    </h3>
    <p className="text-gray-600 mb-6 max-w-md">
      We couldn&apos;t load the products right now. Please check your connection
      and try again.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </button>
    )}
  </div>
);

/**
 * Empty State Component
 */
const EmptyState = ({ hasFilters }: { hasFilters: boolean }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {hasFilters ? (
      <Search className="h-16 w-16 text-gray-400 mb-4" />
    ) : (
      <Package className="h-16 w-16 text-gray-400 mb-4" />
    )}

    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {hasFilters ? "No products match your search" : "No products available"}
    </h3>

    <p className="text-gray-600 mb-6 max-w-md">
      {hasFilters
        ? "Try adjusting your filters or search terms to find what you're looking for."
        : "We dont have any products to show right now. Please check back later."}
    </p>

    {hasFilters && (
      <Link
        href="?"
        className="inline-flex items-center px-4 py-2 bg-primaryColor text-white rounded-md  transition-colors"
      >
        Clear All
      </Link>
    )}
  </div>
);

/**
 * Product Grid Component
 */
const ProductGrid = ({ products }: { products: Product[] }) => (
  <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-2 md:gap-5 md:px-0 px-8">
    {products.map((product: Product) => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
);

/**
 * Pagination Info Component
 */
const PaginationInfo = ({
  currentCount,
  totalCount,
}: {
  currentCount: number;
  totalCount: number;
}) => (
  <div className="flex-1 min-w-0">
    <p className="text-xs text-muted-foreground text-center md:text-left truncate">
      Showing {currentCount} of {totalCount} products
    </p>
  </div>
);

/**
 * Main ProductBarList Component
 */
export default async function ProductBarList({
  filterParams,
}: ProductListProps) {
  const params = createUrlParams(filterParams);

  let response: PaginatedResponse;
  try {
    response = await fetchDataPagination<PaginatedResponse>(
      `products?isActive=true&${params.toString()}`
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return (
      <div className="container mx-auto py-4 sm:px-1 md:py-5 md:px-0">
        <ErrorState />
      </div>
    );
  }

  // Check if we have any active filters
  const hasActiveFilters = Object.values(filterParams).some(
    (value) => value !== undefined && value !== "" && value !== "1" // "1" is default page
  );

  const currentPage = Number.parseInt(filterParams.page || "1");
  const paginationUrls = generatePaginationUrls(params, response.totalPages);

  return (
    <div className="container mx-auto  py-4 md:py-5">
      {response.data && response.data.length > 0 ? (
        <>
          <Suspense fallback={<ProductSkeleton />}>
            <ProductGrid products={response.data} />
          </Suspense>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
            <PaginationInfo
              currentCount={response.data.length}
              totalCount={response.total}
            />

            <div className="flex-1 w-full md:w-auto">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={response.totalPages}
                paginationUrls={paginationUrls}
              />
            </div>
          </div>
        </>
      ) : (
        <EmptyState hasFilters={hasActiveFilters} />
      )}
    </div>
  );
}
