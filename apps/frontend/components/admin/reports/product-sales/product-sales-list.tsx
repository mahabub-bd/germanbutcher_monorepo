"use client";

import { PageHeader } from "@/components/admin/page-header";
import { ReportDateFilters } from "@/components/admin/reports/report-date-filters";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish } from "@/lib/utils";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface Summary {
  totalRevenue: number;
  totalQuantity: number;
  productCount: number;
}

interface ProductRow {
  id: number;
  name: string;
  slug: string;
  stock: number;
  quantity: number;
  revenue: number;
  orderCount: number;
}

interface ProductSalesListProps {
  preset?: string;
  fromDate?: string;
  toDate?: string;
  summary: Summary | null;
  products: ProductRow[];
}

export default function ProductSalesList({
  preset,
  fromDate,
  toDate,
  summary,
  products,
}: ProductSalesListProps) {
  const router = useRouter();

  const applyParams = (params: {
    preset?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const q = new URLSearchParams();
    if (params.preset) q.set("preset", params.preset);
    if (params.fromDate) q.set("fromDate", params.fromDate);
    if (params.toDate) q.set("toDate", params.toDate);
    router.push(`?${q.toString()}`);
  };

  const settings = useBusinessSettings();

  const pdfRows = products.map((p, i) => [
    i + 1,
    p.name,
    p.quantity,
    p.orderCount,
    formatCurrencyEnglish(p.revenue),
    p.stock,
  ]);

  const pdfSummary = [
    { label: "Total Revenue", value: formatCurrencyEnglish(summary?.totalRevenue ?? 0) },
    { label: "Units Sold", value: String(summary?.totalQuantity ?? 0) },
    { label: "Products Sold", value: String(summary?.productCount ?? 0) },
  ];

  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalQuantity = summary?.totalQuantity ?? 0;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader
          title="Product Sales Report"
          description="Top products by revenue for a date range (cancelled orders excluded)"
        />
        {products.length > 0 && (
          <PDFDownloadLink
            document={
              <ReportTablePDF
                title="Product Sales Report"
                headers={[
                  "#",
                  "Product",
                  "Qty Sold",
                  "Orders",
                  "Revenue",
                  "Current Stock",
                ]}
                flexes={[0.5, 2, 0.9, 0.9, 1.2, 1]}
                alignRight={[0, 2, 3, 4, 5]}
                rows={pdfRows}
                summary={pdfSummary}
                settings={settings}
              />
            }
            fileName={`product-sales-report-${
              new Date().toISOString().split("T")[0]
            }.pdf`}
          >
            {({ loading, error }) => (
              <Button variant="secondary" disabled={!!error} className="shrink-0 w-full sm:w-auto">
                {error
                  ? "PDF Error"
                  : loading
                    ? "Generating PDF..."
                    : "Download PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </div>

      <ReportDateFilters
        preset={preset}
        fromDate={fromDate} toDate={toDate} onApply={applyParams} />

      {/* Summary tiles — compact on mobile, 3 across from sm up */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        {[
          {
            icon: TrendingUp,
            label: "Total Revenue",
            value: formatCurrencyEnglish(totalRevenue),
            tile: "bg-green-100 text-green-600",
          },
          {
            icon: ShoppingCart,
            label: "Units Sold",
            value: String(totalQuantity),
            tile: "bg-blue-100 text-blue-600",
          },
          {
            icon: Package,
            label: "Products Sold",
            value: String(summary?.productCount ?? 0),
            tile: "bg-purple-100 text-purple-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 sm:gap-3 rounded-xl border bg-card p-3 sm:p-4"
          >
            <span
              className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg ${stat.tile}`}
            >
              <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm sm:text-2xl font-bold leading-none truncate">
                {stat.value}
              </p>
              <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-10 text-center">
            <Package className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No sales found for this date range
            </p>
          </div>
        ) : (
          products.map((p, i) => (
            <div key={p.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight line-clamp-2">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.quantity} unit{p.quantity !== 1 ? "s" : ""} ·{" "}
                      {p.orderCount} order{p.orderCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-primaryColor">
                    {formatCurrencyEnglish(p.revenue)}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      p.stock < 5
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    Stock {p.stock}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty Sold</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No sales found for this date range
                </TableCell>
              </TableRow>
            ) : (
              products.map((p, i) => (
                <TableRow key={p.id} className="hover:bg-muted/50">
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right">{p.orderCount}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrencyEnglish(p.revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={p.stock < 5 ? "text-red-600 dark:text-red-400" : ""}>
                      {p.stock}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground mt-3">
        {products.length} product{products.length === 1 ? "" : "s"} with sales
        in this date range, sorted by revenue
      </div>
    </div>
  );
}
