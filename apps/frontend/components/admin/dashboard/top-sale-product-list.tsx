"use client";

import { Badge } from "@/components/ui/badge";
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
import {
  Banknote,
  Boxes,
  Package,
  ShoppingCart,
  Star,
  Tag,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

type TimeFilter =
  | "last_month"
  | "this_month"
  | "last_3_months"
  | "last_6_months"
  | "last_year"
  | "this_year"
  | "all_time";

export default function TopSaleProductsList() {
  const router = useRouter();
  const [products, setProducts] = useState<BestsellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState<number>(5);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all_time");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProtectedData<BestsellerProduct[]>(
          `products/bestsellers?limit=${limit}&timeFilter=${timeFilter}`
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
  }, [limit, timeFilter]);

  if (loading) {
    return (
      <Card className="w-full overflow-hidden">
        <div className="flex justify-center items-center min-h-50">
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

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Select
              value={limit.toString()}
              onValueChange={(v) => setLimit(parseInt(v))}
            >
              <SelectTrigger className="w-25 sm:w-32.5 h-8 sm:h-9 text-xs sm:text-sm lg:text-xs 2xl:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs 2xl:text-sm" value="5">Top 5</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="10">Top 10</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="20">Top 20</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="50">Top 50</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={timeFilter}
              onValueChange={(value: TimeFilter) => setTimeFilter(value)}
            >
              <SelectTrigger className="w-27.5 sm:w-35 h-8 sm:h-9 text-xs sm:text-sm lg:text-xs 2xl:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs 2xl:text-sm" value="last_month">Last Month</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="this_month">This Month</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="last_year">Last Year</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="this_year">This Year</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="all_time">All Time</SelectItem>
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
                <TableHead className="w-12.5 sm:w-15 text-xs sm:text-sm font-bold h-9 sm:h-10">Rank</TableHead>
                <TableHead className="text-xs sm:text-sm font-bold h-9 sm:h-10">Product</TableHead>
                <TableHead className="hidden md:table-cell text-xs sm:text-sm font-bold h-9 sm:h-10">
                  Category
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm font-bold h-9 sm:h-10">Sold</TableHead>
                <TableHead className="text-center text-xs sm:text-sm font-bold h-9 sm:h-10">Featured</TableHead>
                <TableHead className="text-right text-xs sm:text-sm font-bold h-9 sm:h-10">Price</TableHead>
                <TableHead className="text-right text-xs sm:text-sm font-bold h-9 sm:h-10 hidden sm:table-cell">
                  Stock
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
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
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/product/${p.slug}`)}
                    >
                      {/* Rank */}
                      <TableCell className="py-1.5 sm:py-2 text-xs sm:text-sm">
                        {idx + 1}
                      </TableCell>

                      <TableCell className="py-1.5 sm:py-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-muted shrink-0">
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
                            <span className="font-medium text-xs sm:text-sm truncate max-w-37.5 sm:max-w-55">
                              {p.name}
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-37.5 sm:max-w-55">
                              {p.brand?.name ?? ""}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell py-1.5 sm:py-2">
                        <Badge variant="outline" className="h-5 px-1.5 text-xs sm:text-sm font-normal">
                          <Tag className="h-3.5 w-3.5 shrink-0" />
                          {p.category?.name ?? "—"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center py-1.5 sm:py-2">
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs sm:text-sm font-bold">
                          <ShoppingCart className="h-3.5 w-3.5" />{p.saleCount}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center py-1.5 sm:py-2">
                        {p.isFeatured ? (
                          <Star className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-yellow-500 fill-yellow-500" />
                        ) : (
                          <span className="text-xs sm:text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Price */}
                      <TableCell className="text-right py-1.5 sm:py-2">
                        {hasDiscount ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs sm:text-sm text-muted-foreground line-through">
                              {formatCurrencyEnglish(p.sellingPrice)}
                            </span>
                            <Badge className="h-5 px-1.5 text-xs sm:text-sm font-bold bg-green-600 dark:bg-green-500">
                              <Banknote className="h-3.5 w-3.5" />{formatCurrencyEnglish(discountedPrice)}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs sm:text-sm font-bold">
                            <Banknote className="h-3.5 w-3.5" />{formatCurrencyEnglish(p.sellingPrice)}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right py-1.5 sm:py-2 hidden sm:table-cell">
                        {/* Stock */}
                        <Badge variant="outline" className="h-5 px-1.5 text-xs sm:text-sm">
                          <Boxes className="h-3.5 w-3.5" />{p.stock}
                        </Badge>
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
