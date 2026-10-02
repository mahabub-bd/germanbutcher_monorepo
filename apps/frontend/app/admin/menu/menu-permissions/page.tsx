"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";
import { IconRenderer } from "@/components/common/IconRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { fetchProtectedData, putData } from "@/utils/api-utils";
import { MenuItem, Role } from "@/utils/types";
import {
  ChevronDown,
  Eye,
  FilePlus2,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Search,
  SearchX,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface MenuPermission {
  id: number;
  roleId: number;
  menuId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface PermFlags {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

type DraftFlags = PermFlags & { dirty?: boolean };

const NO_FLAGS: PermFlags = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};

const ALL_FLAGS: PermFlags = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
};

const VIEW_ONLY: PermFlags = { ...ALL_FLAGS, canCreate: false, canEdit: false, canDelete: false };

const ACTIONS: {
  key: keyof PermFlags;
  label: string;
  icon: typeof Eye;
  hint: string;
}[] = [
  {
    key: "canView",
    label: "View",
    icon: Eye,
    hint: "Menu is visible in the sidebar and the page can be opened",
  },
  {
    key: "canCreate",
    label: "Create",
    icon: FilePlus2,
    hint: "Can add new records in this module (also covers payments and similar create actions)",
  },
  {
    key: "canEdit",
    label: "Edit",
    icon: Pencil,
    hint: "Can update existing records in this module",
  },
  {
    key: "canDelete",
    label: "Delete",
    icon: Trash2,
    hint: "Can permanently remove records in this module",
  },
];

/** Shared grid template so header and rows line up perfectly. */
const GRID_COLS = "grid grid-cols-[minmax(0,1fr)_repeat(4,72px)] items-center";

export default function RoleMenuPermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [menuPermissions, setMenuPermissions] = useState<
    Record<number, DraftFlags>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [panel, setPanel] = useState<"admin" | "user">("admin");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );
  // Last saved state per menu — used by Discard to drop draft edits.
  const [savedSnapshot, setSavedSnapshot] = useState<Record<number, PermFlags>>(
    {}
  );

  const { adminMenus, userMenus } = useMemo(() => {
    const adminMenus: MenuItem[] = [];
    const userMenus: MenuItem[] = [];
    menuTree.forEach((item) =>
      item.isAdminMenu ? adminMenus.push(item) : userMenus.push(item)
    );
    return { adminMenus, userMenus };
  }, [menuTree]);

  const filteredMenus = useMemo(() => {
    const menus = panel === "admin" ? adminMenus : userMenus;
    if (!searchTerm) return menus;

    const filterItems = (items: MenuItem[]): MenuItem[] =>
      items
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

    return filterItems(menus);
  }, [adminMenus, userMenus, panel, searchTerm]);

  const isCustomerRole = useMemo(
    () => selectedRole?.rolename.toLowerCase().includes("customer"),
    [selectedRole]
  );

  // Menus the selected role can already see (saved state, before draft edits).
  const grantedCount = useMemo(
    () => Object.values(menuPermissions).filter((f) => f.canView).length,
    [menuPermissions]
  );
  const totalCount = Object.keys(menuPermissions).length;
  const dirtyIds = useMemo(
    () =>
      Object.entries(menuPermissions)
        .filter(([, f]) => f.dirty)
        .map(([id]) => Number(id)),
    [menuPermissions]
  );

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

  useEffect(() => {
    if (selectedRoleId && roles.length > 0) {
      const role = roles.find((r) => r.id.toString() === selectedRoleId);
      setSelectedRole(role || null);
    } else {
      setSelectedRole(null);
    }
  }, [selectedRoleId, roles]);

  useEffect(() => {
    if (!selectedRoleId || menuTree.length === 0) return;

    const fetchMenuPermissions = async () => {
      setLoading(true);
      try {
        const response = (await fetchProtectedData(
          `menu-permissions/role/${selectedRoleId}`
        )) as unknown as MenuPermission[];

        const newPermissions: Record<number, DraftFlags> = {};
        const initialize = (items: MenuItem[]) => {
          items.forEach((item) => {
            newPermissions[item.id] = { ...NO_FLAGS };
            initialize(item.children ?? []);
          });
        };
        initialize(menuTree);

        response?.forEach((permission) => {
          newPermissions[permission.menuId] = {
            canView: permission.canView,
            canCreate: permission.canCreate ?? false,
            canEdit: permission.canEdit ?? false,
            canDelete: permission.canDelete ?? false,
          };
        });

        setMenuPermissions(newPermissions);
        setSavedSnapshot(
          Object.fromEntries(
            Object.entries(newPermissions).map(([id, f]) => [id, { ...f }])
          )
        );
        // Expand sections that have at least one granted child.
        const open = new Set<number>();
        menuTree.forEach((item) => {
          if (item.children?.some((c) => newPermissions[c.id]?.canView)) {
            open.add(item.id);
          }
        });
        setExpandedSections(open);
      } catch (error) {
        console.error("Error fetching menu permissions:", error);
        toast.error("Failed to load menu permissions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuPermissions();
  }, [selectedRoleId, menuTree]);

  // Draft update. Any action implies View; clearing View clears the rest.
  const applyFlags = (ids: number[], next: PermFlags) => {
    const normalized: PermFlags =
      !next.canView && (next.canCreate || next.canEdit || next.canDelete)
        ? { ...next, canView: true }
        : next;
    setMenuPermissions((prev) => {
      const copy = { ...prev };
      for (const id of ids) {
        copy[id] = { ...normalized, dirty: true };
      }
      return copy;
    });
  };

  const handleFlagChange = (
    ids: number[],
    key: keyof PermFlags,
    value: boolean
  ) => {
    const current = menuPermissions[ids[0]] ?? NO_FLAGS;
    const next: PermFlags = { ...current, [key]: value };
    if (key !== "canView" && value) next.canView = true;
    if (key === "canView" && !value) {
      next.canCreate = false;
      next.canEdit = false;
      next.canDelete = false;
    }
    applyFlags(ids, next);
  };

  const handleSectionPreset = (item: MenuItem, preset: PermFlags) => {
    const ids = [item.id, ...(item.children?.map((c) => c.id) ?? [])];
    applyFlags(ids, preset);
  };

  const toggleSection = (id: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId || dirtyIds.length === 0) return;
    setSaving(true);
    try {
      const permissions = dirtyIds.map((id) => {
        const { dirty: _d, ...flags } = menuPermissions[id];
        void _d;
        return { menuId: id, ...flags };
      });
      const response = await putData(
        `menu-permissions/role/${selectedRoleId}`,
        { permissions }
      );
      if (response?.statusCode !== 200) {
        throw new Error(response?.message || "Failed to save permissions");
      }
      setMenuPermissions((prev) => {
        const next = { ...prev };
        for (const id of dirtyIds) {
          const { dirty: _d, ...clean } = next[id];
          void _d;
          next[id] = clean;
        }
        return next;
      });
      setSavedSnapshot((prev) => {
        const next = { ...prev };
        for (const id of dirtyIds) {
          const { dirty: _d, ...clean } = menuPermissions[id];
          void _d;
          next[id] = clean;
        }
        return next;
      });
      toast.success(
        `Saved ${permissions.length} permission row${permissions.length > 1 ? "s" : ""}`
      );
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (dirtyIds.length === 0) return;
    setMenuPermissions((prev) => {
      const next: Record<number, DraftFlags> = {};
      for (const [id, flags] of Object.entries(prev)) {
        const saved = savedSnapshot[Number(id)];
        next[Number(id)] = saved ? { ...saved } : { ...NO_FLAGS };
      }
      return next;
    });
  };

  const renderFlagControl = (
    ids: number[],
    key: keyof PermFlags,
    flags: DraftFlags,
    disabled: boolean
  ) => {
    const action = ACTIONS.find((a) => a.key === key)!;
    const anyAction = flags.canCreate || flags.canEdit || flags.canDelete;
    const dimmed = key !== "canView" && !flags.canView;
    const value = Boolean(flags[key]);

    if (key === "canView") {
      return (
        <div className="flex justify-center">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) =>
                      handleFlagChange(ids, key, checked)
                    }
                    disabled={disabled}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-56 text-xs">
                {action.hint}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }

    return (
      <div className="flex justify-center">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(dimmed && !anyAction && "opacity-35")}>
                <Checkbox
                  checked={value}
                  onCheckedChange={(checked) =>
                    handleFlagChange(ids, key, checked === true)
                  }
                  disabled={disabled}
                  aria-label={`${action.label} permission`}
                  className="size-4.5"
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-xs">
              {action.hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const renderRow = (
    ids: number[],
    label: string,
    icon?: string | null,
    isChild = false
  ) => {
    const flags = menuPermissions[ids[0]] ?? NO_FLAGS;
    const disabled = !selectedRoleId || loading || saving;
    const granted = flags.canView;

    return (
      <div
        key={ids.join("-")}
        className={cn(
          GRID_COLS,
          "h-11 border-b px-3 transition-colors last:border-b-0",
          isChild && "pl-3",
          granted ? "bg-primary/[0.04]" : "bg-transparent",
          flags.dirty && "bg-amber-50/70 dark:bg-amber-950/20",
          "hover:bg-muted/50"
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {flags.dirty && (
            <span
              className="size-1.5 shrink-0 rounded-full bg-amber-500"
              title="Unsaved change"
            />
          )}
          {icon && (
            <IconRenderer
              name={icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
          )}
          <span
            className={cn(
              "truncate text-sm",
              isChild ? "text-primaryColor/90" : "text-primaryColor font-medium"
            )}
          >
            {label}
          </span>
        </div>
        {ACTIONS.map(({ key }) => (
          <span key={key} className="contents">
            {renderFlagControl(ids, key, flags, disabled)}
          </span>
        ))}
      </div>
    );
  };

  const renderSection = (item: MenuItem) => {
    const children = item.children ?? [];
    const disabled = !selectedRoleId || loading || saving;

    // No children: plain row.
    if (children.length === 0) {
      return renderRow([item.id], item.name, item.icon);
    }

    // One child: single row that controls parent + child together.
    if (children.length === 1) {
      return renderRow([item.id, children[0].id], item.name, item.icon);
    }

    const grantedCount = children.filter(
      (c) => menuPermissions[c.id]?.canView
    ).length;
    const allGranted = grantedCount === children.length;
    const expanded = expandedSections.has(item.id);

    return (
      <div key={item.id} className="overflow-hidden">
        <div
          className={cn(
            "flex h-11 items-center gap-2 border-b bg-muted/50 px-3",
            allGranted && "bg-primary/[0.07]"
          )}
        >
          <button
            onClick={() => toggleSection(item.id)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            disabled={disabled}
          >
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                !expanded && "-rotate-90"
              )}
            />
            {item.icon && (
              <IconRenderer
                name={item.icon}
                className="size-4 shrink-0 text-muted-foreground"
              />
            )}
            <span className="truncate text-sm font-semibold text-primaryColor">{item.name}</span>
            <Badge
              variant={allGranted ? "default" : "secondary"}
              className="shrink-0 tabular-nums"
            >
              {grantedCount}/{children.length}
            </Badge>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-xs"
                disabled={disabled}
              >
                Bulk
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleSectionPreset(item, ALL_FLAGS)}
              >
                Grant all actions
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSectionPreset(item, VIEW_ONLY)}
              >
                View only
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => handleSectionPreset(item, NO_FLAGS)}
              >
                Revoke all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {expanded && (
          <div>
            {children.map((child) =>
              renderRow([child.id], child.name, child.icon, true)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMatrix = () => {
    const sections = filteredMenus;
    const disabled = !selectedRoleId || loading || saving;

    if (sections.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground">
          <SearchX className="size-8" strokeWidth={1.5} />
          <p className="text-sm">
            {searchTerm
              ? `No menus match "${searchTerm}"`
              : `No ${panel} menus available`}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border bg-card">
        {/* Sticky column headers */}
        <div
          className={cn(
            GRID_COLS,
            "sticky top-0 z-10 border-b bg-muted/70 px-3 backdrop-blur py-2"
          )}
        >
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Module
          </span>
          {ACTIONS.map(({ key, label, icon: Icon, hint }) => (
            <TooltipProvider key={key} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex cursor-default items-center justify-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-60 text-xs">
                  {hint}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
          {sections.map((item) => renderSection(item))}
        </div>
      </div>
    );
  };

  const canManage = Boolean(selectedRoleId) && !loading;

  return (
    <div className="w-full p-2 md:p-6">
      <PageHeader
        title="Role Permissions"
        description="Pick a role, then set what it can do in each module. View controls sidebar visibility; Create, Edit and Delete are enforced on the API."
      />

      {/* Sticky toolbar */}
      <div className="sticky top-2 z-20 mb-4 rounded-xl border bg-card/95 p-3 shadow-sm backdrop-blur md:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-primaryColor">Role</label>
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
              <Badge variant="secondary" className="capitalize">
                {selectedRole.rolename}
              </Badge>
            )}
            {canManage && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                <span className="tabular-nums">
                  <span className="font-semibold text-primaryColor">
                    {grantedCount}
                  </span>
                  /{totalCount} visible
                </span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search modules..."
                className="h-9 pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {dirtyIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw className="size-4" />
                Discard
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || dirtyIds.length === 0}
              size="sm"
              className="min-w-32"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {dirtyIds.length > 0
                ? `Save ${dirtyIds.length} change${dirtyIds.length > 1 ? "s" : ""}`
                : "All saved"}
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Switch checked disabled className="h-4 w-7 [&>span]:size-3" />
            View = visible in sidebar
          </span>
          <span className="flex items-center gap-1.5">
            <Checkbox checked disabled className="size-3.5" />
            Create / Edit / Delete enforced on the API
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-500" />
            unsaved change
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingIndicator message="Loading Role Permissions..." />
      ) : !selectedRoleId ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <ShieldCheck
            className="size-10 text-muted-foreground/50"
            strokeWidth={1.5}
          />
          <div>
            <p className="font-medium text-primaryColor">No role selected</p>
            <p className="text-sm text-muted-foreground">
              Select a role above to configure its module permissions
            </p>
          </div>
        </div>
      ) : (
        <Tabs
          value={panel}
          onValueChange={(v) => setPanel(v as "admin" | "user")}
        >
          <TabsList className="mb-3">
            <TabsTrigger value="admin" disabled={isCustomerRole}>
              Admin modules
              <Badge variant="outline" className="ml-2 tabular-nums">
                {adminMenus.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="user" disabled={!isCustomerRole}>
              Customer modules
              <Badge variant="outline" className="ml-2 tabular-nums">
                {userMenus.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          {renderMatrix()}
        </Tabs>
      )}
    </div>
  );
}
