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
import type { Brand } from "@/utils/types";
import {
  Ban,
  CheckCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
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

interface BrandListProps {
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

export function BrandList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: BrandListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/brand/brand-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [brands, setBrands] = useState<Brand[]>([]);
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
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter && statusFilter !== "all")
      params.set("isActive", statusFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, debouncedSearch, statusFilter]);

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all")
        params.append("isActive", statusFilter);

      const response = await fetchDataPagination<{
        data: Brand[];
        total: number;
        totalPages: number;
      }>(`brands?${params.toString()}`);
      setBrands(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands. Please try again.");
      setBrands([]);
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
    fetchBrands();
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

  const handleDeleteClick = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBrand) return;

    try {
      await deleteData("brands", selectedBrand.id);
      fetchBrands();
      toast.success("Brand deleted successfully");
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const { togglingId, toggleActive } = useActiveStatusToggle<Brand>({
    getId: (brand) => brand.id,
    getName: (brand) => brand.name,
    buildEndpoint: (id) => `brands/${id}`,
    setStatusLocally: (id, isActive) =>
      setBrands((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive } : b))
      ),
    errorLabel: "brand status",
  });

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

  const renderToggle = (brand: Brand, className?: string) => (
    <ActiveStatusToggle
      isActive={brand.isActive}
      disabled={togglingId === brand.id}
      onToggle={() => toggleActive(brand)}
      label={brand.name}
      className={className}
    />
  );

  const renderActions = (brand: Brand) => (
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
            <Link href={`/admin/brand/${brand.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => handleDeleteClick(brand)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const productCountOf = (brand: Brand) => brand.products?.length || 0;

  const activeCount = brands.filter((b) => b.isActive).length;
  const inactiveCount = brands.filter((b) => !b.isActive).length;
  const firstRow = brands.length === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Brands"
          description="Manufacturers and labels, grouped for the storefront filters."
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchBrands}
          >
            <RefreshCw
              className={isLoading ? "size-3.5 animate-spin" : "size-3.5"}
            />
            Refresh
          </Button>
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" asChild>
              <Link href="/admin/brand/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Brand</span>
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
              placeholder="Search brands..."
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
            <LoadingIndicator message="Loading brands..." />
          </div>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Tag className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No brands found</p>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters()
                  ? "No brand matches these filters. Try another name or status."
                  : "Add your first brand so products can be grouped by maker."}
              </p>
            </div>
            {hasActiveFilters() ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : can(MENU_URL, "canCreate") ? (
              <Button size="sm" asChild>
                <Link href="/admin/brand/add">
                  <Plus className="size-4" /> Add brand
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Page totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatsCard
                icon={Tag}
                title="Total brands"
                value={totalItems.toLocaleString("en-US")}
                description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
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

            {/* Brands */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/15 dark:text-amber-400">
                    <Tag className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">All brands</h3>
                    <p className="text-[13px] text-foreground/70">
                      Logos, descriptions and the products each brand carries.
                    </p>
                  </div>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {brands.length.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")}
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table table-fixed">
                  <TableHeader className="[&_th]:font-semibold">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-56 pl-4">Brand</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20 text-right">Products</TableHead>
                      <TableHead className="w-28">Status</TableHead>
                      <TableHead className="w-14 pr-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell className="py-2.5 pl-4">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                              <Image
                                src={brand?.attachment?.url || "/placeholder.svg"}
                                alt={brand.name}
                                width={40}
                                height={40}
                                className="size-full object-contain p-0.5"
                              />
                            </span>
                            <div className="min-w-0">
                              <p
                                className="truncate text-sm font-medium leading-tight"
                                title={brand.name}
                              >
                                {brand.name}
                              </p>
                              <p className="mt-0.5 truncate font-mono text-[13px] text-foreground/70">
                                {brand.slug ? `/${brand.slug}` : "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="max-w-xs">
                          <p
                            className="line-clamp-2 text-[13px] text-foreground/70"
                            title={brand.description || undefined}
                          >
                            {brand.description || "No description"}
                          </p>
                        </TableCell>

                        <TableCell className="text-right">
                          <p
                            className="truncate text-sm font-semibold tabular-nums"
                            title={`${productCountOf(brand)} products`}
                          >
                            {productCountOf(brand)}
                          </p>
                        </TableCell>

                        <TableCell>{renderToggle(brand)}</TableCell>

                        <TableCell className="pr-4 text-right">
                          {renderActions(brand)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {brands.map((brand) => (
                  <article key={brand.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                          <Image
                            src={brand?.attachment?.url || "/placeholder.svg"}
                            alt={brand.name}
                            width={40}
                            height={40}
                            className="size-full object-contain p-0.5"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {brand.name}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                            {productCountOf(brand)} product
                            {productCountOf(brand) === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      {renderActions(brand)}
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <DetailField label="Description">
                        <p className="line-clamp-2 text-[13px] text-foreground/80">
                          {brand.description || "No description"}
                        </p>
                      </DetailField>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-foreground/60">
                        Status
                      </span>
                      {renderToggle(brand)}
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-[13px] text-foreground/70">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} brand
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
