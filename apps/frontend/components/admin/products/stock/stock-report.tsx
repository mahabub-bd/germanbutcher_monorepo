"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PaginationComponent } from "@/components/common/pagination";
import StockMovementHistory from "@/components/admin/products/stock-movement-history";
import { formatCurrencyEnglish } from "@/lib/utils";
import {
  fetchData,
  fetchDataPagination,
  fetchProtectedData,
  postData,
} from "@/utils/api-utils";
import type { Brand, Category, Product, Supplier } from "@/utils/types";
import {
  ArrowLeftRight,
  Boxes,
  Filter,
  Loader2,
  Package,
  PackageMinus,
  PackagePlus,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
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
  // Product whose stock movements are shown in the dialog
  const [movementsProduct, setMovementsProduct] = useState<Product | null>(
    null
  );
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

  const renderEmptyState = () => (
    <div className="p-4 pb-6">
      <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 text-center">
        <Package className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No products found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          {hasActiveFilters()
            ? "No products match your search criteria. Try different filters."
            : "No products available in stock."}
        </p>
        {hasActiveFilters() && (
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );

  const renderActiveFilters = () => {
    if (!hasActiveFilters()) return null;

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

        {categoryFilter && categoryFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Category:{" "}
            {categories.find((c) => c.id.toString() === categoryFilter)?.name ||
              categoryFilter}
            <button onClick={() => setCategoryFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {brandFilter && brandFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Brand:{" "}
            {brands.find((b) => b.id.toString() === brandFilter)?.name ||
              brandFilter}
            <button onClick={() => setBrandFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {supplierFilter && supplierFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Supplier:{" "}
            {suppliers.find((s) => s.id.toString() === supplierFilter)?.name ||
              supplierFilter}
            <button onClick={() => setSupplierFilter("")} className="ml-1">
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

  const renderFiltersMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-3 shrink-0">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {(categoryFilter || brandFilter || supplierFilter) && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-100">
        <div className="grid grid-cols-2 gap-3 p-3">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Category</h4>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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

          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Brand</h4>
            <Select
              value={brandFilter}
              onValueChange={(value) => {
                setBrandFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Supplier</h4>
            <Select
              value={supplierFilter}
              onValueChange={(value) => {
                setSupplierFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem
                    key={supplier.id}
                    value={supplier.id.toString()}
                  >
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(categoryFilter || brandFilter || supplierFilter) && (
            <div className="col-span-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full mt-2"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-full max-w-0">Product</TableHead>
            <TableHead className="hidden xl:table-cell">Category</TableHead>
            <TableHead className="hidden xl:table-cell">Brand</TableHead>
            <TableHead className="hidden 2xl:table-cell">Supplier</TableHead>
            <TableHead className="hidden md:table-cell text-center">
              Stock
            </TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="hidden lg:table-cell text-right">
              Stock Value
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-muted/50">
              <TableCell className="w-full max-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex aspect-3/2 h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    <ProductImage product={product} width={64} height={48} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {product?.productSku || "—"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden whitespace-nowrap md:table-cell">
                {product.category?.name || "—"}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap xl:table-cell">
                {product.brand?.name || "—"}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap 2xl:table-cell">
                {product.supplier?.name || "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell text-center">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${product.stock === 0
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-muted"
                    }`}
                >
                  <Boxes className="h-3 w-3" />
                  {product.stock}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-medium">
                  {formatCurrencyEnglish(product.sellingPrice)}
                </span>
                <p className="text-xs text-muted-foreground">
                  Cost: {formatCurrencyEnglish(product.purchasePrice)}
                </p>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right">
                <span className="font-medium">
                  {formatCurrencyEnglish(
                    product.totalValueBySalePrice ||
                    product.stock * product.sellingPrice
                  )}
                </span>
                <p className="text-xs text-muted-foreground">
                  Cost:{" "}
                  {formatCurrencyEnglish(
                    product.totalValueByPurchasePrice ||
                    product.stock * product.purchasePrice
                  )}
                </p>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openAdjustDialog(product)}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span className="hidden 2xl:inline">Adjust</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setMovementsProduct(product)}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    <span className="hidden 2xl:inline">Stock Movements</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="w-full space-y-4">
        <PageHeader
          title="Inventory"
          description="Comprehensive view of inventory and stock values"
        />

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatsCard
            icon={Package}
            title="Total Products"
            value={totalItems}
            bgColor="blue"
          />
          <StatsCard
            icon={Boxes}
            title="In Stock"
            value={products.filter((p) => p.stock > 0).length}
            bgColor="green"
          />
          <StatsCard
            icon={XCircle}
            title="Out of Stock"
            value={products.filter((p) => p.stock === 0).length}
            bgColor="orange"
          />
        </div>

        {/* List card: toolbar + table */}
        <div className="rounded-sm border bg-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Package className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">
                  Inventory Overview
                </h3>
                <p className="text-sm text-muted-foreground">
                  {totalItems} product{totalItems === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-64 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="h-8 pl-9"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              {renderFiltersMenu()}
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Stock Report..." />
          ) : products.length === 0 ? (
            renderEmptyState()
          ) : (
            renderTableView()
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${products.length} of ${totalItems} products`}
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

      {/* Stock movements dialog for a single product */}
      <Dialog
        open={!!movementsProduct}
        onOpenChange={(open) => !open && setMovementsProduct(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="size-4 text-primary" />
              Stock Movements — {movementsProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Every stock change for this product: purchases in, sales out,
              reversals and cancelled-order restocks.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto -mx-1 px-1">
            {movementsProduct && (
              <StockMovementHistory productId={movementsProduct.id} />
            )}
          </div>
        </DialogContent>
      </Dialog>
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
