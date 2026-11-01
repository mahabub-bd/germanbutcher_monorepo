import { ReactNode, Suspense } from "react";
import { fetchData } from "@/utils/api-utils";
import { Product } from "@/utils/types";
import ViewAllButton from "../homepage/Category/view-all-button";
import ProductGrid from "./product-homepage-grid";
import { ProductHomepageSkeleton } from "./product-skeleton";

interface ProductListProps {
  children: ReactNode;
  endpoint: string;
  isHomePage?: boolean;
  href?: string;
  /** Render nothing at all — title included — when the API returns 0 products
   * (or fails). Used by home-page sections that must disappear entirely. */
  hideWhenEmpty?: boolean;
}

export default async function ProductList({
  children,
  endpoint,
  isHomePage = false,
  href,
  hideWhenEmpty = false,
}: ProductListProps) {
  // Only fetch up front when hiding matters; otherwise the grid fetches
  // inside its own Suspense boundary as before.
  let products: Product[] | undefined;
  if (hideWhenEmpty) {
    try {
      products = await fetchData<Product[]>(endpoint);
    } catch {
      products = [];
    }
    if (!products?.length) return null;
  }

  return (
    <div className="container mx-auto py-4 px-2  md:py-5 lg:py-10 md:px-2">
      {children}

      <Suspense fallback={<ProductHomepageSkeleton />}>
        {/* ProductGrid returns null when there's an error or no products */}
        <ProductGrid endpoint={endpoint} isHomePage={isHomePage} products={products} />
      </Suspense>

      {isHomePage && (
        <div className="pt-6">
          <ViewAllButton href={href || "/products"} />
        </div>
      )}
    </div>
  );
}
