"use client";

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
import { Filter, Package, Search, XCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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

    if (searchQuery) params.set("search", searchQuery);
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
    searchQuery,
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

      if (searchQuery) params.append("search", searchQuery);
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

  useEffect(() => {
    fetchProducts();
    fetchBrands();
    fetchCategories();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchProducts();
    updateUrl();
  }, [
    currentPage,
    limit,
    searchQuery,
    categoryFilter,
    brandFilter,
    supplierFilter,
  ]);

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

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Package className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No products found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery || categoryFilter || brandFilter || supplierFilter
          ? "No products match your search criteria. Try different filters."
          : "No products available in stock."}
      </p>
      {(searchQuery || categoryFilter || brandFilter || supplierFilter) && (
        <Button variant="outline" className="mt-4" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );

  const renderActiveFilters = () => {
    const hasFilters =
      searchQuery || categoryFilter || brandFilter || supplierFilter;

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

  const renderTableView = () => (
    <div className="md:p-6 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Purchase Price</TableHead>
            <TableHead>Sale Price</TableHead>
            <TableHead>Total Value (Purchase)</TableHead>
            <TableHead>Total Value (Sale)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <ProductImage product={product} height={60} width={60} />
              </TableCell>
              <TableCell className="font-medium text-wrap">
                {product.name}
              </TableCell>
              <TableCell>{product.category.name}</TableCell>
              <TableCell>{product.brand.name}</TableCell>
              <TableCell>{product.supplier.name}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>
                {formatCurrencyEnglish(product.purchasePrice)}
              </TableCell>
              <TableCell>
                {formatCurrencyEnglish(product.sellingPrice)}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrencyEnglish(
                  product.totalValueByPurchasePrice ||
                    product.stock * product.purchasePrice
                )}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrencyEnglish(
                  product.totalValueBySalePrice ||
                    product.stock * product.sellingPrice
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="w-full md:p-6 p-2">
      <PageHeader
        title="Stock Report"
        description="Comprehensive view of inventory and stock values"
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <div className="grid gap-3 p-2">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold">Category</h4>
                    <Select
                      value={categoryFilter}
                      onValueChange={(value) => {
                        setCategoryFilter(value);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8">
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
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem
                            key={brand.id}
                            value={brand.id.toString()}
                          >
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
                      <SelectTrigger className="h-8">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Reset Filters
                    </Button>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {renderActiveFilters()}

        {isLoading ? (
          <LoadingIndicator message=" Loading Stock Report..." />
        ) : products.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="mt-6">{renderTableView()}</div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
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
  );
}
