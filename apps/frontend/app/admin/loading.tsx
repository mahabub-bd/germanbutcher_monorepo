import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Toolbar: search + filter selects */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-56" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-40" />
        ))}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="space-y-3 px-4 py-3">
          {/* Column header row */}
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* Row skeletons */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-5 flex-1" />
              ))}
            </div>
          ))}
        </div>
        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
