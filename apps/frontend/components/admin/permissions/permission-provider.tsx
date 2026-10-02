"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchProtectedData } from "@/utils/api-utils";

export type PermAction = "canView" | "canCreate" | "canEdit" | "canDelete";

export interface MenuPermissionFlags {
  menuId: number;
  name: string;
  url: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface PermissionContextValue {
  isLoading: boolean;
  roleName: string;
  permissions: Map<string, MenuPermissionFlags>;
}

const defaultContext: PermissionContextValue = {
  isLoading: true,
  roleName: "",
  permissions: new Map(),
};

const PermissionContext = createContext<PermissionContextValue>(defaultContext);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<PermissionContextValue>(defaultContext);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchProtectedData<{
          roleName: string;
          permissions: MenuPermissionFlags[];
        }>("menu-permissions/my-permissions");
        if (!active) return;
        const map = new Map<string, MenuPermissionFlags>();
        for (const p of res.permissions ?? []) {
          if (p.url) map.set(p.url, p);
        }
        setValue({
          isLoading: false,
          roleName: res.roleName ?? "",
          permissions: map,
        });
      } catch (error) {
        if (!active) return;
        console.error("Failed to load permissions:", error);
        setValue({
          isLoading: false,
          roleName: "",
          permissions: new Map(),
        });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  return useContext(PermissionContext);
}
