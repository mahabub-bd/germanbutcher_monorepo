"use client";

import type React from "react";

import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteData, fetchData, fetchDataPagination } from "@/utils/api-utils";
import type { MenuItem } from "@/utils/types";
import {
  Filter,
  LayoutList,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
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

  const fetchMenuItems = async () => {
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
  };

  useEffect(() => {
    fetchParentMenuItems();
    fetchMenuItems();
  }, []);

  useEffect(() => {
    fetchMenuItems();
    updateUrl();
  }, [currentPage, limit, searchQuery, statusFilter, isMainMenuFilter]);

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

  const getParentMenuName = (parentId: number | null) => {
    if (!parentId) return "None";

    const parentInCurrentPage = menuItems.find((item) => item.id === parentId);
    if (parentInCurrentPage) return parentInCurrentPage.name;

    const parentItem = parentMenuItems.find((item) => item.id === parentId);
    return parentItem ? parentItem.name : "Unknown";
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <LayoutList className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No menu items found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery || statusFilter || isMainMenuFilter
          ? "No menu items match your search criteria. Try different filters."
          : "Get started by adding your first menu item."}
      </p>
      {!(searchQuery || statusFilter || isMainMenuFilter) && (
        <Button asChild className="mt-4">
          <Link href="/admin/menu/add">
            <Plus className="mr-2 h-4 w-4" /> Add Menu Item
          </Link>
        </Button>
      )}
      {(searchQuery || statusFilter || isMainMenuFilter) && (
        <Button variant="outline" className="mt-4" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );

  const renderActiveFilters = () => {
    const hasFilters = searchQuery || statusFilter || isMainMenuFilter;

    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {searchQuery && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Search: {searchQuery}
            <button onClick={() => setSearchQuery("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {statusFilter && statusFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Status: {statusFilter}
            <button onClick={() => setStatusFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {isMainMenuFilter && isMainMenuFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Menu Type: {isMainMenuFilter === "true" ? "Main Menu" : "Sub Menu"}
            <button onClick={() => setIsMainMenuFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-7 text-xs"
        >
          Clear all
        </Button>
      </div>
    );
  };

  const renderTableView = () => (
    <div className="md:p-6 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell text-center">
              Order
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {menuItems.map((menuItem) => (
            <TableRow key={menuItem.id}>
              <TableCell className="font-medium">{menuItem.name}</TableCell>
              <TableCell>{menuItem.url}</TableCell>
              <TableCell>{getParentMenuName(menuItem.parentId)}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={menuItem.isMainMenu ? "default" : "secondary"}>
                  {menuItem.isMainMenu ? "Main Menu" : "Sub Menu"}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={menuItem.isActive ? "default" : "destructive"}>
                  {menuItem.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-center">
                {menuItem.order}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/menu/${menuItem.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(menuItem)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="w-full md:p-6 p-2">
        <PageHeader
          title="Menus"
          description="Manage your website menu items"
          actionLabel="Add Menu"
          actionHref="/admin/menu/add"
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search menu items..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-3"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-3 rounded-lg shadow-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                  sideOffset={8}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Filters</h4>
                      {(statusFilter || isMainMenuFilter) && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Status
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            setStatusFilter("all");
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            statusFilter === "all"
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter("active");
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
                            statusFilter === "active"
                              ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 text-green-600 dark:text-green-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Active
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter("inactive");
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
                            statusFilter === "inactive"
                              ? "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 text-red-600 dark:text-red-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          Inactive
                        </button>
                      </div>
                    </div>

                    {/* Menu Type Filter */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Menu Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            setIsMainMenuFilter("all");
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            isMainMenuFilter === "all"
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => {
                            setIsMainMenuFilter("true");
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            isMainMenuFilter === "true"
                              ? "bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 text-purple-600 dark:text-purple-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          Main Menu
                        </button>
                        <button
                          onClick={() => {
                            setIsMainMenuFilter("false");
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            isMainMenuFilter === "false"
                              ? "bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 text-orange-600 dark:text-orange-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          Sub Menu
                        </button>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message=" Loading Menus..." />
          ) : menuItems.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="mt-6">{renderTableView()}</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${menuItems.length} of ${totalItems} menu items`}
            </p>
          </div>

          <div className="flex-1 w-full md:w-auto">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
