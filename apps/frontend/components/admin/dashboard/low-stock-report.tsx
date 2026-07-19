"use client";

import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatCurrencyEnglish } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import type { Product } from "@/utils/types";
import { AlertTriangle, Package, Search, SlidersHorizontal, XCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "../image-wrapper";
import { LoadingIndicator } from "../loading-indicator";

interface LowStockReportProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function LowStockReport({
  initialPage = 1,
  initialLimit = 5,
  initialSearchParams = {},
}: LowStockReportProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [threshold, setThreshold] = useState<number>(
    () => parseInt(getInitialParam("threshold") as string) || 10
  );

  const updateUrl = useCallback(() => {
    // Only update URL if not on dashboard to avoid cluttering the main dashboard URL
    if (pathname === "/admin/dashboard") return;

    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());
    params.set("threshold", threshold.toString());
    if (searchQuery) params.set("search", searchQuery);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, threshold]);

  const fetchLowStockProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      params.append("threshold", threshold.toString());
      if (searchQuery) params.append("search", searchQuery);

      // 🔥 Call new backend API
      const response = await fetchDataPagination<{
        data: Product[];
        total: number;
        totalPages: number;
        threshold?: number;
      }>(`products/reports/low-stock?${params.toString()}`);

      setProducts(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      toast.error("Failed to load low stock report. Please try again.");
      setProducts([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, threshold]);

  useEffect(() => {
    const pageFromUrl = searchParams?.get("page");
    const searchFromUrl = searchParams?.get("search");
    const thresholdFromUrl = searchParams?.get("threshold");
    if (pageFromUrl) {
      const newPage = parseInt(pageFromUrl, 10);
      if (newPage !== currentPage && newPage > 0) {
        setCurrentPage(newPage);
      }
    }
    if (searchFromUrl && searchFromUrl !== searchQuery) {
      setSearchQuery(searchFromUrl);
    }
    if (thresholdFromUrl) {
      const newThreshold = parseInt(thresholdFromUrl, 10);
      if (newThreshold !== threshold) {
        setThreshold(newThreshold);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLowStockProducts();
  }, [fetchLowStockProducts]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const clearFilters = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleThresholdChange = (value: string) => {
    const newThreshold = parseInt(value, 5);
    setThreshold(newThreshold);
    setCurrentPage(1);
  };

  const getStockStatusBadge = (stock: number) => {
    if (stock === 0)
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" /> Out of Stock
        </Badge>
      );
    if (stock <= 2)
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" /> Critical ({stock})
        </Badge>
      );
    if (stock < threshold)
      return (
        <Badge
          variant="secondary"
          className="gap-1 text-orange-600 bg-orange-50"
        >
          <AlertTriangle className="h-3 w-3" /> Low ({stock})
        </Badge>
      );
    return null;
  };

  const renderActiveFilters = () =>
    (searchQuery || threshold !== 10) && (
      <div className="flex flex-wrap gap-2 mt-4">
        {searchQuery && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            Search: {searchQuery}
            <button onClick={() => setSearchQuery("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {threshold !== 10 && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            Threshold: {threshold}
            <button
              onClick={() => setThreshold(10)}
              className="ml-1"
            >
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
          Clear filters
        </Button>
      </div>
    );

  const renderTableView = () => (
    <div className="bg-white dark:bg-gray-950">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Brand</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right hidden lg:table-cell">
                Unit Price
              </TableHead>
              <TableHead className="text-right">Restock Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <LoadingIndicator message="Loading..." />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Package className="h-12 w-12 text-green-500" />
                    <h3 className="font-semibold">Great! No Low Stock Items</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? "No products matching your search have low stock."
                        : "All products are well-stocked. Your inventory levels are healthy!"}
                    </p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const restockQuantity = Math.max(
                  (threshold ?? 10) - (product.stock || 0),
                  0
                );
                const restockValue = restockQuantity * product.purchasePrice;

                return (
                  <TableRow
                    key={product.id}
                    className={`hover:bg-muted/50 ${product.stock === 0 ? "bg-red-50 dark:bg-red-950/20" : ""
                      }`}
                  >
                    <TableCell>
                      <ProductImage product={product} height={50} width={50} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {product.category?.name || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {product.brand?.name || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.stock || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStockStatusBadge(product.stock || 0)}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      {formatCurrencyEnglish(product.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <div className="font-medium text-blue-600">
                          {formatCurrencyEnglish(restockValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({restockQuantity} units)
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && products.length > 0 && (
        <div className="flex justify-between items-center p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * limit + 1, totalItems)} to{" "}
            {Math.min(currentPage * limit, totalItems)} of {totalItems} products
          </div>
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            className="pl-8"
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={threshold.toString()} onValueChange={handleThresholdChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Threshold" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 units</SelectItem>
              <SelectItem value="10">10 units</SelectItem>
              <SelectItem value="15">15 units</SelectItem>
              <SelectItem value="20">20 units</SelectItem>
              <SelectItem value="25">25 units</SelectItem>
              <SelectItem value="50">50 units</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderActiveFilters()}
      {isLoading ? (
        <LoadingIndicator message="Loading low stock report..." />
      ) : (
        renderTableView()
      )}
    </div>
  );
}
