"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { PaginationComponent } from "@/components/common/pagination";
import { PillBadge } from "@/components/common/pill-badge";
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
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { Category } from "@/utils/types";
import {
  Ban,
  CheckCircle,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Tags,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface CategoryListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

/** Label + value block reused by the mobile cards. */
function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-foreground/60">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
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
  // Applied 400ms after typing stops — the input stays instant, the API call
  // doesn't fire per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("isActive") as string
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

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter && statusFilter !== "all")
      params.set("isActive", statusFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, debouncedSearch, statusFilter]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (debouncedSearch) params.append("search", debouncedSearch);
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

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [currentPage, limit, debouncedSearch, statusFilter]);

  // Sync the URL only for user-driven changes, not on first paint.
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateUrl();
  }, [updateUrl]);

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

  const hasActiveFilters = () => Boolean(searchQuery || statusFilter);

  const activeFilterSummary = [
    debouncedSearch && `Search: ${debouncedSearch}`,
    statusFilter &&
      statusFilter !== "all" &&
      `Status: ${statusFilter === "true" ? "Active" : "Inactive"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const renderToggle = (category: Category, className?: string) => (
    <ActiveStatusToggle
      isActive={category.isActive}
      disabled={togglingId === category.id}
      onToggle={() => toggleActive(category)}
      label={category.name}
      className={className}
    />
  );

  const renderActions = (category: Category) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {can(MENU_URL, "canEdit") && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/categories/${category.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => handleDeleteClick(category)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const productCountOf = (category: Category) => category.products?.length || 0;

  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.filter((c) => !c.isActive).length;
  const mainCount = categories.filter((c) => c.isMainCategory).length;
  const subCount = categories.length - mainCount;
  const firstRow =
    categories.length === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Categories"
          description="Departments and sub-categories that organise the catalogue."
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchCategories}
          >
            <RefreshCw className={isLoading ? "size-3.5 animate-spin" : "size-3.5"} />
            Refresh
          </Button>
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" asChild>
              <Link href="/admin/categories/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Category</span>
              </Link>
            </Button>
          )}
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-nowrap md:items-center md:gap-3">
            <TableSearch
              wrapperClassName="w-full md:max-w-xs"
              className="h-9"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="md:w-40 md:shrink-0">
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
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters() && (
              <div className="flex min-w-0 items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium" title={activeFilterSummary}>
                  <span className="truncate">{activeFilterSummary}</span>
                </PillBadge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 shrink-0 text-muted-foreground"
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
            <LoadingIndicator message="Loading categories..." />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <LayoutGrid className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No categories found</p>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters()
                  ? "No category matches these filters. Try another name or status."
                  : "Add your first category so products can be grouped."}
              </p>
            </div>
            {hasActiveFilters() ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : can(MENU_URL, "canCreate") ? (
              <Button size="sm" asChild>
                <Link href="/admin/categories/add">
                  <Plus className="size-4" /> Add category
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Page totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatsCard
                icon={Tags}
                title="Total categories"
                value={totalItems.toLocaleString("en-US")}
                description={`${mainCount} main · ${subCount} sub on this page`}
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle}
                title="Active"
                value={activeCount.toLocaleString("en-US")}
                description="Visible in the shop"
                bgColor="green"
              />
              <StatsCard
                icon={Ban}
                title="Inactive"
                value={inactiveCount.toLocaleString("en-US")}
                description="Hidden from the shop"
                bgColor="orange"
              />
            </div>

            {/* Categories */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/15 dark:text-rose-400">
                    <Tags className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">All categories</h3>
                    <p className="text-[13px] text-foreground/70">
                      Departments, their parents and how many products each one
                      holds.
                    </p>
                  </div>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {categories.length.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")}
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table table-fixed">
                  <TableHeader className="[&_th]:font-semibold">
                    <TableRow className="hover:bg-transparent">
                      {/* Category is pinned from lg so the remaining columns
                          split what's left evenly instead of piling all the
                          slack into the name column. */}
                      <TableHead className="pl-4 lg:w-72 2xl:w-96">
                        Category
                      </TableHead>
                      <TableHead className="w-20 lg:w-auto">Type</TableHead>
                      {/* Parent joins at lg: below that the category name
                          needs the width. */}
                      <TableHead className="hidden lg:table-cell">
                        Parent
                      </TableHead>
                      {/* Left-aligned like its neighbours: in an equal-width
                          grid a right-aligned count would hug the Status column
                          and strand a void after Parent. "Products" is the
                          longest label in the row, so the column keeps a 96px
                          floor below lg and Status indents above it. */}
                      <TableHead className="w-24 lg:w-auto">
                        Products
                      </TableHead>
                      <TableHead className="w-28 lg:w-auto lg:pl-4">
                        Status
                      </TableHead>
                      <TableHead className="w-14 pr-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="py-2.5 pl-4">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                              <Image
                                src={
                                  category?.attachment?.url || "/placeholder.svg"
                                }
                                alt={category.name}
                                width={40}
                                height={40}
                                className="size-full object-contain p-0.5"
                              />
                            </span>
                            <div className="min-w-0">
                              <p
                                className="truncate text-sm font-medium leading-tight"
                                title={category.name}
                              >
                                {category.name}
                              </p>
                              <p
                                className="mt-0.5 truncate text-[13px] text-foreground/70"
                                title={category.description || undefined}
                              >
                                {category.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <PillBadge
                            tone={category.isMainCategory ? "blue" : "neutral"}
                          >
                            {category.isMainCategory ? "Main" : "Sub"}
                          </PillBadge>
                        </TableCell>

                        <TableCell className="hidden lg:table-cell">
                          <p
                            className="truncate text-sm"
                            title={category.parent?.name || undefined}
                          >
                            {category.parent?.name || "—"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p
                            className="truncate text-sm font-semibold tabular-nums"
                            title={`${productCountOf(category)} products`}
                          >
                            {productCountOf(category)}
                          </p>
                        </TableCell>

                        <TableCell className="lg:pl-4">
                          {renderToggle(category)}
                        </TableCell>

                        <TableCell className="pr-4 text-right">
                          {renderActions(category)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {categories.map((category) => (
                  <article key={category.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                          <Image
                            src={category?.attachment?.url || "/placeholder.svg"}
                            alt={category.name}
                            width={40}
                            height={40}
                            className="size-full object-contain p-0.5"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {category.name}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                            {category.isMainCategory ? "Main category" : "Sub category"}
                          </p>
                        </div>
                      </div>
                      {renderActions(category)}
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/40 p-2.5">
                      <DetailField label="Parent">
                        <p className="truncate text-sm">
                          {category.parent?.name || "—"}
                        </p>
                      </DetailField>
                      <DetailField label="Products">
                        <p className="truncate text-sm font-semibold tabular-nums">
                          {productCountOf(category)}
                        </p>
                      </DetailField>
                      <div className="col-span-2">
                        <DetailField label="Description">
                          <p className="line-clamp-2 text-[13px] text-foreground/80">
                            {category.description || "No description"}
                          </p>
                        </DetailField>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-foreground/60">
                        Status
                      </span>
                      {renderToggle(category)}
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-[13px] text-foreground/70">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} categor
                  {totalItems === 1 ? "y" : "ies"}
                  {debouncedSearch && ` matching “${debouncedSearch}”`}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
