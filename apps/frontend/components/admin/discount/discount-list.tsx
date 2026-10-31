"use client";

import type React from "react";

import { revalidateProducts } from "@/actions/revalidate";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
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
import { cn, formatDateTime } from "@/lib/utils";
import { fetchDataPagination, patchData } from "@/utils/api-utils";
import {
  DiscountType,
  type Brand,
  type Category,
  type Product,
} from "@/utils/types";
import {
  BadgePercent,
  CalendarRange,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { ProductImage } from "../image-wrapper";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface DiscountListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

/** Grouped amount, up to 2 decimals — the ৳ mark lives in the header note. */
const bare = (value: number | string) =>
  Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

type DiscountStatus = "active" | "upcoming" | "expired";

const STATUS_TONE = {
  active: "emerald",
  upcoming: "blue",
  expired: "red",
} as const;

const STATUS_LABEL: Record<DiscountStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  expired: "Expired",
};

export function DiscountList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: DiscountListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/marketing/discounts/discount-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [categoryFilter, setCategoryFilter] = useState(
    getInitialParam("category") as string
  );
  const [brandFilter, setBrandFilter] = useState(
    getInitialParam("brand") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [discountTypeFilter, setDiscountTypeFilter] = useState(
    getInitialParam("discountType") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const hasFilters = Boolean(
    searchQuery ||
    categoryFilter ||
    brandFilter ||
    statusFilter ||
    discountTypeFilter
  );

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (categoryFilter && categoryFilter !== "all")
      params.set("category", categoryFilter);
    if (brandFilter && brandFilter !== "all") params.set("brand", brandFilter);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (discountTypeFilter && discountTypeFilter !== "all")
      params.set("discountType", discountTypeFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    searchQuery,
    categoryFilter,
    brandFilter,
    statusFilter,
    discountTypeFilter,
  ]);

  const fetchDiscountedProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      params.append("hasDiscount", "true");

      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter && categoryFilter !== "all")
        params.append("category", categoryFilter);
      if (brandFilter && brandFilter !== "all")
        params.append("brand", brandFilter);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);
      if (discountTypeFilter && discountTypeFilter !== "all")
        params.append("discountType", discountTypeFilter);

      const response = await fetchDataPagination<{
        data: Product[];
        total: number;
        totalPages: number;
      }>(`products?${params.toString()}`);
      setProducts(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching discounted products:", error);
      toast.error("Failed to load discounted products. Please try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    limit,
    searchQuery,
    categoryFilter,
    brandFilter,
    statusFilter,
    discountTypeFilter,
  ]);

  useEffect(() => {
    fetchDiscountedProducts();
  }, [fetchDiscountedProducts]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // Filter option lists — fetched once, they do not depend on the table state.
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [brandResponse, categoryResponse] = await Promise.all([
          fetchDataPagination<{ data: Brand[] }>("brands"),
          fetchDataPagination<{ data: Category[] }>("categories"),
        ]);
        if (Array.isArray(brandResponse.data)) setBrands(brandResponse.data);
        if (Array.isArray(categoryResponse.data))
          setCategories(categoryResponse.data);
      } catch (error) {
        console.error("Error fetching filter options:", error);
        toast.error("Failed to load brands and categories");
      }
    };

    fetchOptions();
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleRemoveDiscount = async () => {
    if (!selectedProduct) return;

    try {
      await patchData(`products/${selectedProduct.id}`, {
        discountType: null,
        discountValue: null,
        discountStartDate: null,
        discountEndDate: null,
      });
      // Refresh cached product data on public pages immediately
      await revalidateProducts();
      fetchDiscountedProducts();
      toast.success("Discount removed successfully");
    } catch (error) {
      console.error("Error removing discount:", error);
      toast.error("Failed to remove discount. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setBrandFilter("");
    setStatusFilter("");
    setDiscountTypeFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const getDiscountStatus = (product: Product): DiscountStatus => {
    if (!product.discountStartDate || !product.discountEndDate) return "active";

    const now = new Date();
    const startDate = new Date(product.discountStartDate);
    const endDate = new Date(product.discountEndDate);

    if (now > endDate) return "expired";
    if (now < startDate) return "upcoming";
    return "active";
  };

  const calculateDiscountedPrice = (product: Product) => {
    if (!product.discountType || !product.discountValue)
      return product.sellingPrice;

    if (product.discountType === DiscountType.PERCENTAGE) {
      return product.sellingPrice * (1 - product.discountValue / 100);
    }
    return Math.max(0, product.sellingPrice - product.discountValue);
  };

  const discountLabel = (product: Product) => {
    if (!product.discountType || !product.discountValue) return "—";
    return product.discountType === DiscountType.PERCENTAGE
      ? `${Number.parseFloat(String(product.discountValue))}%`
      : `৳${bare(product.discountValue)}`;
  };

  const categoryName = (value: string) =>
    categories.find((c) => c.id.toString() === value)?.name || value;
  const brandName = (value: string) =>
    brands.find((b) => b.id.toString() === value)?.name || value;

  const activeCount = products.filter(
    (p) => getDiscountStatus(p) === "active"
  ).length;
  const upcomingCount = products.filter(
    (p) => getDiscountStatus(p) === "upcoming"
  ).length;
  const expiredCount = products.filter(
    (p) => getDiscountStatus(p) === "expired"
  ).length;

  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (product: Product) => (
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
            <Link href={`/admin/products/${product.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(product)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Remove Discount
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Product Discounts"
          description="Every product currently carrying a discount, with its price, period and status."
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchDiscountedProducts}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" asChild>
              <Link href="/admin/marketing/discounts/add">
                <Plus className="size-4" /> Create Discount
              </Link>
            </Button>
          )}
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 xl:flex-row xl:flex-nowrap xl:items-center xl:gap-3">
            <TableSearch
              wrapperClassName="w-full xl:max-w-xs"
              className="h-9"
              placeholder="Search discounted products..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:flex xl:items-center xl:gap-3">
              <div className="xl:w-32 xl:shrink-0">
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
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="xl:w-32 xl:shrink-0">
                <Select
                  value={discountTypeFilter || "all"}
                  onValueChange={(value) => {
                    setDiscountTypeFilter(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="xl:w-40 xl:shrink-0">
                <Select
                  value={categoryFilter || "all"}
                  onValueChange={(value) => {
                    setCategoryFilter(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="xl:w-36 xl:shrink-0">
                <Select
                  value={brandFilter || "all"}
                  onValueChange={(value) => {
                    setBrandFilter(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasFilters && (
              <div className="flex items-center gap-2 xl:ml-auto">
                <PillBadge className="font-medium">
                  {[
                    searchQuery && `Search: ${searchQuery}`,
                    statusFilter &&
                    statusFilter !== "all" &&
                    `Status: ${STATUS_LABEL[statusFilter as DiscountStatus] ??
                    statusFilter
                    }`,
                    discountTypeFilter &&
                    discountTypeFilter !== "all" &&
                    `Type: ${discountTypeFilter === "percentage"
                      ? "Percentage"
                      : "Fixed amount"
                    }`,
                    categoryFilter &&
                    categoryFilter !== "all" &&
                    `Category: ${categoryName(categoryFilter)}`,
                    brandFilter &&
                    brandFilter !== "all" &&
                    `Brand: ${brandName(brandFilter)}`,
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
            <LoadingIndicator message="Loading discounted products..." />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Tag className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No discounted products found</p>
              <p className="text-xs text-muted-foreground">
                {hasFilters
                  ? "No discounted products match these filters. Try a different name or status."
                  : "Get started by adding a discount to a product."}
              </p>
            </div>
            {hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              can(MENU_URL, "canCreate") && (
                <Button size="sm" asChild>
                  <Link href="/admin/marketing/discounts/add">
                    <Plus className="size-4" /> Create Discount
                  </Link>
                </Button>
              )
            )}
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <StatsCard
                icon={Tag}
                title="Discounted products"
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
                icon={CalendarRange}
                title="Upcoming"
                value={upcomingCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="violet"
              />
              <StatsCard
                icon={XCircle}
                title="Expired"
                value={expiredCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="red"
              />
            </div>

            {/* Discounted products */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Discounted products</h3>
                  <p className="text-xs text-muted-foreground">
                    Amounts in ৳ · {limit} per page
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {totalItems.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {/* Desktop table — equal columns, fixed layout, no min-width:
                  Product and Actions are pinned, the rest split the panel width
                  equally and every column is left-aligned, so the gutters read
                  identical: a right-aligned price would end flush against the
                  next column's boundary and close its gap. Six columns need lg
                  before each share is wide enough; below that the cards run. */}
              <div className="hidden lg:block">
                <Table className="report-table table-fixed [&_td]:px-1.5 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-1.5 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
                  <TableHeader className="[&_th]:font-semibold">
                    <TableRow className="hover:bg-transparent">
                      {/* Identity column: pinned, and it gains width at xl and
                          again on 2xl so long product names and SKUs are not
                          truncated. */}
                      <TableHead className="w-56 xl:w-72 2xl:w-96">
                        Product
                      </TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      {/* Label is screen-reader only: at 56px the word
                          "Actions" overflows the cell. */}
                      <TableHead className="w-14 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const status = getDiscountStatus(product);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="py-2.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex aspect-3/2 h-12 w-18 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                <ProductImage
                                  product={product}
                                  width={96}
                                  height={64}
                                  className="h-full w-full object-cover"
                                />
                              </span>
                              <div className="min-w-0">
                                <Link
                                  href={`/admin/products/${product.id}/edit`}
                                  className="block truncate font-medium leading-tight hover:text-primaryColor hover:underline"
                                  title={product.name}
                                >
                                  {product.name}
                                </Link>
                                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                                  {product.productSku}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <PillBadge
                              tone={
                                product.discountType === DiscountType.PERCENTAGE
                                  ? "emerald"
                                  : "blue"
                              }
                              className="gap-1 font-mono"
                            >
                              {product.discountType ===
                                DiscountType.PERCENTAGE && (
                                  <BadgePercent className="h-3 w-3" />
                                )}
                              {discountLabel(product)}
                            </PillBadge>
                          </TableCell>

                          <TableCell>
                            <p
                              className="truncate text-sm font-semibold tabular-nums"
                              title={bare(calculateDiscountedPrice(product))}
                            >
                              {bare(calculateDiscountedPrice(product))}
                            </p>
                            <p
                              className="truncate text-[11px] tabular-nums text-muted-foreground line-through"
                              title={bare(product.sellingPrice)}
                            >
                              {bare(product.sellingPrice)}
                            </p>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {product.discountStartDate &&
                              product.discountEndDate ? (
                              <>
                                <p
                                  className="truncate text-xs tabular-nums"
                                  title={formatDateTime(
                                    product.discountStartDate
                                  )}
                                >
                                  {formatDateTime(product.discountStartDate)}
                                </p>
                                <p
                                  className="truncate text-[11px] tabular-nums"
                                  title={formatDateTime(product.discountEndDate)}
                                >
                                  → {formatDateTime(product.discountEndDate)}
                                </p>
                              </>
                            ) : (
                              <span className="text-xs">No period set</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <PillBadge tone={STATUS_TONE[status]}>
                              {STATUS_LABEL[status]}
                            </PillBadge>
                          </TableCell>

                          <TableCell className="text-right">
                            {renderActions(product)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y lg:hidden">
                {products.map((product) => {
                  const status = getDiscountStatus(product);
                  return (
                    <article key={product.id} className="space-y-3 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="flex min-w-0 items-center gap-2.5 hover:text-primaryColor"
                        >
                          <span className="flex aspect-3/2 h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                            <ProductImage
                              product={product}
                              width={96}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {product.name}
                            </p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                              {product.productSku}
                            </p>
                          </div>
                        </Link>
                        <div className="flex shrink-0 items-center gap-1">
                          <PillBadge tone={STATUS_TONE[status]}>
                            {STATUS_LABEL[status]}
                          </PillBadge>
                          {renderActions(product)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Discount
                          </p>
                          <p className="text-sm font-semibold">
                            {discountLabel(product)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Price
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            ৳{bare(calculateDiscountedPrice(product))}
                            <span className="ml-1 text-[11px] font-normal text-muted-foreground line-through">
                              ৳{bare(product.sellingPrice)}
                            </span>
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Period
                          </p>
                          <p className="text-xs">
                            {product.discountStartDate &&
                              product.discountEndDate
                              ? `${formatDateTime(
                                product.discountStartDate
                              )} → ${formatDateTime(
                                product.discountEndDate
                              )}`
                              : "No period set"}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Footer: what the list covers */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-xs text-muted-foreground">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} discounted product
                  {totalItems === 1 ? "" : "s"}
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
        onConfirm={handleRemoveDiscount}
      />
    </>
  );
}
