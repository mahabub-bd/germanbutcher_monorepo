function ProductCardSkeleton() {
  return (
    <div className="group relative bg-gray-100 rounded-sm border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      {/* Image Container */}
      <div className="w-full aspect-square bg-gray-200 mb-3 relative">
        {/* Discount/Badge Placeholder */}
        <div className="absolute top-2 right-2 w-10 h-10 bg-gray-300 rounded-full" />
      </div>

      {/* Content Section */}
      <div className="p-1 md:p-2 lg:p-2 flex flex-col gap-2">
        {/* Product Name */}
        <div className="h-4 bg-gray-300 rounded w-4/5" />
        <div className="h-4 bg-gray-300 rounded w-3/5" />

        {/* Price and Weight Row */}
        <div className="flex items-center justify-between mt-2">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <div className="h-5 bg-gray-300 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-10" />
          </div>

          {/* Weight */}
          <div className="h-5 bg-gray-200 rounded-full w-14" />
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="p-3">
        <div className="h-10 bg-gray-300 rounded w-full" />
      </div>
    </div>
  );
}

// Grid skeleton
function ProductHomepageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:px-0 px-8 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-2 md:gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-2 md:gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export { ProductHomepageSkeleton, ProductSkeleton };
