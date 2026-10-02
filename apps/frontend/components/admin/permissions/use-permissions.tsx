"use client";

import { type ReactNode } from "react";
import {
  usePermissionContext,
  type PermAction,
} from "./permission-provider";
import type { MenuPermissionFlags } from "@/utils/types";

/**
 * Permission checks mirror the backend PermissionGuard:
 * exact menu URL first, then the longest ancestor-prefix (section inheritance).
 * superadmin/admin bypass everything.
 */
export function usePermissions() {
  const { isLoading, roleName, permissions } = usePermissionContext();

  const can = (menuUrl: string, action: PermAction): boolean => {
    if (roleName === "superadmin" || roleName === "admin") return true;
    const exact = permissions.get(menuUrl);
    if (exact) return Boolean(exact[action]);
    let best: MenuPrefix | undefined;
    for (const entry of permissions.entries()) {
      if (!menuUrl.startsWith(`${entry[0]}/`)) continue;
      if (!best || entry[0].length > best.url.length) {
        best = { url: entry[0], flags: entry[1] };
      }
    }
    return best ? Boolean(best.flags[action]) : false;
  };

  return { can, isLoading, roleName };
}

type MenuPrefix = { url: string; flags: MenuPermissionFlags };

/**
 * Page-level view check with an unknown-route-allow policy: routes with no
 * matching permission entry (dynamic detail pages, non-menu pages like
 * /admin/profile) are allowed through — the backend still enforces 403.
 */
export function usePathPermission() {
  const { isLoading, roleName, permissions } = usePermissionContext();

  const resolvePath = (
    pathname: string
  ): { matched: boolean; canView: boolean } => {
    if (roleName === "superadmin" || roleName === "admin") {
      return { matched: true, canView: true };
    }
    const exact = permissions.get(pathname);
    if (exact) return { matched: true, canView: Boolean(exact.canView) };
    let best: MenuPrefix | undefined;
    for (const entry of permissions.entries()) {
      if (!pathname.startsWith(`${entry[0]}/`)) continue;
      if (!best || entry[0].length > best.url.length) {
        best = { url: entry[0], flags: entry[1] };
      }
    }
    if (!best) return { matched: false, canView: true };
    return { matched: true, canView: Boolean(best.flags.canView) };
  };

  return { isLoading, resolvePath };
}

export function Can({
  url,
  action,
  children,
}: {
  url: string;
  action: PermAction;
  children: ReactNode;
}) {
  const { can, isLoading } = usePermissions();
  if (isLoading) return null;
  return can(url, action) ? <>{children}</> : null;
}
