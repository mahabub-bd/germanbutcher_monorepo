"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
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
import {
  AlertTriangle,
  Boxes,
  PackageX,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import dynamic from "next/dynamic";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface Summary {
  totalProducts: number;
  totalUnits: number;
  stockValueCost: number;
  stockValueRetail: number;
  outOfStock: number;
  lowStock: number;
}

export default function InventoryList({
  summary,
  products,
}: {
  summary: Summary | null;
  products: {
    id: number;
    name: string;
    slug: string;
    stock: number;
    purchasePrice: number;
    sellingPrice: number;
    stockStatus: "out" | "low" | "ok";
  }[];
}) {
  const settings = useBusinessSettings();

  const pdfRows = products.map((p) => [
    p.name,
    p.stock,
    formatCurrencyEnglish(p.purchasePrice),
    formatCurrencyEnglish(p.sellingPrice),
  ]);

  const pdfSummary = [
    { label: "Total Products", value: String(summary?.totalProducts ?? 0) },
    { label: "Total Units", value: String(summary?.totalUnits ?? 0) },
    { label: "Value (Cost)", value: formatCurrencyEnglish(summary?.stockValueCost ?? 0) },
    { label: "Value (Retail)", value: formatCurrencyEnglish(summary?.stockValueRetail ?? 0) },
  ];

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Inventory Report"
          description="Stock valuation and products needing restock"
        />
        {products.length > 0 && (
          <PDFDownloadLink
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
            fileName={`inventory-report-${new Date().toISOString().split("T")[0]
              }.pdf`}
          >
            {({ loading, error }) => (
              <Button variant="secondary" disabled={!!error} className="shrink-0">
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

      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatsCard icon={Boxes} title="Total Products" value={summary?.totalProducts ?? 0} count={`${summary?.totalUnits ?? 0} units`} bgColor="blue" />
        <StatsCard icon={Warehouse} title="Stock Value (Cost)" value={formatCurrencyEnglish(summary?.stockValueCost ?? 0)} bgColor="purple" />
        <StatsCard icon={TrendingUp} title="Stock Value (Retail)" value={formatCurrencyEnglish(summary?.stockValueRetail ?? 0)} bgColor="green" />
        <StatsCard icon={AlertTriangle} title="Low Stock (< 5)" value={summary?.lowStock ?? 0} bgColor="amber" />
        <StatsCard icon={PackageX} title="Out of Stock" value={summary?.outOfStock ?? 0} bgColor="red" />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        p.stockStatus === "out"
                          ? "text-red-600 dark:text-red-400 font-medium"
                          : p.stockStatus === "low"
                            ? "text-amber-600 dark:text-amber-400"
                            : ""
                      }
                    >
                      {p.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyEnglish(p.purchasePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyEnglish(p.sellingPrice)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
