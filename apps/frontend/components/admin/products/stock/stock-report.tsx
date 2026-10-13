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
import { formatCurrencyEnglish } from "@/lib/utils";
import {
  fetchData,
  fetchDataPagination,
  fetchProtectedData,
} from "@/utils/api-utils";
import type { Brand, Category, Product, Supplier } from "@/utils/types";
import {
  BadgeDollarSign,
  Boxes,
  Filter,
  Package,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
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
      <DropdownMenuContent align="end" className="w-[400px]">
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
            <TableHead>Product</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="hidden md:table-cell">Brand</TableHead>
            <TableHead className="hidden lg:table-cell">Supplier</TableHead>
            <TableHead className="hidden md:table-cell text-center">
              Stock
            </TableHead>
            <TableHead className="text-right">Purchase Price</TableHead>
            <TableHead className="text-right">Sale Price</TableHead>
            <TableHead className="hidden lg:table-cell text-right">
              Total Value (Purchase)
            </TableHead>
            <TableHead className="hidden lg:table-cell text-right">
              Total Value (Sale)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex aspect-[3/2] h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    <ProductImage product={product} width={96} height={64} />
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
              <TableCell className="hidden md:table-cell">
                {product.category?.name || "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {product.brand?.name || "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {product.supplier?.name || "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell text-center">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    product.stock === 0
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-muted"
                  }`}
                >
                  <Boxes className="h-3 w-3" />
                  {product.stock}
                </span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                <span className="inline-flex items-center justify-end gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground/70" />
                  {formatCurrencyEnglish(product.purchasePrice)}
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">
                <span className="inline-flex items-center justify-end gap-1.5">
                  <BadgeDollarSign className="h-3.5 w-3.5 text-green-600/70 dark:text-green-400/70" />
                  {formatCurrencyEnglish(product.sellingPrice)}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                <span className="inline-flex items-center justify-end gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-muted-foreground/70" />
                  {formatCurrencyEnglish(
                    product.totalValueByPurchasePrice ||
                      product.stock * product.purchasePrice
                  )}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right font-medium">
                <span className="inline-flex items-center justify-end gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600/70 dark:text-green-400/70" />
                  {formatCurrencyEnglish(
                    product.totalValueBySalePrice ||
                      product.stock * product.sellingPrice
                  )}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="w-full p-2 md:p-6 space-y-4">
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
        <div className="rounded-xl border bg-card">
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
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
    </>
  );
}
