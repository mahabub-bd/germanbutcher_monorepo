"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";
import { IconRenderer } from "@/components/common/IconRenderer";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { fetchProtectedData, patchData } from "@/utils/api-utils";
import { MenuItem, Role } from "@/utils/types";
import { Loader2, Search, SearchX, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface MenuPermission {
  id: number;
  roleId: number;
  menuId: number;
  canView: boolean;
  menu: {
    id: number;
    name: string;
    isAdminMenu: boolean;
    icon?: string;
  };
  role: {
    id: number;
    rolename: string;
  };
}

export default function RoleMenuPermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [menuPermissions, setMenuPermissions] = useState<
    Record<number, boolean>
  >({});
  const [loading, setLoading] = useState(false);
  // Id of the menu whose checkbox(es) are being saved; a parent id while a
  // whole section batch is in flight.
  const [savingMenuId, setSavingMenuId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { adminMenus, userMenus } = useMemo(() => {
    const adminMenus: MenuItem[] = [];
    const userMenus: MenuItem[] = [];

    const categorizeMenus = (items: MenuItem[]) => {
      items.forEach((item) => {
        if (item.isAdminMenu) {
          adminMenus.push(item);
        } else {
          userMenus.push(item);
        }
      });
    };

    if (menuTree.length > 0) {
      categorizeMenus(menuTree);
    }

    return { adminMenus, userMenus };
  }, [menuTree]);

  // Memoized filtered menu tree for both panels
  const { filteredAdminMenus, filteredUserMenus } = useMemo(() => {
    if (!searchTerm) {
      return {
        filteredAdminMenus: adminMenus,
        filteredUserMenus: userMenus,
      };
    }

    const filterItems = (items: MenuItem[]): MenuItem[] => {
      return items
        .map((item) => {
          const matches = item.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
          const filteredChildren = item.children?.length
            ? filterItems(item.children)
            : [];

          if (matches || filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return null;
        })
        .filter(Boolean) as MenuItem[];
    };

    return {
      filteredAdminMenus: filterItems([...adminMenus]),
      filteredUserMenus: filterItems([...userMenus]),
    };
  }, [adminMenus, userMenus, searchTerm]);

  const isCustomerRole = useMemo(() => {
    return selectedRole?.rolename.toLowerCase().includes("customer");
  }, [selectedRole]);

  // Overall progress across every menu in the tree.
  const { grantedCount, totalCount } = useMemo(() => {
    const values = Object.values(menuPermissions);
    return {
      grantedCount: values.filter(Boolean).length,
      totalCount: values.length,
    };
  }, [menuPermissions]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [rolesData, menuData] = await Promise.all([
          fetchProtectedData("roles") as Promise<Role[]>,
          fetchProtectedData("menu/tree") as Promise<MenuItem[]>,
        ]);

        if (rolesData) setRoles(rolesData);
        if (menuData) setMenuTree(menuData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load initial data. Please try again.");
      }
    };

    fetchInitialData();
  }, []);

  // Set selected role when role ID changes
  useEffect(() => {
    if (selectedRoleId && roles.length > 0) {
      const role = roles.find((r) => r.id.toString() === selectedRoleId);
      setSelectedRole(role || null);
    } else {
      setSelectedRole(null);
    }
  }, [selectedRoleId, roles]);

  // Fetch menu permissions when role is selected
  useEffect(() => {
    if (!selectedRoleId || menuTree.length === 0) return;

    const fetchMenuPermissions = async () => {
      setLoading(true);
      try {
        const response = (await fetchProtectedData(
          `menu-permissions/role/${selectedRoleId}`
        )) as MenuPermission[];

        const newPermissions: Record<number, boolean> = {};

        // Initialize all permissions as false first
        const initializePermissions = (items: MenuItem[]) => {
          items.forEach((item) => {
            newPermissions[item.id] = false;
            if (item.children?.length) initializePermissions(item.children);
          });
        };
        initializePermissions(menuTree);

        // Update with actual permissions from API
        response?.forEach((permission) => {
          newPermissions[permission.menuId] = permission.canView;
        });

        setMenuPermissions(newPermissions);
      } catch (error) {
        console.error("Error fetching menu permissions:", error);
        toast.error("Failed to load menu permissions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuPermissions();
  }, [selectedRoleId, menuTree]);

  const handlePermissionChange = async (menuId: number, canView: boolean) => {
    if (!selectedRoleId) {
      toast.error("Please select a role first");
      return;
    }

    setSavingMenuId(menuId);
    try {
      const response = await patchData(
        `menu-permissions/${selectedRoleId}/${menuId}`,
        { canView }
      );

      if (response?.statusCode === 200) {
        setMenuPermissions((prev) => ({ ...prev, [menuId]: canView }));
        toast.success(
          `Permission ${canView ? "granted" : "revoked"} successfully`
        );
      } else {
        throw new Error(response?.message || "Failed to update permission");
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      toast.error("Failed to update permission. Please try again.");
    } finally {
      setSavingMenuId(null);
    }
  };

  // Check/uncheck a whole section (parent + all children) in one batch.
  const handleSectionChange = async (item: MenuItem, canView: boolean) => {
    if (!selectedRoleId) {
      toast.error("Please select a role first");
      return;
    }

    const ids = [item.id, ...(item.children?.map((c) => c.id) ?? [])];
    // Snapshot so the sequential loop doesn't depend on re-renders.
    const current = { ...menuPermissions };
    const toChange = ids.filter((id) => current[id] !== canView);

    setSavingMenuId(item.id);
    try {
      for (const id of toChange) {
        const response = await patchData(
          `menu-permissions/${selectedRoleId}/${id}`,
          { canView }
        );
        if (response?.statusCode !== 200) {
          throw new Error(response?.message || "Failed to update permission");
        }
        setMenuPermissions((prev) => ({ ...prev, [id]: canView }));
      }
      if (toChange.length > 0) {
        toast.success(
          `Permission ${canView ? "granted" : "revoked"} for ${item.name}`
        );
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Failed to update some permissions. Please try again.");
    } finally {
      setSavingMenuId(null);
    }
  };

  const renderMenuCard = (item: MenuItem) => {
    const children = item.children ?? [];
    const isSectionSaving = savingMenuId === item.id;
    const disabled = !selectedRoleId || loading || isSectionSaving;

    // Standalone menu without children: single checkbox card.
    if (children.length === 0) {
      return (
        <label
          key={item.id}
          className={cn(
            "flex cursor-pointer items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50",
            menuPermissions[item.id] && "border-primary/40 bg-primary/[0.06]"
          )}
        >
          {isSectionSaving ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Checkbox
              checked={menuPermissions[item.id] ?? false}
              onCheckedChange={(checked) =>
                handlePermissionChange(item.id, checked === true)
              }
              disabled={disabled}
            />
          )}
          {item.icon && (
            <IconRenderer
              name={item.icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
          )}
          <span className="truncate text-sm font-medium">{item.name}</span>
        </label>
      );
    }

    // Menu with a single child: one line, checkbox controls parent + child.
    if (children.length === 1) {
      const child = children[0];
      const checked =
        (menuPermissions[item.id] ?? false) &&
        (menuPermissions[child.id] ?? false);

      return (
        <label
          key={item.id}
          className={cn(
            "flex cursor-pointer items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50",
            checked && "border-primary/40 bg-primary/[0.06]"
          )}
        >
          {isSectionSaving ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Checkbox
              checked={checked}
              onCheckedChange={(checked) =>
                handleSectionChange(item, checked === true)
              }
              disabled={disabled}
            />
          )}
          {item.icon && (
            <IconRenderer
              name={item.icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
          )}
          <span className="truncate text-sm font-medium">{item.name}</span>
        </label>
      );
    }

    // Section with children: parent checkbox + grid of child checkboxes.
    const checkedCount = children.filter((c) => menuPermissions[c.id]).length;
    const allChecked = checkedCount === children.length;
    const someChecked = checkedCount > 0 && !allChecked;

    return (
      <div
        key={item.id}
        className={cn(
          "overflow-hidden rounded-lg border bg-card transition-colors",
          allChecked && "border-primary/40"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2.5">
          <label className="flex min-w-0 cursor-pointer items-center gap-2.5">
            {isSectionSaving ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Checkbox
                checked={
                  someChecked ? "indeterminate" : allChecked ? true : false
                }
                onCheckedChange={(checked) =>
                  handleSectionChange(item, checked === true)
                }
                disabled={disabled}
              />
            )}
            {item.icon && (
              <IconRenderer
                name={item.icon}
                className="size-4 shrink-0 text-muted-foreground"
              />
            )}
            <span className="truncate text-sm font-semibold">{item.name}</span>
          </label>
          <Badge
            variant={allChecked ? "default" : "secondary"}
            className="shrink-0 tabular-nums"
          >
            {checkedCount}/{children.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3 xl:grid-cols-5">
          {children.map((child) => (
            <label
              key={child.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-sm transition-colors hover:bg-muted/50",
                menuPermissions[child.id]
                  ? "border-primary/40 bg-primary/[0.06]"
                  : "bg-background"
              )}
            >
              <Checkbox
                checked={menuPermissions[child.id] ?? false}
                onCheckedChange={(checked) =>
                  handlePermissionChange(child.id, checked === true)
                }
                disabled={disabled}
              />
              <span className="truncate">{child.name}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderPanel = (isAdminPanel: boolean) => {
    const menus = isAdminPanel ? filteredAdminMenus : filteredUserMenus;
    const panelName = isAdminPanel ? "Admin Panel" : "User Panel";
    const searchPlaceholder = isAdminPanel
      ? "Search admin menus..."
      : "Search user menus...";
    const noResultsMessage = searchTerm
      ? `No ${panelName.toLowerCase()} menus match "${searchTerm}"`
      : `No ${panelName.toLowerCase()} menus available`;

    // Single-line cards flow into a grid; multi-child sections span the
    // full width so their child grids get room.
    const singles = menus.filter((m) => (m.children?.length ?? 0) <= 1);
    const sections = menus.filter((m) => (m.children?.length ?? 0) > 1);

    return (
      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="flex flex-col gap-3 border-b bg-muted/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-sm font-semibold">{panelName} Menus</span>
            <Badge variant="outline" className="shrink-0 tabular-nums">
              {menus.length} {menus.length === 1 ? "menu" : "menus"}
            </Badge>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              className="h-8 pl-8 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {menus.length > 0 ? (
          <div className="space-y-4 p-3 sm:p-4">
            {singles.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {singles.map((item) => renderMenuCard(item))}
              </div>
            )}
            {sections.map((item) => renderMenuCard(item))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <SearchX className="size-8" strokeWidth={1.5} />
            <p className="text-sm">{noResultsMessage}</p>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="w-full p-2 md:p-6">
      <PageHeader
        title="Menu Permissions"
        description="Assign menu permissions to different roles. Select a role and check menu visibility."
      />

      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-sm font-medium">Select Role</label>
          <Select
            value={selectedRoleId}
            onValueChange={setSelectedRoleId}
            disabled={roles.length === 0}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles?.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {capitalizeFirstLetter(role.rolename)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRole && (
            <Badge variant="secondary" className="w-fit capitalize">
              {selectedRole.rolename}
            </Badge>
          )}
        </div>

        {selectedRoleId && !loading && totalCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            <span className="tabular-nums">
              <span className="font-semibold text-foreground">
                {grantedCount}
              </span>
              /{totalCount} menus granted
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingIndicator message="Loading Menu Permissions..." />
      ) : (
        <div className="space-y-6">
          {selectedRoleId && (
            <>
              {/* Render Admin Panel for non-customer roles */}
              {!isCustomerRole && renderPanel(true)}

              {/* Render User Panel only for customer roles */}
              {isCustomerRole && renderPanel(false)}
            </>
          )}

          {!selectedRoleId && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
              <ShieldCheck
                className="size-10 text-muted-foreground/50"
                strokeWidth={1.5}
              />
              <div>
                <p className="font-medium">No role selected</p>
                <p className="text-sm text-muted-foreground">
                  Select a role above to view and manage its menu permissions
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
