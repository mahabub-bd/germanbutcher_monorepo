"use client";

import { type ReactNode } from "react";
import {
  usePermissionContext,
  type PermAction,
} from "./permission-provider";

/**
 * Permission checks mirror the backend PermissionGuard:
 * exact menu URL first, then the longest ancestor-prefix (section inheritance).
 * superadmin/admin bypass everything.
 *
 * TEMP (2026-10-02): frontend permission gating is disabled — `can()` always
 * returns true so no admin action is blocked while the RBAC rollout is
 * unstable. The backend PermissionGuard still enforces real authorization.
 * TODO: restore the real check before enabling role restrictions.
 */
export function usePermissions() {
  // `permissions` intentionally unused while gating is disabled
  const { isLoading, roleName } = usePermissionContext();

  const can = (_menuUrl: string, _action: PermAction): boolean => {
    // TEMP: always allow. Real check restored from the git history of this file.
    return true;
    /*
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
    */
  };

  return { can, isLoading, roleName };
}

type MenuPrefix = { url: string; flags: { [k in PermAction]: boolean } };

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
