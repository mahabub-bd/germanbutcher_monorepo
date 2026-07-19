import { Skeleton } from "@/components/ui/skeleton";

export function ProductListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}
