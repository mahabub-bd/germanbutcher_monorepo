import { fetchData } from "@/utils/api-utils";
import { Product } from "@/utils/types";
import ProductCard from "./product-card";

export default async function ProductHomepageGrid({
  endpoint,
  isHomePage,
  products: preloaded,
}: {
  endpoint: string;
  isHomePage: boolean;
  /** Skip the internal fetch and render these instead (flash-sale section
   * needs the list first to decide whether to render at all). */
  products?: Product[];
}) {
  let products: Product[] = preloaded ?? [];

  if (!preloaded) {
    try {
      products = await fetchData(endpoint);
    } catch (error) {
      // Silently return null for missing similar products
      return null;
    }
  }

  if (!products?.length) {
    return null;
  }

  const visibleProducts = isHomePage ? products.slice(0, 8) : products;
  const extraProducts = isHomePage ? products.slice(8, 10) : [];

  return (
    <div className="grid grid-cols-1 md:px-0 px-8 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-2 md:gap-5">
      {visibleProducts.map((product: Product) => (
        <ProductCard key={product.id} product={product} />
      ))}

      {extraProducts.map((product: Product) => (
        <ProductCard
          key={product.id}
          product={product}
          className="hidden 2xl:block"
        />
      ))}
    </div>
  );
}
