import { fetchData } from "@/utils/api-utils";
import { Category } from "@/utils/types";
import { Suspense } from "react";
import CategoryCard from "./category-card";

// Loading skeleton for categories
function CategoryCardSkeleton() {
  return (
    <div className="group block rounded-lg overflow-hidden animate-pulse">
      <div className="flex w-full items-center justify-center">
        <div className="relative md:w-37.5 md:h-37.5 w-25 h-25 rounded-full p-2 flex items-center justify-center border-2 border-dashed border-gray-200">
          <div className="w-full h-full rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="p-2 text-center">
        <div className="h-6 bg-gray-200 rounded mx-auto w-3/4" />
      </div>
    </div>
  );
}

// Grid skeleton
function CategoryGridSkeleton() {
  return (
    <div className="container mx-auto grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-5 sm:gap-4 md:gap-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Separate component for categories to enable streaming
async function CategoryGrid({ endpoint }: { endpoint: string }) {
  const categories: Category[] = await fetchData(endpoint);

  if (!categories?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No categories found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto grid grid-cols-4 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-2 sm:gap-4 md:gap-6">
      {categories.map((category: Category) => (
        <CategoryCard key={category?.id} category={category} />
      ))}
    </div>
  );
}

interface CategoryListProps {
  children: React.ReactNode;
  endpoint: string;
}

export default function CategoryList({
  children,
  endpoint,
}: CategoryListProps) {
  return (
    <div className=" md:px-0 px-2 pt-5">
      <div className="container mx-auto">{children}</div>

      <Suspense fallback={<CategoryGridSkeleton />}>
        <CategoryGrid endpoint={endpoint} />
      </Suspense>
    </div>
  );
}
