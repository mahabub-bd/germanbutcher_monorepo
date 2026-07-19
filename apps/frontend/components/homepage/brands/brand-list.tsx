import RecommendedProductCard from "@/components/products/RecommendedProductCard";
import { fetchData } from "@/utils/api-utils";
import { Product } from "@/utils/types";
import { ReactNode, Suspense } from "react";
import BrandSkeleton from "./brand-skeleton";

export default async function BrandList({
  children,
  endpoint,
}: {
  children: ReactNode;
  endpoint: string;
}) {
  const products: Product[] = await fetchData(endpoint);

  return (
    <div className="container mx-auto py-4 px-3 sm:px-1 md:py-8 lg:py-10">
      {children}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <Suspense
          fallback={
            <div className="col-span-full grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {[...Array(6)].map((_, i) => (
                <BrandSkeleton key={i} />
              ))}
            </div>
          }
        >
          {products?.map((product: Product, index: number) => {
            // Hide products 9 and 10 (index 8 and 9) on screens smaller than 2xl
            if (index >= 8) {
              return (
                <div key={product.id} className="hidden 2xl:block">
                  <RecommendedProductCard product={product} />
                </div>
              );
            }
            return (
              <RecommendedProductCard key={product.id} product={product} />
            );
          })}
        </Suspense>
      </div>
    </div>
  );
}
