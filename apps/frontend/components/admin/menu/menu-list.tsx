"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PillBadge } from "@/components/common/pill-badge";
import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { deleteData, fetchData, fetchDataPagination } from "@/utils/api-utils";
import type { MenuItem } from "@/utils/types";
import {
  CheckCircle2,
  Copy,
  LayoutList,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface MenuListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function MenuList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: MenuListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/menu/menu-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [parentMenuItems, setParentMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [isMainMenuFilter, setIsMainMenuFilter] = useState(
    getInitialParam("isMainMenu") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (isMainMenuFilter && isMainMenuFilter !== "all")
      params.set("isMainMenu", isMainMenuFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    searchQuery,
    statusFilter,
    isMainMenuFilter,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Parent names resolve ids that fall outside the current page, so the full
  // main-menu list is loaded once on mount.
  const fetchParentMenuItems = async () => {
    try {
      const response = await fetchData<MenuItem[]>(
        "menu/main?isAdminMenu=true"
      );
      setParentMenuItems(response);
    } catch (error) {
      console.error("Error fetching parent menu items:", error);
    }
  };

  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);
      if (isMainMenuFilter && isMainMenuFilter !== "all")
        params.append("isMainMenu", isMainMenuFilter);

      const response = await fetchDataPagination<{
        data: MenuItem[];
        total: number;
        totalPages: number;
      }>(`menu?${params.toString()}`);

      setMenuItems(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Failed to load menu items. Please try again.");
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, statusFilter, isMainMenuFilter]);

  useEffect(() => {
    fetchParentMenuItems();
  }, []);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Update URL when state changes
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handleDeleteClick = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMenuItem) return;

    try {
      await deleteData("menu", selectedMenuItem.id);

      fetchMenuItems();
      toast.success("Menu item deleted successfully");
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast.error("Failed to delete menu item. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setIsMainMenuFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleCopyName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      toast.success("Menu name copied to clipboard");
    } catch {
      toast.error("Failed to copy menu name");
    }
  };

  const getParentMenuName = (parentId: number | null) => {
    if (!parentId) return "None";

    const parentInCurrentPage = menuItems.find((item) => item.id === parentId);
    if (parentInCurrentPage) return parentInCurrentPage.name;

    const parentItem = parentMenuItems.find((item) => item.id === parentId);
    return parentItem ? parentItem.name : "Unknown";
  };

  const activeCount = menuItems.filter((item) => item.isActive).length;
  const inactiveCount = menuItems.length - activeCount;
  const mainMenuCount = menuItems.filter((item) => item.isMainMenu).length;
  const subMenuCount = menuItems.length - mainMenuCount;
  const hasFilters = Boolean(
    searchQuery ||
      (statusFilter && statusFilter !== "all") ||
      (isMainMenuFilter && isMainMenuFilter !== "all")
  );
  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (menuItem: MenuItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {can(MENU_URL, "canEdit") && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/menu/${menuItem.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(menuItem)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Menus"
          description="Website menu structure — main menus, their sub items and the order they appear in."
        >
          {can(MENU_URL, "canCreate") && (
            <Button asChild size="sm">
              <Link href="/admin/menu/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Menu</span>
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchMenuItems}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-nowrap md:items-center md:gap-3">
            <TableSearch
              wrapperClassName="w-full md:max-w-xs"
              className="h-9"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="grid grid-cols-2 gap-2.5 md:flex md:items-center md:gap-3">
              <div className="md:w-35 md:shrink-0">
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) => {
                    setStatusFilter(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:w-37 md:shrink-0">
                <Select
                  value={isMainMenuFilter || "all"}
                  onValueChange={(value) => {
                    setIsMainMenuFilter(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Menu type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All menu types</SelectItem>
                    <SelectItem value="true">Main menu</SelectItem>
                    <SelectItem value="false">Sub menu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasFilters && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  {[
                    searchQuery && `Search: ${searchQuery}`,
                    statusFilter &&
                      statusFilter !== "all" &&
                      `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
                    isMainMenuFilter &&
                      isMainMenuFilter !== "all" &&
                      `Type: ${isMainMenuFilter === "true" ? "Main menu" : "Sub menu"}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </PillBadge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingIndicator message="Loading menus..." />
          </div>
        ) : menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <LayoutList className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No menu items found</p>
              <p className="text-xs text-muted-foreground">
                {hasFilters
                  ? "No menu items match these filters. Try a different name, status or type."
                  : "Get started by adding your first menu item."}
              </p>
            </div>
            {hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              can(MENU_URL, "canCreate") && (
                <Button size="sm" asChild>
                  <Link href="/admin/menu/add">
                    <Plus className="size-4" /> Add Menu
                  </Link>
                </Button>
              )
            )}
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <StatsCard
                icon={LayoutList}
                title="Total items"
                value={totalItems.toLocaleString("en-US")}
                description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle2}
                title="Active"
                value={activeCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="green"
              />
              <StatsCard
                icon={XCircle}
                title="Inactive"
                value={inactiveCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="red"
              />
              <StatsCard
                icon={LayoutList}
                title="Main menus"
                value={mainMenuCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="purple"
              />
              <StatsCard
                icon={LayoutList}
                title="Sub menus"
                value={subMenuCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="orange"
              />
            </div>

            {/* Menu items */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Menu items</h3>
                  <p className="text-xs text-muted-foreground">
                    Sorted by menu order · {limit} per page
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {totalItems.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table min-w-180">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Order</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuItems.map((menuItem) => (
                      <TableRow key={menuItem.id}>
                        <TableCell className="py-2.5 pl-4">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold">
                              {menuItem.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleCopyName(menuItem.name)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span className="sr-only">Copy menu name</span>
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span
                              className="block max-w-55 truncate text-muted-foreground"
                              title={menuItem.url}
                            >
                              {menuItem.url}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleCopyUrl(menuItem.url)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span className="sr-only">Copy URL</span>
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {getParentMenuName(menuItem.parentId)}
                        </TableCell>

                        <TableCell>
                          <PillBadge
                            tone={menuItem.isMainMenu ? "violet" : "orange"}
                          >
                            {menuItem.isMainMenu ? "Main Menu" : "Sub Menu"}
                          </PillBadge>
                        </TableCell>

                        <TableCell>
                          <PillBadge
                            tone={menuItem.isActive ? "emerald" : "red"}
                          >
                            {menuItem.isActive ? "Active" : "Inactive"}
                          </PillBadge>
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            {menuItem.order}
                          </span>
                        </TableCell>

                        <TableCell className="pr-4 text-right">
                          {renderActions(menuItem)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {menuItems.map((menuItem) => (
                  <article key={menuItem.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1">
                        <p className="truncate text-sm font-semibold">
                          {menuItem.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleCopyName(menuItem.name)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="sr-only">Copy menu name</span>
                        </Button>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <PillBadge
                          tone={menuItem.isActive ? "emerald" : "red"}
                        >
                          {menuItem.isActive ? "Active" : "Inactive"}
                        </PillBadge>
                        {renderActions(menuItem)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          URL
                        </p>
                        <p
                          className="truncate text-sm font-semibold"
                          title={menuItem.url}
                        >
                          {menuItem.url}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Parent
                        </p>
                        <p className="truncate text-sm">
                          {getParentMenuName(menuItem.parentId)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Type · Order
                        </p>
                        <p className="text-sm">
                          {menuItem.isMainMenu ? "Main Menu" : "Sub Menu"} ·{" "}
                          <span className="font-semibold tabular-nums">
                            {menuItem.order}
                          </span>
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer: what the list covers */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-xs text-muted-foreground">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} menu item
                  {totalItems === 1 ? "" : "s"}
                  {searchQuery && ` matching “${searchQuery}”`}
                </p>
                {totalPages > 1 && (
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    baseUrl="#"
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
