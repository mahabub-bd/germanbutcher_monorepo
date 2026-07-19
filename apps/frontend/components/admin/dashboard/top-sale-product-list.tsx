"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { fetchProtectedData } from "@/utils/api-utils";
import { Eye, Package, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";

interface ProductUnit {
  id: number;
  name: string;
}

interface Attachment {
  id: number;
  fileName: string;
  url: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface BestsellerProduct {
  id: number;
  name: string;
  slug: string;
  sellingPrice: number;
  stock: number;
  saleCount: number;
  isActive: boolean;
  isFeatured: boolean;
  weight: string;
  attachment: Attachment | null;
  brand?: { id: number; name: string; slug: string } | null;
  category?: Category | null;
  unit?: ProductUnit | null;
  discountType?: string | null;
  discountValue?: number | null;
}

// Helper function to calculate discounted price
const getDiscountedPrice = (product: BestsellerProduct): number => {
  if (!product.discountType || !product.discountValue) {
    return product.sellingPrice;
  }

  const discountValue = Number(product.discountValue);

  if (product.discountType?.toUpperCase() === "PERCENTAGE") {
    return product.sellingPrice * (1 - discountValue / 100);
  } else if (product.discountType?.toUpperCase() === "FIXED") {
    return Math.max(0, product.sellingPrice - discountValue);
  }

  return product.sellingPrice;
};

export default function TopSaleProductsList() {
  const [products, setProducts] = useState<BestsellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState<number>(5);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProtectedData<BestsellerProduct[]>(
          `products/bestsellers?limit=${limit}`
        );
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching bestsellers:", error);
        toast.error("Failed to load top selling products.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit]);

  if (loading) {
    return (
      <Card className="w-full overflow-hidden">
        <div className="flex justify-center items-center min-h-[200px]">
          <LoadingIndicator message="Loading top selling products..." />
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl font-bold">Top Selling Products</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Products sorted by sales count</CardDescription>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Select
              value={limit.toString()}
              onValueChange={(v) => setLimit(parseInt(v))}
            >
              <SelectTrigger className="w-[100px] sm:w-[130px] h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="50">Top 50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto mx-4 sm:mx-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] sm:w-[60px] text-xs">#</TableHead>
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="hidden md:table-cell text-xs">
                  Category
                </TableHead>
                <TableHead className="text-center text-xs">Sold</TableHead>
                <TableHead className="text-center text-xs">Featured</TableHead>
                <TableHead className="text-right text-xs">Price</TableHead>
                <TableHead className="text-right text-xs">Discounted Price</TableHead>
                <TableHead className="text-right text-xs hidden sm:table-cell">Stock</TableHead>
                <TableHead className="text-right text-xs w-[50px] sm:w-[60px]">
                  View
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-6 sm:py-8 text-muted-foreground"
                  >
                    <Package className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No products found</p>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p, idx) => {
                  const discountedPrice = getDiscountedPrice(p);
                  const hasDiscount = discountedPrice < p.sellingPrice;

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="py-1.5 sm:py-2 text-xs sm:text-sm">{idx + 1}</TableCell>

                      <TableCell className="py-1.5 sm:py-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                            {p.attachment?.url ? (
                              <Image
                                src={p.attachment.url}
                                alt={p.name}
                                fill
                                sizes="(max-width: 640px) 40px, 48px"
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] sm:text-xs">
                                No img
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium text-xs sm:text-sm truncate">
                              {p.name}
                            </span>
                            <div className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-[220px]">
                              <span>{p.brand?.name ?? ""}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell py-1.5 sm:py-2">
                        <span className="text-[10px] sm:text-xs">{p.category?.name ?? "—"}</span>
                      </TableCell>

                      <TableCell className="text-center py-1.5 sm:py-2">
                        <span className="font-bold text-xs sm:text-sm">{p.saleCount}</span>
                      </TableCell>

                      <TableCell className="text-center py-1.5 sm:py-2">
                        {p.isFeatured ? (
                          <div className="flex justify-center">
                            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-yellow-500" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right py-1.5 sm:py-2">
                        <span className="font-bold text-xs sm:text-sm">
                          {formatCurrencyEnglish(p.sellingPrice)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right py-1.5 sm:py-2">
                        {hasDiscount ? (
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-xs sm:text-sm text-green-600 dark:text-green-400">
                              {formatCurrencyEnglish(discountedPrice)}
                            </span>
                            <span className="text-[10px] text-muted-foreground line-through">
                              {formatCurrencyEnglish(p.sellingPrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-xs sm:text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right py-1.5 sm:py-2 hidden sm:table-cell">
                        <span className="text-[10px] sm:text-xs">{p.stock}</span>
                      </TableCell>

                      <TableCell className="text-right py-1.5 sm:py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                          asChild
                        >
                          <Link href={`/product/${p.slug}`}>
                            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
