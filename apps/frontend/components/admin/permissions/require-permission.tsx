"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathPermission } from "./use-permissions";

/**
 * Page-level view guard for admin routes. Uses the unknown-route-allow
 * policy: only pages with a matching permission entry are gated on canView —
 * anything the menu map doesn't know about falls through to the backend.
 */
export function RequirePermission({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoading, resolvePath } = usePathPermission();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { matched, canView } = resolvePath(pathname);
  if (!matched || canView) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border bg-background p-8 text-center shadow-sm">
        <ShieldX className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view this page. Contact an
          administrator if you believe this is a mistake.
        </p>
        <Button asChild>
          <Link href="/admin/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
