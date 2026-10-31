"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

import { PaginationComponent } from "@/components/common/pagination";
import { PillBadge } from "@/components/common/pill-badge";
import { TableSearch } from "@/components/common/table-search";
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import {
  fetchData,
  fetchDataPagination,
  fetchProtectedData,
  postData,
} from "@/utils/api-utils";
import type { Brand, Category, Product, Supplier } from "@/utils/types";
import {
  ArrowLeftRight,
  Banknote,
  Boxes,
  Loader2,
  Package,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "../../image-wrapper";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";

interface StockReportProps {
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

export function StockReport({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: StockReportProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
  const [supplierFilter, setSupplierFilter] = useState(
    getInitialParam("supplier") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  // Below md the filters live in a bottom sheet instead of the toolbar strip.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  // Stock adjustment dialog state
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustMode, setAdjustMode] = useState<"add" | "remove">("add");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const openAdjustDialog = (product: Product) => {
    setAdjustMode("add");
    setAdjustQty("");
    setAdjustNote("");
    setAdjustProduct(product);
  };

  const handleAdjustSubmit = async () => {
    if (!adjustProduct) return;

    const qty = parseInt(adjustQty, 10);
    if (!adjustQty || isNaN(qty) || qty <= 0) {
      toast.error("Please enter a quantity greater than 0.");
      return;
    }

    setIsAdjusting(true);
    try {
      const response = await postData<{
        statusCode: number;
        message: string;
      }>(`products/${adjustProduct.id}/stock-adjust`, {
        quantity: adjustMode === "remove" ? -qty : qty,
        note: adjustNote.trim() || undefined,
      });

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        toast.success(
          `Stock ${adjustMode === "remove" ? "reduced" : "added"} for ${adjustProduct.name}.`
        );
        setAdjustProduct(null);
        fetchProducts();
      } else {
        toast.error(response?.message || "Failed to adjust stock.");
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock.");
    } finally {
      setIsAdjusting(false);
    }
  };

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter && categoryFilter !== "all")
      params.set("category", categoryFilter);
    if (brandFilter && brandFilter !== "all") params.set("brand", brandFilter);
    if (supplierFilter && supplierFilter !== "all")
      params.set("supplier", supplierFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    debouncedSearch,
    categoryFilter,
    brandFilter,
    supplierFilter,
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
      if (supplierFilter && supplierFilter !== "all")
        params.append("supplier", supplierFilter);

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

  const fetchSuppliers = async () => {
    try {
      const response = await fetchProtectedData<Supplier[]>("suppliers");
      if (Array.isArray(response)) {
        setSuppliers(response);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
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
    fetchSuppliers();
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
    supplierFilter,
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

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setBrandFilter("");
    setSupplierFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasActiveFilters = () =>
    Boolean(searchQuery || categoryFilter || brandFilter || supplierFilter);

  // Count surfaced on the mobile Filters button so a closed sheet still shows
  // that the inventory is narrowed.
  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(categoryFilter),
    Boolean(brandFilter),
    Boolean(supplierFilter),
  ].filter(Boolean).length;

  const categoryLabel =
    categories.find((c) => c.id.toString() === categoryFilter)?.name ||
    categoryFilter;
  const brandLabel =
    brands.find((b) => b.id.toString() === brandFilter)?.name || brandFilter;
  const supplierLabel =
    suppliers.find((s) => s.id.toString() === supplierFilter)?.name ||
    supplierFilter;

  const activeFilterSummary = [
    debouncedSearch && `Search: ${debouncedSearch}`,
    categoryFilter && categoryFilter !== "all" && `Category: ${categoryLabel}`,
    brandFilter && brandFilter !== "all" && `Brand: ${brandLabel}`,
    supplierFilter &&
    supplierFilter !== "all" &&
    `Supplier: ${supplierLabel}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const stockValue = products.reduce(
    (sum, product) =>
      sum +
      (product.totalValueBySalePrice || product.stock * product.sellingPrice),
    0
  );
  const inStockCount = products.filter((p) => p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const firstRow = products.length === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderFilterSelect = (
    value: string,
    placeholder: string,
    allLabel: string,
    options: { id: number; name: string }[],
    onChange: (value: string) => void,
    triggerClass: string
  ) => (
    <Select
      value={value || "all"}
      onValueChange={(next) => {
        onChange(next === "all" ? "" : next);
        setCurrentPage(1);
      }}
    >
      <SelectTrigger className={triggerClass}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id.toString()}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

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
        node: renderFilterSelect(
          categoryFilter,
          "Category",
          "All categories",
          categories,
          setCategoryFilter,
          triggerClass
        ),
      },
      {
        key: "brand",
        label: "Brand",
        barClass: "md:w-36 md:shrink-0",
        node: renderFilterSelect(
          brandFilter,
          "Brand",
          "All brands",
          brands,
          setBrandFilter,
          triggerClass
        ),
      },
      {
        key: "supplier",
        label: "Supplier",
        barClass: "md:w-36 md:shrink-0",
        node: renderFilterSelect(
          supplierFilter,
          "Supplier",
          "All suppliers",
          suppliers,
          setSupplierFilter,
          triggerClass
        ),
      },
    ];
  };

  const renderTableView = () => (
    <>
      {/* Desktop table — eight columns need lg; below that the cards
          carry the same fields. Brand and supplier join at xl. */}
      <div className="hidden lg:block">
        <Table className="report-table table-fixed">
          <TableHeader className="[&_th]:font-semibold">
            <TableRow className="hover:bg-transparent">
              {/* Product takes the widest share and grows again on 2xl;
                  category and supplier split what is left. */}
              <TableHead className="w-80 pl-4 2xl:w-96">Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden xl:table-cell">Supplier</TableHead>
              <TableHead className="w-16 text-right">Stock</TableHead>
              <TableHead className="w-24 text-right">Price</TableHead>
              <TableHead className="w-28 text-right">Stock value</TableHead>
              <TableHead className="w-22 pr-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="py-2.5 pl-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                      <ProductImage product={product} width={40} height={40} />
                    </span>
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-medium leading-tight"
                        title={product.name}
                      >
                        {product.name}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[13px] text-foreground/70">
                        {product?.productSku || "—"}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
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
                    title={product.supplier?.name || undefined}
                  >
                    {product.supplier?.name || "—"}
                  </p>
                </TableCell>

                <TableCell className="text-right">
                  <p
                    className={cn(
                      "truncate text-sm font-semibold tabular-nums",
                      product.stock === 0 && "text-red-600 dark:text-red-400"
                    )}
                  >
                    {product.stock}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                    {product.unit?.name || "units"}
                  </p>
                </TableCell>

                <TableCell className="text-right">
                  <p className="truncate text-sm font-semibold tabular-nums">
                    {formatCurrencyEnglish(product.sellingPrice)}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] tabular-nums text-foreground/70">
                    Cost {formatCurrencyEnglish(product.purchasePrice)}
                  </p>
                </TableCell>

                <TableCell className="text-right">
                  <p className="truncate text-sm font-semibold tabular-nums">
                    {formatCurrencyEnglish(
                      product.totalValueBySalePrice ||
                      product.stock * product.sellingPrice
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] tabular-nums text-foreground/70">
                    Cost{" "}
                    {formatCurrencyEnglish(
                      product.totalValueByPurchasePrice ||
                      product.stock * product.purchasePrice
                    )}
                  </p>
                </TableCell>

                <TableCell className="pr-4 text-right">
                  <div className="inline-flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      title={`Adjust stock for ${product.name}`}
                      onClick={() => openAdjustDialog(product)}
                    >
                      <SlidersHorizontal className="size-3.5" />
                      <span className="sr-only">Adjust stock</span>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="size-8"
                      title={`Stock movements for ${product.name}`}
                    >
                      <Link href={`/admin/products/${product.id}/stock-movements`}>
                        <ArrowLeftRight className="size-3.5" />
                        <span className="sr-only">Stock movements</span>
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y lg:hidden">
        {products.map((product) => (
          <article key={product.id} className="space-y-3 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  <ProductImage product={product} width={40} height={40} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {product.name}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                    {product?.productSku || "—"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  title={`Adjust stock for ${product.name}`}
                  onClick={() => openAdjustDialog(product)}
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span className="sr-only">Adjust stock</span>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="size-8"
                  title={`Stock movements for ${product.name}`}
                >
                  <Link href={`/admin/products/${product.id}/stock-movements`}>
                    <ArrowLeftRight className="size-3.5" />
                    <span className="sr-only">Stock movements</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/40 p-2.5">
              <DetailField label="Category">
                <p className="truncate text-sm">
                  {product.category?.name || "—"}
                </p>
              </DetailField>
              <DetailField label="Supplier">
                <p className="truncate text-sm">
                  {product.supplier?.name || "—"}
                </p>
              </DetailField>
              <DetailField label="Stock">
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    product.stock === 0 && "text-red-600 dark:text-red-400"
                  )}
                >
                  {product.stock}
                  <span className="ml-1 text-[13px] font-normal text-foreground/70">
                    {product.unit?.name || "units"}
                  </span>
                </p>
              </DetailField>
              <DetailField label="Price">
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrencyEnglish(product.sellingPrice)}
                </p>
                <p className="text-[13px] tabular-nums text-foreground/70">
                  Cost {formatCurrencyEnglish(product.purchasePrice)}
                </p>
              </DetailField>
              <div className="col-span-2">
                <DetailField label="Stock value">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrencyEnglish(
                      product.totalValueBySalePrice ||
                      product.stock * product.sellingPrice
                    )}
                  </p>
                  <p className="text-[13px] tabular-nums text-foreground/70">
                    Cost{" "}
                    {formatCurrencyEnglish(
                      product.totalValueByPurchasePrice ||
                      product.stock * product.purchasePrice
                    )}
                  </p>
                </DetailField>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Inventory"
          description="Stock on hand and what it is worth, product by product."
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchProducts}
          >
            <RefreshCw
              className={isLoading ? "size-3.5 animate-spin" : "size-3.5"}
            />
            Refresh
          </Button>
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
                        Narrow inventory by category, brand and supplier.
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
            <LoadingIndicator message="Loading inventory..." />
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
                  ? "No product matches these filters. Try another name, category, brand or supplier."
                  : "Products appear here as soon as they are added to the catalogue."}
              </p>
            </div>
            {hasActiveFilters() && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
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
                icon={Boxes}
                title="In stock"
                value={inStockCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="green"
              />
              <StatsCard
                icon={XCircle}
                title="Out of stock"
                value={outOfStockCount.toLocaleString("en-US")}
                description="Needs restocking"
                bgColor="orange"
              />
              <StatsCard
                icon={Banknote}
                title="Stock value"
                value={formatCurrencyEnglish(stockValue)}
                description="Selling value on this page"
                bgColor="teal"
              />
            </div>

            {/* Inventory */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor ring-1 ring-primaryColor/15">
                    <Package className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">Inventory overview</h3>
                    <p className="text-[13px] text-foreground/70">
                      Quantity on hand, cost and the value each product holds.
                    </p>
                  </div>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {products.length.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")}
                </PillBadge>
              </div>

              {renderTableView()}

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

      {/* Stock adjustment dialog for a single product */}
      <Dialog
        open={!!adjustProduct}
        onOpenChange={(open) => !open && setAdjustProduct(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              Adjust Stock — {adjustProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Current stock:{" "}
              <span className="font-semibold text-foreground">
                {adjustProduct?.stock ?? 0}
              </span>
              . Manual corrections are recorded in the stock movement ledger as
              adjustments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add / Remove toggle */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={adjustMode === "add" ? "default" : "outline"}
                onClick={() => setAdjustMode("add")}
              >
                <PackagePlus className="mr-2 h-4 w-4" /> Add
              </Button>
              <Button
                type="button"
                variant={adjustMode === "remove" ? "default" : "outline"}
                onClick={() => setAdjustMode("remove")}
              >
                <PackageMinus className="mr-2 h-4 w-4" /> Remove
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Quantity *</label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Reason / Note
              </label>
              <Input
                type="text"
                placeholder="e.g. Damaged items, stock count correction"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
              />
            </div>

            {adjustQty && parseInt(adjustQty, 10) > 0 && (
              <p className="text-sm text-muted-foreground">
                New stock will be{" "}
                <span className="font-semibold text-foreground">
                  {adjustMode === "remove"
                    ? Math.max(
                      0,
                      (adjustProduct?.stock ?? 0) -
                      parseInt(adjustQty, 10)
                    )
                    : (adjustProduct?.stock ?? 0) + parseInt(adjustQty, 10)}
                </span>
                .
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustProduct(null)}
              disabled={isAdjusting}
            >
              Cancel
            </Button>
            <Button onClick={handleAdjustSubmit} disabled={isAdjusting}>
              {isAdjusting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Apply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
