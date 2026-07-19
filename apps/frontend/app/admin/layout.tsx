import { getUser } from "@/actions/auth";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";
import { Skeleton } from "@/components/ui/skeleton";
import type React from "react";
import { Suspense } from "react";

function AdminLayoutSkeleton() {
  return (
    <>
      {/* Sidebar Skeleton */}
      <div className="fixed left-0 top-0 z-50 hidden h-full w-[250px] border-r bg-background md:block lg:w-[260px]">
        <div className="flex h-16 items-center border-b px-6">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2 p-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>

      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b md:bg-background bg-primaryColor md:shadow-none shadow-lg px-6">
        {/* Mobile */}
        <div className="md:hidden flex w-full items-center justify-between">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6" />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<AdminLayoutSkeleton />}>
        <AdminLayoutClient user={user} />
      </Suspense>
      <div className="transition-all duration-300 ease-in-out pt-1 md:pt-0 md:pl-[250px] lg:pl-[260px]">
        <main className="md:p-4 p-2">{children}</main>
      </div>
    </div>
  );
}
