"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { PaginationComponent } from "@/components/common/pagination";
import { PillBadge } from "@/components/common/pill-badge";
import { TableSearch } from "@/components/common/table-search";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";
import { cn, formatDateTime } from "@/lib/utils";
import { deleteData, fetchData, fetchDataPagination } from "@/utils/api-utils";
import type { Category, Recipe } from "@/utils/types";
import {
  CheckCircle,
  FileEdit,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Utensils
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface RecipeListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

/** Labelled cell used by the mobile cards. */
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
      {children}
    </div>
  );
}

/** formatDateTime yields "31 Oct 2026, 10:30 AM" — split on the LAST comma so
 *  the day and the clock can sit on two lines inside a narrow column. */
const splitStamp = (value: string) => {
  const stamp = formatDateTime(value);
  const cut = stamp.lastIndexOf(", ");
  return cut === -1
    ? { day: stamp, clock: "" }
    : { day: stamp.slice(0, cut), clock: stamp.slice(cut + 2) };
};

/** Recipe details are rich text; the list only needs the plain sentence. */
const stripHtml = (html?: string) =>
  (html || "").replace(/<[^>]*>/g, "").trim();

export function RecipeList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: RecipeListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/recipe/recipe-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [recipes, setRecipes] = useState<Recipe[]>([]);
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
    getInitialParam("status") as string
  );
  const [categoryFilter, setCategoryFilter] = useState(
    getInitialParam("category") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  // Below md the filters live in a bottom sheet instead of the toolbar strip.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const { togglingId, toggleActive } = useActiveStatusToggle<Recipe>({
    getId: (recipe) => recipe.id,
    getName: (recipe) => recipe.title,
    getStatus: (recipe) => recipe.isPublished,
    buildEndpoint: (id) => `recipes/${id}`,
    buildBody: (isPublished) => ({ isPublished }),
    statusLabels: { on: "published", off: "draft" },
    setStatusLocally: (id, isPublished) =>
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isPublished } : r))
      ),
    errorLabel: "recipe status",
  });

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (categoryFilter && categoryFilter !== "all")
      params.set("category", categoryFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    debouncedSearch,
    statusFilter,
    categoryFilter,
  ]);

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (debouncedSearch) params.append("recipesearch", debouncedSearch);
      if (statusFilter && statusFilter !== "all")
        params.append(
          "isPublished",
          statusFilter === "published" ? "true" : "false"
        );
      if (categoryFilter && categoryFilter !== "all")
        params.append("categorySlug", categoryFilter);

      const response = await fetchDataPagination<{
        data: Recipe[];
        total: number;
        totalPages: number;
      }>(`recipes?${params.toString()}`);
      setRecipes(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast.error("Failed to load recipes. Please try again.");
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetchData<Category[]>(
        "categories?isMainCategory=true"
      );
      if (Array.isArray(response)) {
        setCategories(response);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter dropdown data loads once; recipes fetch on the applied filters.
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [currentPage, limit, debouncedSearch, statusFilter, categoryFilter]);

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

  const handleDeleteClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRecipe) return;

    try {
      await deleteData("recipes", selectedRecipe.id);
      fetchRecipes();
      toast.success("Recipe deleted successfully");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Failed to delete recipe. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCategoryFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasActiveFilters = () =>
    Boolean(searchQuery || statusFilter || categoryFilter);

  const publishedCount = recipes.filter((r) => r.isPublished).length;
  const draftCount = recipes.length - publishedCount;
  const firstRow = recipes.length === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const statusLabel =
    statusFilter === "published"
      ? "Published"
      : statusFilter === "draft"
        ? "Draft"
        : statusFilter;
  const categoryLabel =
    categories.find((c) => c.slug === categoryFilter)?.name || categoryFilter;

  const activeFilterSummary = [
    debouncedSearch && `Search: ${debouncedSearch}`,
    statusFilter && statusFilter !== "all" && `Status: ${statusLabel}`,
    categoryFilter && categoryFilter !== "all" && `Category: ${categoryLabel}`,
  ]
    .filter(Boolean)
    .join(" · ");

  // Count surfaced on the mobile Filters button so a closed sheet still shows
  // that the list is narrowed.
  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(statusFilter),
    Boolean(categoryFilter),
  ].filter(Boolean).length;

  // One source of truth for the filter controls: the toolbar renders them
  // inline at their fixed widths, the mobile sheet renders the same nodes full
  // width under a visible label.
  const renderFilterControls = (mode: "bar" | "sheet") => {
    const triggerClass =
      mode === "bar"
        ? "h-9 w-full"
        : "h-11 w-full px-3 text-sm font-medium";

    return [
      {
        key: "status",
        label: "Status",
        barClass: "md:w-32 md:shrink-0",
        node: (
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "category",
        label: "Category",
        barClass: "md:w-44 md:shrink-0",
        node: (
          <Select
            value={categoryFilter || "all"}
            onValueChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem
                  key={category.id}
                  value={category.slug || String(category.id)}
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
    ];
  };

  const renderToggle = (recipe: Recipe, className?: string) => (
    <ActiveStatusToggle
      isActive={recipe.isPublished}
      disabled={togglingId === recipe.id}
      onToggle={() => toggleActive(recipe)}
      label={recipe.title}
      labels={{ on: "Published", off: "Draft" }}
      className={className}
    />
  );

  const renderActions = (recipe: Recipe) => (
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
            <Link href={`/admin/recipe/${recipe.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => handleDeleteClick(recipe)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Recipes"
          description="Titles, categories and publish state for every recipe in the kitchen."
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchRecipes}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" asChild>
              <Link href="/admin/recipe/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Recipe</span>
              </Link>
            </Button>
          )}
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-3">
            {/* Search and the Filters button share one line on phones;
                md:contents hands both back to the toolbar row from md up. */}
            <div className="flex items-center gap-2 md:contents">
              <TableSearch
                wrapperClassName="w-full md:max-w-xs"
                className="h-9"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={handleSearchChange}
              />

              <div className="shrink-0 md:hidden">
                <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5">
                      <SlidersHorizontal className="size-3.5" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge className="size-4.5 rounded-full px-0 text-[0.65rem] font-semibold">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="max-h-[82dvh] gap-0 overflow-y-auto rounded-t-2xl"
                  >
                    <SheetHeader className="border-b pr-14">
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Narrow the list by category and publish state.
                      </SheetDescription>
                    </SheetHeader>

                    {renderFilterControls("sheet").map((control) => (
                      <div key={control.key} className="px-4 pt-4">
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {control.label}
                        </p>
                        {control.node}
                      </div>
                    ))}

                    <SheetFooter className="sticky bottom-0 mt-4 flex-row border-t bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          clearFilters();
                          setFilterSheetOpen(false);
                        }}
                      >
                        Clear all
                      </Button>
                      <SheetClose asChild>
                        <Button className="flex-1">
                          {totalItems > 0
                            ? `Show ${totalItems.toLocaleString("en-US")} recipes`
                            : "Done"}
                        </Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex md:flex-wrap">
              {renderFilterControls("bar").map((control) => (
                <div key={control.key} className={control.barClass}>
                  {control.node}
                </div>
              ))}
            </div>

            {hasActiveFilters() && (
              <div className="hidden min-w-0 items-center gap-2 md:flex md:ml-auto">
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
            <LoadingIndicator message="Loading recipes..." />
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Utensils className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No recipes found</p>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters()
                  ? "No recipe matches these filters. Try another name, category or status."
                  : "Create your first recipe to publish it on the storefront."}
              </p>
            </div>
            {hasActiveFilters() ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : can(MENU_URL, "canCreate") ? (
              <Button size="sm" asChild>
                <Link href="/admin/recipe/add">
                  <Plus className="size-4" /> Add recipe
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Page totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatsCard
                icon={Utensils}
                title="Total recipes"
                value={totalItems.toLocaleString("en-US")}
                description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle}
                title="Published"
                value={publishedCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="green"
              />
              <StatsCard
                icon={FileEdit}
                title="Drafts"
                value={draftCount.toLocaleString("en-US")}
                description="Not published yet"
                bgColor="orange"
              />
            </div>

            {/* Recipe panel */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor ring-1 ring-primaryColor/15">
                    <Utensils className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">All recipes</h3>
                    <p className="text-[13px] text-foreground/70">
                      Category, author and publish state for every recipe.
                    </p>
                  </div>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {recipes.length.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")}
                </PillBadge>
              </div>

              {/* Desktop table — equal columns, fixed layout, no min-width:
                  Recipe and Actions are pinned, the rest split the panel width
                  equally and every column is left-aligned, so the gutters read
                  identical. Created by only joins at xl, where the extra share
                  keeps the author names legible. */}
              <div className="hidden lg:block">
                <Table className="report-table table-fixed [&_td]:px-1.5 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-1.5 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
                  <TableHeader className="[&_th]:font-semibold">
                    <TableRow className="hover:bg-transparent">
                      {/* Identity column: pinned, and it gains width at xl and
                          again on 2xl so long recipe titles and excerpts are
                          not truncated. */}
                      <TableHead className="w-64 xl:w-72 2xl:w-96">
                        Recipe
                      </TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Created by
                      </TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      {/* Label is screen-reader only: at 56px the word
                          "Actions" overflows the cell. */}
                      <TableHead className="w-14 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipes.map((recipe) => {
                      const created = splitStamp(recipe.createdAt);
                      const excerpt = stripHtml(recipe.details);
                      return (
                        <TableRow key={recipe.id}>
                          <TableCell className="py-2.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="flex aspect-3/2 h-10 w-15 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                <Image
                                  src={
                                    recipe.attachment?.url ||
                                    "/placeholder.svg"
                                  }
                                  alt={recipe.title}
                                  width={60}
                                  height={40}
                                  className="h-full w-full object-cover"
                                />
                              </span>
                              <div className="min-w-0">
                                <Link
                                  href={`/admin/recipe/${recipe.id}/edit`}
                                  title={recipe.title}
                                  className="block truncate text-sm font-medium leading-tight hover:underline"
                                >
                                  {recipe.title}
                                </Link>
                                <p
                                  className="mt-0.5 truncate text-[13px] text-foreground/70"
                                  title={excerpt || undefined}
                                >
                                  {excerpt || "No description"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <p
                              className="truncate text-sm capitalize"
                              title={recipe.category?.name || undefined}
                            >
                              {recipe.category?.name || "Uncategorized"}
                            </p>
                          </TableCell>

                          <TableCell className="hidden xl:table-cell">
                            <p
                              className="truncate text-sm"
                              title={recipe.createdBy?.name || undefined}
                            >
                              {recipe.createdBy?.name || "Unknown"}
                            </p>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            <p
                              className="truncate text-sm tabular-nums"
                              title={formatDateTime(recipe.createdAt)}
                            >
                              {created.day}
                            </p>
                            {created.clock && (
                              <p className="truncate text-[13px] tabular-nums">
                                {created.clock}
                              </p>
                            )}
                          </TableCell>

                          <TableCell>{renderToggle(recipe)}</TableCell>

                          <TableCell className="text-right">
                            {renderActions(recipe)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y lg:hidden">
                {recipes.map((recipe) => {
                  const created = splitStamp(recipe.createdAt);
                  const excerpt = stripHtml(recipe.details);
                  return (
                    <article key={recipe.id} className="space-y-3 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex aspect-3/2 h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                            <Image
                              src={recipe.attachment?.url || "/placeholder.svg"}
                              alt={recipe.title}
                              width={64}
                              height={44}
                              className="h-full w-full object-cover"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {recipe.title}
                            </p>
                            <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                              {excerpt || "No description"}
                            </p>
                          </div>
                        </div>
                        {renderActions(recipe)}
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/40 p-2.5">
                        <DetailField label="Category">
                          <p className="truncate text-sm capitalize">
                            {recipe.category?.name || "Uncategorized"}
                          </p>
                        </DetailField>
                        <DetailField label="Created by">
                          <p className="truncate text-sm">
                            {recipe.createdBy?.name || "Unknown"}
                          </p>
                        </DetailField>
                        <DetailField label="Created">
                          <p className="truncate text-sm tabular-nums">
                            {created.day}
                          </p>
                          {created.clock && (
                            <p className="truncate text-[13px] tabular-nums text-foreground/70">
                              {created.clock}
                            </p>
                          )}
                        </DetailField>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-foreground/60">
                          Status
                        </span>
                        {renderToggle(recipe)}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-[13px] text-foreground/70">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} recipe
                  {totalItems === 1 ? "" : "s"}
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
