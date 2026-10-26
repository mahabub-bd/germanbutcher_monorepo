"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { PdfDownloadButton } from "@/components/admin/reports/pdf-download-button";
import {
  ReportDateFilters,
  type ReportFilterParams,
} from "@/components/admin/reports/report-date-filters";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { CalendarDays, ShoppingCart, Wallet, XCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface DailySummary {
  totalOrders: number;
  totalValue: number;
  deliveredOrders: number;
  deliveredValue: number;
  cancelledOrders: number;
  paidAmount: number;
  dueAmount: number;
}

interface DailyRow {
  date: string;
  orderCount: number;
  orderValue: number;
  deliveredCount: number;
  deliveredValue: number;
  cancelledCount: number;
  cancelledValue: number;
  pendingCount: number;
  pendingValue: number;
  paidAmount: number;
  dueAmount: number;
}

interface DailySummaryListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: DailySummary | null;
  daily: DailyRow[];
}

// Whole-amount formatting: reports never show decimal fractions
const formatCurrency = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(value || 0);

// Percentage of total orders, rounded to a whole number
const percentOf = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

export default function DailySummaryList({
  fromDate,
  toDate,
  preset,
  summary,
  daily,
}: DailySummaryListProps) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);
    router.push(`?${qs.toString()}`);
  };

  const pdfRows = daily.map((row) => [
    row.date,
    `${formatCurrency(row.orderValue)} / ${row.orderCount}`,
    `${formatCurrency(row.deliveredValue)} / ${row.deliveredCount} (${percentOf(
      row.deliveredCount,
      row.orderCount
    )}%)`,
    `${formatCurrency(row.cancelledValue)} / ${row.cancelledCount} (${percentOf(
      row.cancelledCount,
      row.orderCount
    )}%)`,
    `${formatCurrency(row.pendingValue)} / ${row.pendingCount}`,
    formatCurrency(row.paidAmount),
    formatCurrency(row.dueAmount),
  ]);

  const pdfSummary = [
    { label: "Total Orders", value: String(summary?.totalOrders ?? 0) },
    { label: "Total Value", value: formatCurrency(summary?.totalValue ?? 0) },
    {
      label: "Delivered",
      value: `${summary?.deliveredOrders ?? 0} (${percentOf(
        summary?.deliveredOrders ?? 0,
        summary?.totalOrders ?? 0
      )}%)`,
    },
    {
      label: "Cancelled",
      value: `${summary?.cancelledOrders ?? 0} (${percentOf(
        summary?.cancelledOrders ?? 0,
        summary?.totalOrders ?? 0
      )}%)`,
    },
    { label: "Paid", value: formatCurrency(summary?.paidAmount ?? 0) },
    { label: "Due", value: formatCurrency(summary?.dueAmount ?? 0) },
  ];

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Daily Summary Report"
        />
        {daily.length > 0 && mounted && (
          <PDFDownloadLink
            document={
              <ReportTablePDF
                title="Daily Summary Report"
                orientation="landscape"
                headers={[
                  "Date",
                  "Orders",
                  "Delivered",
                  "Cancelled",
                  "Pending/Processing",
                  "Paid",
                  "Due",
                ]}
                flexes={[1.2, 1.5, 1.5, 1.5, 1.5, 0.9, 1]}
                alignRight={[1, 2, 3, 4, 5, 6]}
                rows={pdfRows}
                summary={pdfSummary}
                settings={settings}
              />
            }
            fileName={`daily-summary-report-${new Date().toISOString().split("T")[0]
              }.pdf`}
          >
            {({ loading, error }) => (
              <PdfDownloadButton loading={loading} error={error} />
            )}
          </PDFDownloadLink>
        )}
      </div>

      {/* Filters — shared single-row filter bar (identical on all report pages) */}
      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={handleFilterApply}
      />

      {/* Range summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatsCard
          icon={ShoppingCart}
          title="Total Orders"
          value={summary?.totalOrders ?? 0}
          count={formatCurrency(summary?.totalValue ?? 0, 0)}
          bgColor="blue"
        />
        <StatsCard
          icon={CalendarDays}
          title="Delivered"
          value={formatCurrency(summary?.deliveredValue ?? 0, 0)}
          count={String(summary?.deliveredOrders ?? 0)}
          bgColor="green"
          description={`${percentOf(
            summary?.deliveredOrders ?? 0,
            summary?.totalOrders ?? 0
          )}% of total orders`}
        />
        <StatsCard
          icon={XCircle}
          title="Cancelled"
          value={formatCurrency(
            daily.reduce((sum, row) => sum + (row.cancelledValue || 0), 0),
            0
          )}
          count={String(summary?.cancelledOrders ?? 0)}
          bgColor="red"
          description={`${percentOf(
            summary?.cancelledOrders ?? 0,
            summary?.totalOrders ?? 0
          )}% of total orders`}
        />
        <StatsCard
          icon={Wallet}
          title="Paid"
          value={formatCurrency(summary?.paidAmount ?? 0, 0)}
          bgColor="purple"
        />
        <StatsCard
          icon={Wallet}
          title="Due"
          value={formatCurrency(summary?.dueAmount ?? 0, 0)}
          bgColor="red"
        />
      </div>

      {/* Daily table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Cancelled</TableHead>
              <TableHead className="text-right">Pending/Processing</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daily.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  No orders found for this date range
                </TableCell>
              </TableRow>
            ) : (
              daily.map((row) => (
                <TableRow key={row.date} className="hover:bg-muted/50">
                  <TableCell className="font-medium whitespace-nowrap">
                    {row.date}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(row.orderValue)} / {row.orderCount}
                  </TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                    {formatCurrency(row.deliveredValue)} / {row.deliveredCount}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({percentOf(row.deliveredCount, row.orderCount)}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                    {formatCurrency(row.cancelledValue)} / {row.cancelledCount}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({percentOf(row.cancelledCount, row.orderCount)}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-orange-600 dark:text-orange-400 whitespace-nowrap">
                    {formatCurrency(row.pendingValue)} / {row.pendingCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.paidAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.dueAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground mt-3">
        {daily.length} day{daily.length === 1 ? "" : "s"} with orders
      </div>
    </div>
  );
}
