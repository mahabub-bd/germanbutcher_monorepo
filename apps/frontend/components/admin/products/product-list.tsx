"use client";

import type React from "react";

import { revalidateProducts } from "@/actions/revalidate";
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
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import { deleteData, fetchData, fetchDataPagination } from "@/utils/api-utils";
import type { Brand, Category, Product } from "@/utils/types";
import {
  ArrowLeftRight,
  Ban,
  Boxes,
  CheckCircle,
  Eye,
  History,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { ProductImage } from "../image-wrapper";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface ProductListProps {
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

export function ProductList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/products";
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
  // Applied 400ms after typing stops — the input stays instant, the API call
  // doesn't fire per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(
    getInitialParam("search") as string
  );
  const [categoryFilter, setCategoryFilter] = useState(
    getInitialParam("category") as string
  );
  const [brandFilter, setBrandFilter] = useState(
    getInitialParam("brand") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("isActive") as string
  );
  const [featuredFilter, setFeaturedFilter] = useState(
    getInitialParam("featured") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  // Below md the filters live in a bottom sheet instead of the toolbar strip.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter && categoryFilter !== "all")
      params.set("category", categoryFilter);
    if (brandFilter && brandFilter !== "all") params.set("brand", brandFilter);
    if (statusFilter && statusFilter !== "all" && statusFilter !== "")
      params.set("isActive", statusFilter);
    if (featuredFilter && featuredFilter !== "all")
      params.set("featured", featuredFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    debouncedSearch,
    categoryFilter,
    brandFilter,
    statusFilter,
    featuredFilter,
  ]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (categoryFilter && categoryFilter !== "all")
        params.append("category", categoryFilter);
      if (brandFilter && brandFilter !== "all")
        params.append("brand", brandFilter);
      if (statusFilter && statusFilter !== "all" && statusFilter !== "")
        params.append("isActive", statusFilter);
      if (featuredFilter && featuredFilter !== "all")
        params.append("featured", featuredFilter);

      const response = await fetchDataPagination<{
        data: Product[];
        total: number;
        totalPages: number;
      }>(`products?${params.toString()}`);
      setProducts(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetchData<Brand[]>("brands");
      if (Array.isArray(response)) {
        setBrands(response);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetchData<Category[]>("categories");
      if (Array.isArray(response)) {
        setCategories(response);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter dropdown data loads once; products fetch on the applied filters.
  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  const isInitialMount = useRef(true);

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    limit,
    debouncedSearch,
    categoryFilter,
    brandFilter,
    statusFilter,
    featuredFilter,
  ]);

  // Sync the URL only for user-driven changes, not on first paint.
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

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await deleteData("products", selectedProduct.id);
      // Refresh cached product data on public pages immediately
      await revalidateProducts();
      fetchProducts();
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const { togglingId, toggleActive } = useActiveStatusToggle<Product>({
    getId: (product) => product.id,
    getName: (product) => product.name,
    buildEndpoint: (id) => `products/${id}`,
    // Keep cached product data on public pages in sync
    onSuccess: revalidateProducts,
    setStatusLocally: (id, isActive) =>
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive } : p))
      ),
    errorLabel: "product status",
  });

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setBrandFilter("");
    setStatusFilter("");
    setFeaturedFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasActiveFilters = () =>
    Boolean(
      searchQuery ||
      categoryFilter ||
      brandFilter ||
      statusFilter ||
      featuredFilter
    );

  const categoryName =
    categories.find((c) => c.id.toString() === categoryFilter)?.name ??
    categoryFilter;
  const brandName =
    brands.find((b) => b.id.toString() === brandFilter)?.name ?? brandFilter;

  const activeFilterSummary = [
    debouncedSearch && `Search: ${debouncedSearch}`,
    categoryFilter &&
    categoryFilter !== "all" &&
    `Category: ${categoryName}`,
    brandFilter && brandFilter !== "all" && `Brand: ${brandName}`,
    statusFilter &&
    statusFilter !== "all" &&
    `Status: ${statusFilter === "true" ? "Active" : "Inactive"}`,
    featuredFilter &&
    featuredFilter !== "all" &&
    (featuredFilter === "true" ? "Featured" : "Not featured"),
  ]
    .filter(Boolean)
    .join(" · ");

  // Count surfaced on the mobile Filters button so a closed sheet still shows
  // that the catalogue is narrowed.
  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(categoryFilter),
    Boolean(brandFilter),
    Boolean(statusFilter),
    Boolean(featuredFilter),
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
        key: "category",
        label: "Category",
        barClass: "md:w-36 md:shrink-0",
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
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "brand",
        label: "Brand",
        barClass: "md:w-36 md:shrink-0",
        node: (
          <Select
            value={brandFilter || "all"}
            onValueChange={(value) => {
              setBrandFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
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
        ),
      },
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
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "featured",
        label: "Featured",
        barClass: "md:w-36 md:shrink-0",
        node: (
          <Select
            value={featuredFilter || "all"}
            onValueChange={(value) => {
              setFeaturedFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="true">Featured</SelectItem>
              <SelectItem value="false">Not featured</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
    ];
  };

  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const firstRow = products.length === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderToggle = (product: Product, className?: string) => (
    <ActiveStatusToggle
      isActive={product.isActive}
      disabled={togglingId === product.id}
      onToggle={() => toggleActive(product)}
      label={product.name}
      className={className}
    />
  );

  const renderActions = (product: Product) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/products/${product.id}/view`}>
            <Eye className="size-4" /> View
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/products/${product.id}/stock-movements`}>
            <ArrowLeftRight className="size-4" /> Stock Movements
          </Link>
        </DropdownMenuItem>
        {can(MENU_URL, "canEdit") && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => handleDeleteClick(product)}
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
          title="Products"
          description="Catalogue, pricing and stock for every product in the store."
        >
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/products/stock-movements">
              <ArrowLeftRight className="size-3.5" />
              <span className="hidden sm:inline">Stock Movements</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/products/history">
              <History className="size-3.5" />
              <span className="hidden sm:inline">History</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchProducts}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" asChild>
              <Link href="/admin/products/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Product</span>
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
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={handleSearchChange}
              />

              <div className="shrink-0 md:hidden">
                <Sheet
                  open={filterSheetOpen}
                  onOpenChange={setFilterSheetOpen}
                >
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
                        Narrow the catalogue by category, brand, status and
                        featured.
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
                            ? `Show ${totalItems.toLocaleString("en-US")} products`
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
            <LoadingIndicator message="Loading products..." />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Package className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No products found</p>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters()
                  ? "No product matches these filters. Try another name, category or brand."
                  : "Create your first product to start selling it on the storefront."}
              </p>
            </div>
            {hasActiveFilters() ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : can(MENU_URL, "canCreate") ? (
              <Button size="sm" asChild>
                <Link href="/admin/products/add">
                  <Plus className="size-4" /> Add product
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Page totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <StatsCard
                icon={Package}
                title="Total products"
                value={totalItems.toLocaleString("en-US")}
                description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle}
                title="Active"
                value={activeCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="green"
              />
              <StatsCard
                icon={Ban}
                title="Inactive"
                value={inactiveCount.toLocaleString("en-US")}
                description="Hidden from the shop"
                bgColor="orange"
              />
              <StatsCard
                icon={Boxes}
                title="Out of stock"
                value={outOfStockCount.toLocaleString("en-US")}
                description="Needs restocking"
                bgColor="red"
              />
            </div>

            {/* Product panel */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor ring-1 ring-primaryColor/15">
                    <Package className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">All products</h3>
                    <p className="text-[13px] text-foreground/70">
                      Prices, stock and visibility for the catalogue.
                    </p>
                  </div>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {products.length.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")}
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table table-fixed">
                  <TableHeader className="[&_th]:font-semibold">
                    <TableRow className="hover:bg-transparent">
                      {/* Category is its own column from md; unit and brand
                          join as the row gets wider (lg / xl). Product gives
                          up a little width so both name columns stay legible.
                          On 2xl the four measure columns also gain width and
                          side padding so they don't read as one crowded block. */}
                      <TableHead className="pl-4 lg:w-64 2xl:w-96">
                        Product
                      </TableHead>
                      <TableHead className="w-24 lg:w-auto">
                        Category
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Brand
                      </TableHead>
                      <TableHead className="w-24 text-right 2xl:w-28 2xl:pr-4">
                        Price
                      </TableHead>
                      <TableHead className="w-20 text-right 2xl:w-24 2xl:pr-4">
                        Stock
                      </TableHead>
                      <TableHead className="hidden w-16 lg:table-cell 2xl:w-20">
                        Unit
                      </TableHead>
                      <TableHead className="w-28 2xl:w-32 2xl:pl-4">
                        Status
                      </TableHead>
                      <TableHead className="w-14 pr-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="py-2.5 pl-4">
                          <div className="flex min-w-0 items-center gap-2.5">
                            {/* Below lg the row gives up the thumbnail so the
                                category column has somewhere to sit. */}
                            <span className="hidden size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted lg:flex">
                              <ProductImage
                                product={product}
                                width={40}
                                height={40}
                              />
                            </span>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/products/${product.id}/view`}
                                title={product.name}
                                className="block truncate text-sm font-medium leading-tight hover:underline"
                              >
                                {product.name}
                              </Link>
                              <p
                                className="mt-0.5 truncate text-[13px] text-foreground/70 lg:hidden"
                                title={[product.productSku, product.brand?.name]
                                  .filter(Boolean)
                                  .join(" · ")}
                              >
                                <span className="font-mono">
                                  {product.productSku || "—"}
                                </span>
                                {` · ${product.brand?.name || "No brand"}`}
                              </p>
                              <p
                                className="mt-0.5 hidden truncate font-mono text-[13px] text-foreground/70 lg:block"
                                title={product.productSku || undefined}
                              >
                                {product.productSku || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="w-24 lg:w-auto">
                          <p
                            className="truncate text-sm"
                            title={product.category?.name || undefined}
                          >
                            {product.category?.name || "—"}
                          </p>
                        </TableCell>

                        <TableCell className="hidden xl:table-cell">
                          <p
                            className="truncate text-sm"
                            title={product.brand?.name || undefined}
                          >
                            {product.brand?.name || "—"}
                          </p>
                        </TableCell>

                        <TableCell className="text-right 2xl:pr-4">
                          <p className="truncate text-sm font-semibold tabular-nums">
                            {formatCurrencyEnglish(product?.sellingPrice)}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] tabular-nums text-foreground/70">
                            Cost {formatCurrencyEnglish(product?.purchasePrice)}
                          </p>
                        </TableCell>

                        <TableCell className="text-right 2xl:pr-4">
                          <p
                            className={cn(
                              "truncate text-sm font-semibold tabular-nums",
                              product.stock === 0 &&
                              "text-red-600 dark:text-red-400"
                            )}
                            // The unit column is desktop-only, so keep the
                            // pair readable on the narrow table via tooltip.
                            title={[product.stock, product.unit?.name]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {product.stock}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                            {product.saleCount} sold
                          </p>
                        </TableCell>

                        <TableCell className="hidden lg:table-cell">
                          <p
                            className="truncate text-sm"
                            title={product.unit?.name || undefined}
                          >
                            {product.unit?.name || "—"}
                          </p>
                        </TableCell>

                        <TableCell className="2xl:pl-4">
                          {renderToggle(product)}
                        </TableCell>

                        <TableCell className="pr-4 text-right">
                          {renderActions(product)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {products.map((product) => (
                  <article key={product.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                          <ProductImage
                            product={product}
                            width={40}
                            height={40}
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {product.name}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                            {product.productSku || "—"}
                          </p>
                        </div>
                      </div>
                      {renderActions(product)}
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/40 p-2.5">
                      <DetailField label="Price">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatCurrencyEnglish(product?.sellingPrice)}
                        </p>
                        <p className="text-[13px] tabular-nums text-foreground/70">
                          Cost {formatCurrencyEnglish(product?.purchasePrice)}
                        </p>
                      </DetailField>
                      <DetailField label="Stock">
                        <p
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            product.stock === 0 &&
                            "text-red-600 dark:text-red-400"
                          )}
                        >
                          {product.stock}
                          {product.unit?.name ? (
                            <span className="ml-1 text-[13px] font-normal text-foreground/70">
                              {product.unit.name}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[13px] text-foreground/70">
                          {product.saleCount} sold
                        </p>
                      </DetailField>
                      <DetailField label="Brand">
                        <p className="truncate text-sm">
                          {product.brand?.name || "No brand"}
                        </p>
                      </DetailField>
                      <DetailField label="Category">
                        <p className="truncate text-sm">
                          {product.category?.name || "No category"}
                        </p>
                      </DetailField>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-foreground/60">
                        Status
                      </span>
                      {renderToggle(product)}
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-[13px] text-foreground/70">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} product
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
