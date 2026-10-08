"use client";

import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
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
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import type { Category } from "@/utils/types";
import {
  Filter,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface CategoryListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function CategoryList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: CategoryListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/categories";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const { togglingId, toggleActive } = useActiveStatusToggle<Category>({
    getId: (category) => category.id,
    getName: (category) => category.name,
    buildEndpoint: (id) => `categories/${id}`,
    setStatusLocally: (id, isActive) =>
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive } : c))
      ),
    errorLabel: "category status",
  });

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, statusFilter]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("isActive", statusFilter);

      const response = await fetchDataPagination<{
        data: Category[];
        total: number;
        totalPages: number;
      }>(`categories?${params.toString()}`);
      setCategories(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories. Please try again.");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCategories();
    updateUrl();
  }, [currentPage, limit, searchQuery, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      await deleteData("categories", selectedCategory.id);
      fetchCategories();
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const renderEmptyState = () => (
    <div className="p-4 pb-6">
      <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 text-center">
        <LayoutGrid className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No categories found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          {searchQuery || statusFilter
            ? "No categories match your search criteria. Try different filters."
            : "Get started by adding your first category."}
        </p>
        {!(searchQuery || statusFilter) && can(MENU_URL, "canCreate") && (
          <Button asChild className="mt-4">
            <Link href="/admin/categories/add">
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Link>
          </Button>
        )}
        {(searchQuery || statusFilter) && (
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );

  const renderActiveFilters = () => {
    const hasFilters = searchQuery || statusFilter;

    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
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

  const renderStatusFilterButton = (
    value: string,
    label: string,
    activeClasses: string,
    dot?: string
  ) => (
    <button
      onClick={() => {
        setStatusFilter(value === "all" ? "" : value);
        setCurrentPage(1);
      }}
      className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
        (value === "all" ? "" : statusFilter) === value
          ? activeClasses
          : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
      }`}
    >
      {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
      {label}
    </button>
  );

  const renderFiltersMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-3 shrink-0">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {statusFilter && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
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
            {statusFilter && (
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
            <label className="text-xs text-muted-foreground">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {renderStatusFilterButton(
                "all",
                "All",
                "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
              )}
              {renderStatusFilterButton(
                "active",
                "Active",
                "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 text-green-600 dark:text-green-400",
                "bg-green-500"
              )}
              {renderStatusFilterButton(
                "inactive",
                "Inactive",
                "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 text-red-600 dark:text-red-400",
                "bg-red-500"
              )}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Parent</TableHead>
            <TableHead className="hidden md:table-cell text-center">
              Display Order
            </TableHead>
            <TableHead className="hidden md:table-cell text-center">
              Products
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-muted">
                    <Image
                      src={category?.attachment?.url || "/placeholder.svg"}
                      alt={category.name}
                      width={44}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">
                      {category.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[220px] mt-0.5">
                      {category.description || "No description"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {category.isMainCategory ? (
                  <Badge variant="default">Main Category</Badge>
                ) : (
                  <Badge variant="outline">Sub Category</Badge>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {category?.parent === null ? "None" : category?.parent?.name}
              </TableCell>
              <TableCell className="hidden md:table-cell text-center">
                {category.order}
              </TableCell>
              <TableCell className="hidden md:table-cell text-center">
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {category.products?.length || 0}
                </span>
              </TableCell>
              <TableCell>
                <ActiveStatusToggle
                  isActive={category.isActive}
                  disabled={togglingId === category.id}
                  onToggle={() => toggleActive(category)}
                  label={category.name}
                />
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
                    {can(MENU_URL, "canEdit") && (
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/categories/${category.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {can(MENU_URL, "canDelete") && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(category)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    )}
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
      <div className="w-full md:p-6 p-2 space-y-4">
        <PageHeader
          title="Categories"
          description="Manage your product categories"
          {...(can(MENU_URL, "canCreate")
            ? {
                actionLabel: "Add Category",
                actionHref: "/admin/categories/add",
              }
            : {})}
        />

        {/* List card: toolbar + table */}
        <div className="rounded-xl border bg-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Tags className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">
                  All Categories
                </h3>
                <p className="text-sm text-muted-foreground">
                  {totalItems} categor{totalItems === 1 ? "y" : "ies"}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search categories..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              {renderFiltersMenu()}
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Categories..." />
          ) : categories.length === 0 ? (
            renderEmptyState()
          ) : (
            renderTableView()
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${categories.length} of ${totalItems} categories`}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
