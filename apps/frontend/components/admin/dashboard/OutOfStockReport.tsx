import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
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
import { Package } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "../image-wrapper";
import { LoadingIndicator } from "../loading-indicator";

export function OutOfStockReport() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOutOfStock = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      const response = await fetchDataPagination<{
        data: Product[];
        total: number;
        totalPages: number;
      }>(`products/reports/out-of-stock?${params.toString()}`);

      setProducts(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Error fetching out of stock products:", error);
      toast.error("Failed to load report. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit]);

  useEffect(() => {
    fetchOutOfStock();
  }, [fetchOutOfStock]);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <LoadingIndicator message="Loading out of stock report..." />
      ) : (
        <div className=" bg-white dark:bg-gray-950  ">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Brand</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Package className="h-12 w-12 text-green-500" />
                        <h3 className="font-semibold">No Out of Stock Items</h3>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-muted/50 bg-red-50 dark:bg-red-950/20"
                    >
                      <TableCell>
                        <ProductImage
                          product={product}
                          height={50}
                          width={50}
                        />
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
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
                      <TableCell className="text-right font-medium">
                        {formatCurrencyEnglish(product.sellingPrice)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-4 md: p-2 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * limit + 1, totalItems)} to{" "}
              {Math.min(currentPage * limit, totalItems)} of {totalItems} items
            </span>

            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
