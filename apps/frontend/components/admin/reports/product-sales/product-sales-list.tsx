"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import {
  ReportExcelButton,
  dateRangeSubtitle,
} from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import {
  ReportDateFilters,
  type ReportFilterParams,
} from "@/components/admin/reports/report-date-filters";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import { PillBadge, type PillTone } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import {
  Package,
  RefreshCw,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

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

const EXPORT_HEADERS = [
  "#",
  "Product",
  "Qty Sold",
  "Orders",
  "Revenue",
  "Current Stock",
];

/** Whole amounts only — report values never need decimal places. */
const amount = (value: number) => `৳${formatCurrencyEnglish(value || 0, 0)}`;

/** Stock pill: out of stock is red, low (< 5) is amber, healthy is neutral. */
const stockTone = (stock: number): PillTone => {
  if (stock <= 0) return "red";
  if (stock < 5) return "amber";
  return "neutral";
};

export default function ProductSalesList({
  preset,
  fromDate,
  toDate,
  summary,
  products,
}: ProductSalesListProps) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);
    startTransition(() => router.push(`?${qs.toString()}`));
  };

  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const hasData = products.length > 0;

  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalQuantity = summary?.totalQuantity ?? 0;
  const productCount = summary?.productCount ?? products.length;
  const avgRevenuePerUnit =
    totalQuantity > 0 ? Math.round(totalRevenue / totalQuantity) : 0;

  const pdfRows = products.map((p, i) => [
    i + 1,
    p.name,
    p.quantity,
    p.orderCount,
    formatCurrencyEnglish(p.revenue),
    p.stock,
  ]);

  const pdfSummary = [
    { label: "Total Revenue", value: formatCurrencyEnglish(totalRevenue) },
    { label: "Units Sold", value: String(totalQuantity) },
    { label: "Products Sold", value: String(productCount) },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Product Sales Report"
        description={`Per-product units sold and revenue for ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()} — sorted by revenue.`}
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Product Sales Report"
              subtitle={rangeLabel}
              headers={EXPORT_HEADERS}
              rows={pdfRows}
              summary={pdfSummary}
              fileName="product-sales-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Product Sales Report"
                  headers={EXPORT_HEADERS}
                  flexes={[0.5, 2, 0.9, 0.9, 1.2, 1]}
                  alignRight={[0, 2, 3, 4, 5]}
                  rows={pdfRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`product-sales-report-${new Date()
                .toISOString()
                .split("T")[0]}.pdf`}
            />
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => router.refresh())}
        >
          <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={handleFilterApply}
      />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Package className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No sales in this range</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range to see products sold.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              startTransition(() => router.push("?preset=this_year"))
            }
          >
            Search this year
          </Button>
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatsCard
              title="Total revenue"
              value={amount(totalRevenue)}
              description={`Revenue in ${rangeLabel
                .replace(/^Period: /, "")
                .toLowerCase()}`}
              icon={Wallet}
              bgColor="green"
            />
            <StatsCard
              title="Units sold"
              value={totalQuantity.toLocaleString("en-US")}
              description={`Across ${productCount} product${
                productCount === 1 ? "" : "s"
              }`}
              icon={ShoppingCart}
              bgColor="blue"
            />
            <StatsCard
              title="Products sold"
              value={productCount.toLocaleString("en-US")}
              description={`Avg ${amount(avgRevenuePerUnit)} per unit`}
              icon={Package}
              bgColor="purple"
            />
          </div>

          {/* Products */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Products</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · sorted by revenue
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {products.length} row{products.length === 1 ? "" : "s"}
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="pr-4 text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell className="py-2.5 pl-4 text-xs tabular-nums text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{p.name}</p>
                        {p.slug && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {p.slug}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {p.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {p.orderCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrencyEnglish(p.revenue, 0)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <PillBadge
                          tone={stockTone(p.stock)}
                          className="font-medium tabular-nums"
                        >
                          {p.stock}
                        </PillBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {totalQuantity.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrencyEnglish(totalRevenue, 0)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4" />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {products.map((p, i) => (
                <article key={p.id} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight line-clamp-2">
                          {p.name}
                        </p>
                        {p.slug && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {p.slug}
                          </p>
                        )}
                      </div>
                    </div>
                    <PillBadge
                      tone={stockTone(p.stock)}
                      className="shrink-0 font-medium tabular-nums"
                    >
                      Stock {p.stock}
                    </PillBadge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Qty Sold
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {p.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Orders
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                        {p.orderCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Revenue
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(p.revenue)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <div className="border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing all {products.length} product
                {products.length === 1 ? "" : "s"} with sales in this range
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
