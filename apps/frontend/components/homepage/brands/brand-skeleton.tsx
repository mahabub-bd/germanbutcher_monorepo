// components/brand-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function BrandSkeleton() {
  return (
    <div className="bg-white bg-opacity-25 p-4 flex flex-col justify-between items-center rounded-xl h-full shadow-md">
      {/* Image placeholder */}
      <div className="w-[145px] h-[145px] relative">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>

      {/* Brand name placeholder */}
      <Skeleton className="h-4 w-3/4 mt-5" />

      {/* Product count placeholder */}
      <Skeleton className="h-3 w-1/2 my-2" />

      {/* Button placeholder */}
      <Skeleton className="h-8 w-full mt-2 rounded-md" />
    </div>
  );
}
