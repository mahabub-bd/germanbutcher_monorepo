"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { ReportExcelButton } from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
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
  AlertTriangle,
  Boxes,
  PackageX,
  RefreshCw,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface Summary {
  totalProducts: number;
  totalUnits: number;
  stockValueCost: number;
  stockValueRetail: number;
  outOfStock: number;
  lowStock: number;
}

interface InventoryProduct {
  id: number;
  name: string;
  slug: string;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  stockStatus: "out" | "low" | "ok";
}

/** Whole amounts only — report values never need decimal places. */
const bare = (value: number) => formatCurrencyEnglish(value || 0, 0);
/** Cards carry the ৳ mark; desktop cells rely on the header note instead. */
const amount = (value: number) => `৳${bare(value)}`;
/** @react-pdf's built-in fonts have no ৳ glyph, so exports use "BDT ". */
const formatMoney = (value: number) =>
  `BDT ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const STOCK_TONE: Record<InventoryProduct["stockStatus"], PillTone> = {
  out: "red",
  low: "amber",
  ok: "neutral",
};

const STOCK_LABEL: Record<InventoryProduct["stockStatus"], string> = {
  out: "Out of stock",
  low: "Low stock",
  ok: "In stock",
};

export default function InventoryList({
  summary,
  products,
}: {
  summary: Summary | null;
  products: InventoryProduct[];
}) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasData = products.length > 0;

  const pdfRows = products.map((p) => [
    p.name,
    p.stock,
    formatMoney(p.purchasePrice),
    formatMoney(p.sellingPrice),
  ]);

  const pdfSummary = [
    { label: "Total Products", value: String(summary?.totalProducts ?? 0) },
    { label: "Total Units", value: String(summary?.totalUnits ?? 0) },
    { label: "Value (Cost)", value: formatMoney(summary?.stockValueCost ?? 0) },
    {
      label: "Value (Retail)",
      value: formatMoney(summary?.stockValueRetail ?? 0),
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Inventory Report"
        description="Stock on hand for every product, lowest stock first — units and value at cost and retail."
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Inventory Report"
              headers={["Product", "Stock", "Purchase Price", "Selling Price"]}
              rows={pdfRows}
              summary={pdfSummary}
              fileName="inventory-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Inventory Report"
                  headers={[
                    "Product",
                    "Stock",
                    "Purchase Price",
                    "Selling Price",
                  ]}
                  flexes={[2, 0.8, 1.2, 1.2]}
                  alignRight={[1, 2, 3]}
                  rows={pdfRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`inventory-report-${new Date()
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

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Boxes className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No products in inventory</p>
            <p className="text-xs text-muted-foreground">
              Add products to see stock levels and valuation here.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startTransition(() => router.refresh())}
          >
            Refresh
          </Button>
        </div>
      ) : (
        <>
          {/* Stock totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <StatsCard
              icon={Boxes}
              title="Total products"
              value={(summary?.totalProducts ?? 0).toLocaleString("en-US")}
              description={`${(summary?.totalUnits ?? 0).toLocaleString(
                "en-US"
              )} units in stock`}
              bgColor="blue"
            />
            <StatsCard
              icon={Warehouse}
              title="Stock value (cost)"
              value={amount(summary?.stockValueCost ?? 0)}
              description="At purchase price"
              bgColor="purple"
            />
            <StatsCard
              icon={TrendingUp}
              title="Stock value (retail)"
              value={amount(summary?.stockValueRetail ?? 0)}
              description="At selling price"
              bgColor="green"
            />
            <StatsCard
              icon={AlertTriangle}
              title="Low stock"
              value={(summary?.lowStock ?? 0).toLocaleString("en-US")}
              description="Fewer than 5 units left"
              bgColor="amber"
            />
            <StatsCard
              icon={PackageX}
              title="Out of stock"
              value={(summary?.outOfStock ?? 0).toLocaleString("en-US")}
              description="Needs restocking"
              bgColor="red"
            />
          </div>

          {/* Products */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Products</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · lowest stock first
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
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="pr-4 text-right">
                      Selling Price
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p, index) => (
                    <TableRow key={p.id}>
                      <TableCell className="py-2.5 pl-4 text-xs tabular-nums text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{p.name}</p>
                        {p.slug && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {p.slug}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <PillBadge
                          tone={STOCK_TONE[p.stockStatus]}
                          className="font-medium tabular-nums"
                          title={STOCK_LABEL[p.stockStatus]}
                        >
                          {p.stock}
                        </PillBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(p.purchasePrice)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(p.sellingPrice)}
                        </span>
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
                    <TableCell>
                      <span className="text-sm font-bold tabular-nums">
                        {(summary?.totalUnits ?? 0).toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(summary?.stockValueCost ?? 0)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(summary?.stockValueRetail ?? 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {products.map((p, index) => (
                <article key={p.id} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {index + 1}
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
                      tone={STOCK_TONE[p.stockStatus]}
                      className="shrink-0 font-medium tabular-nums"
                      title={STOCK_LABEL[p.stockStatus]}
                    >
                      Stock {p.stock}
                    </PillBadge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Purchase Price
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(p.purchasePrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Selling Price
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(p.sellingPrice)}
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
                {products.length === 1 ? "" : "s"}, lowest stock first
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
