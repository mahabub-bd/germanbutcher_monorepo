"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchProtectedData } from "@/utils/api-utils";
import type { MenuPermissionFlags, MyPermissions } from "@/utils/types";

export type { MenuPermissionFlags } from "@/utils/types";
export type PermAction = "canView" | "canCreate" | "canEdit" | "canDelete";

interface PermissionContextValue {
  isLoading: boolean;
  roleId: number;
  roleName: string;
  isActive: boolean;
  permissions: Map<string, MenuPermissionFlags>;
}

const defaultContext: PermissionContextValue = {
  isLoading: true,
  roleId: 0,
  roleName: "",
  isActive: true,
  permissions: new Map(),
};

const PermissionContext = createContext<PermissionContextValue>(defaultContext);

export function PermissionProvider({
  children,
  userIsAdmin = false,
}: {
  children: ReactNode;
  /** Session-level admin flag from the layout — bypasses permission checks
   * even before/without the my-permissions fetch. */
  userIsAdmin?: boolean;
}) {
  const [value, setValue] = useState<PermissionContextValue>({
    ...defaultContext,
    roleName: userIsAdmin ? "superadmin" : "",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchProtectedData<MyPermissions>(
          "menu-permissions/my-permissions"
        );
        if (!active) return;
        const map = new Map<string, MenuPermissionFlags>();
        for (const p of res.permissions ?? []) {
          if (p.url) map.set(p.url, p);
        }
        setValue({
          isLoading: false,
          roleId: res.roleId ?? 0,
          roleName: res.roleName ?? (userIsAdmin ? "superadmin" : ""),
          isActive: res.isActive ?? true,
          permissions: map,
        });
      } catch (error) {
        if (!active) return;
        console.error("Failed to load permissions:", error);
        setValue({
          isLoading: false,
          roleId: 0,
          roleName: userIsAdmin ? "superadmin" : "",
          isActive: true,
          permissions: new Map(),
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [userIsAdmin]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  return useContext(PermissionContext);
}
