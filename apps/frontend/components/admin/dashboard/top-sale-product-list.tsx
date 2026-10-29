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
          `products/bestsellers?limit=${limit}&timeFilter=${timeFilter}`,
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
      <Card className="w-full gap-0 overflow-hidden rounded-xl border-border/70 py-0 shadow-sm">
        <div className="flex min-h-50 items-center justify-center">
          <LoadingIndicator message="Loading top selling products..." />
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl border-border/70 py-0 shadow-sm">
      <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold sm:text-lg">
            Top Selling Products
          </CardTitle>
          <CardDescription className="mt-1 text-xs sm:text-sm">
            Products sorted by sales count
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={limit.toString()}
            onValueChange={(v) => setLimit(parseInt(v))}
          >
            <SelectTrigger className="h-9 w-27.5 rounded-lg bg-background text-xs sm:w-30 sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Top 5</SelectItem>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="20">Top 20</SelectItem>
              <SelectItem value="50">Top 50</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={timeFilter}
            onValueChange={(value: TimeFilter) => setTimeFilter(value)}
          >
            <SelectTrigger className="h-9 w-32.5 rounded-lg bg-background text-xs sm:w-35 sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-3 py-3 sm:px-5 sm:py-4">
        <div className="overflow-x-auto">
          <Table className="min-w-190">
            <TableHeader className="[&_tr]:border-0 [&_tr]:bg-muted/40">
              <TableRow>
                <TableHead className="h-10 w-16 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Rank
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Product
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="h-10 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Sold
                </TableHead>
                <TableHead className="h-10 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Featured
                </TableHead>
                <TableHead className="h-10 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Price
                </TableHead>
                <TableHead className="h-10 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Stock
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
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
                      className="group cursor-pointer"
                      onClick={() => router.push(`/product/${p.slug}`)}
                    >
                      {/* Rank */}
                      <TableCell className="py-3">
                        <span
                          className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold ${
                            idx === 0
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              : idx === 1
                                ? "bg-slate-400/15 text-slate-600 dark:text-slate-300"
                                : idx === 2
                                  ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {p.attachment?.url ? (
                              <Image
                                src={p.attachment.url}
                                alt={p.name}
                                fill
                                sizes="44px"
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] sm:text-xs">
                                No img
                              </div>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="max-w-55 truncate text-sm font-medium group-hover:text-primary">
                              {p.name}
                            </span>
                            {p.brand?.name && (
                              <span className="max-w-55 truncate text-xs text-muted-foreground">
                                {p.brand.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Tag className="size-3.5 shrink-0" />
                          {p.category?.name ?? "—"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
                          <ShoppingCart className="size-3.5 text-muted-foreground" />
                          {p.saleCount}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        {p.isFeatured ? (
                          <Badge
                            variant="secondary"
                            className="gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
                          >
                            <Star className="size-3 fill-current" />
                            Featured
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Price */}
                      <TableCell className="py-3 text-right">
                        {hasDiscount ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrencyEnglish(p.sellingPrice)}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-green-700 dark:text-green-400">
                              <Banknote className="size-3.5" />
                              {formatCurrencyEnglish(discountedPrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
                            <Banknote className="size-3.5 text-muted-foreground" />
                            {formatCurrencyEnglish(p.sellingPrice)}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        {/* Stock */}
                        <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
                          <Boxes className="size-3.5" />
                          {p.stock}
                        </span>
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
