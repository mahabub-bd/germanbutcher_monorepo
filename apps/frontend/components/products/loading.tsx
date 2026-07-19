import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-4">
      {/* Sort Bar Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-6">
        {/* Filters Skeleton */}
        <div className="min-w-76 hidden md:block">
          <div className="p-4 bg-white bg-opacity-25 rounded-xl shadow-lg">
            <div className="space-y-6">
              {/* Filter Header */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-16" />
              </div>

              {/* Featured Toggle */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-12" />
              </div>

              {/* Filter Sections */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-24" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="md:hidden fixed top-32 left-4 z-50">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* Products Grid Skeleton */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="relative group text-center transition-all duration-300 bg-white bg-opacity-25 p-4 sm:p-3 flex flex-col justify-between items-center rounded-xl min-h-[280px] xs:min-h-[300px] sm:min-h-[320px] md:min-h-[340px] shadow-lg"
              >
                {/* Stock Badge Skeleton */}
                <Skeleton className="absolute top-2 right-2 h-5 w-16 rounded-full" />

                {/* Discount Badge Skeleton */}
                <Skeleton className="absolute top-2 left-2 h-5 w-12 rounded-full" />

                {/* Image Container Skeleton */}
                <div className="w-[120px] h-[120px] xs:w-[140px] xs:h-[140px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px] relative my-2 sm:my-3">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>

                {/* Product Name Skeleton */}
                <div className="mt-4 sm:mt-5 px-2 w-full">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>

                {/* Weight Skeleton */}
                <div className="flex items-center justify-center mt-1">
                  <Skeleton className="h-3 w-3 rounded mr-1" />
                  <Skeleton className="h-3 w-12" />
                </div>

                {/* Price Skeleton */}
                <div className="flex items-center justify-center my-2 sm:my-2 md:flex-row flex-col">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-16 ml-2" />
                </div>

                {/* Action Buttons Skeleton */}
                <div className="grid grid-cols-2 gap-2 w-full mt-3 sm:mt-4">
                  <Skeleton className="h-8 xs:h-7 sm:h-8 rounded" />
                  <Skeleton className="h-8 xs:h-7 sm:h-8 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
