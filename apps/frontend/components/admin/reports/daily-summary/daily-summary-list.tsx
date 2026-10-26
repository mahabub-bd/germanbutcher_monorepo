"use client";

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
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Wallet,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  pendingOrders: number;
  pendingValue: number;
  processingOrders: number;
  processingValue: number;
  onHoldOrders: number;
  onHoldValue: number;
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
  processingCount: number;
  processingValue: number;
  onHoldCount: number;
  onHoldValue: number;
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

type SortKey =
  | "date"
  | "orders"
  | "delivered"
  | "cancelled"
  | "pending"
  | "processing"
  | "onHold"
  | "paid"
  | "due";

type SortDir = "asc" | "desc";

// Color triplets for each status column: value text, % badge and progress bar
const tones = {
  green: {
    text: "text-green-600 dark:text-green-400",
    badge:
      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    bar: "bg-green-500",
  },
  red: {
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    bar: "bg-red-500",
  },
  orange: {
    text: "text-orange-600 dark:text-orange-400",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
    bar: "bg-orange-500",
  },
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    bar: "bg-blue-500",
  },
  purple: {
    text: "text-purple-600 dark:text-purple-400",
    badge:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
    bar: "bg-purple-500",
  },
} as const;

// Whole-amount formatting: reports never show decimal fractions
const formatCurrency = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(value || 0);

// Percentage of total orders, rounded to a whole number
const percentOf = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

// Denominator for the status percentages: delivered + cancelled + pending +
// processing + on hold, so the status shares add up to 100%. `|| 0` guards
// against older API responses that lack the split status fields.
const statusTotal = (row: DailyRow) =>
  (row.deliveredCount || 0) +
  (row.cancelledCount || 0) +
  (row.pendingCount || 0) +
  (row.processingCount || 0) +
  (row.onHoldCount || 0);

// Numeric value each sortable column sorts on (status columns sort on value)
const sortValue = (row: DailyRow, key: SortKey): number | string => {
  switch (key) {
    case "date":
      return row.date;
    case "orders":
      return row.orderValue;
    case "delivered":
      return row.deliveredValue;
    case "cancelled":
      return row.cancelledValue;
    case "pending":
      return row.pendingValue;
    case "processing":
      return row.processingValue;
    case "onHold":
      return row.onHoldValue;
    case "paid":
      return row.paidAmount;
    case "due":
      return row.dueAmount;
  }
};

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
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedDaily = useMemo(
    () =>
      [...daily].sort((a, b) => {
        const va = sortValue(a, sortKey);
        const vb = sortValue(b, sortKey);
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDir === "desc" ? -cmp : cmp;
      }),
    [daily, sortKey, sortDir]
  );

  const pdfRows = daily.map((row) => [
    row.date,
    `${formatCurrency(row.orderValue)} / ${row.orderCount}`,
    `${formatCurrency(row.deliveredValue)} / ${row.deliveredCount} (${percentOf(
      row.deliveredCount,
      statusTotal(row)
    )}%)`,
    `${formatCurrency(row.cancelledValue)} / ${row.cancelledCount} (${percentOf(
      row.cancelledCount,
      statusTotal(row)
    )}%)`,
    `${formatCurrency(row.pendingValue)} / ${row.pendingCount} (${percentOf(
      row.pendingCount,
      statusTotal(row)
    )}%)`,
    `${formatCurrency(row.processingValue)} / ${row.processingCount} (${percentOf(
      row.processingCount,
      statusTotal(row)
    )}%)`,
    `${formatCurrency(row.onHoldValue)} / ${row.onHoldCount} (${percentOf(
      row.onHoldCount,
      statusTotal(row)
    )}%)`,
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
      label: "Pending",
      value: `${summary?.pendingOrders ?? 0} (${percentOf(
        summary?.pendingOrders ?? 0,
        summary?.totalOrders ?? 0
      )}%)`,
    },
    {
      label: "Processing",
      value: `${summary?.processingOrders ?? 0} (${percentOf(
        summary?.processingOrders ?? 0,
        summary?.totalOrders ?? 0
      )}%)`,
    },
    {
      label: "On Hold",
      value: `${summary?.onHoldOrders ?? 0} (${percentOf(
        summary?.onHoldOrders ?? 0,
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

  // Status column cell: "value / count" + % badge on top, progress bar below
  const StatusCell = ({
    value,
    count,
    percent,
    tone,
  }: {
    value: number;
    count: number;
    percent: number;
    tone: (typeof tones)[keyof typeof tones];
  }) => {
    return (
      <TableCell className="min-w-35 whitespace-nowrap pr-8">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium ${tone.text}`}>
            {formatCurrency(value)} / {count}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.badge}`}
          >
            {percent}%
          </span>
        </div>
        <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${tone.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </TableCell>
    );
  };

  // Row's status percentages are measured against the delivered+cancelled+
  // pending+processing+onHold total; computed eagerly per row
  const rowPercent = (count: number, row: DailyRow) =>
    percentOf(count, statusTotal(row));

  const SortableHead = ({
    label,
    sortKeyValue,
  }: {
    label: string;
    sortKeyValue: SortKey;
  }) => (
    <TableHead className="pr-8">
      <button
        type="button"
        onClick={() => toggleSort(sortKeyValue)}
        className={`flex items-center gap-1 whitespace-nowrap hover:text-foreground ${
          sortKey === sortKeyValue ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
        {sortKey === sortKeyValue ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3" />
        )}
      </button>
    </TableHead>
  );

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
                  "Pending",
                  "Processing",
                  "On Hold",
                  "Paid",
                  "Due",
                ]}
                flexes={[1.2, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 0.9, 1]}
                alignRight={[1, 2, 3, 4, 5, 6, 7, 8]}
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

      {/* Daily table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <SortableHead label="Date" sortKeyValue="date" />
              <SortableHead label="Orders" sortKeyValue="orders" />
              <SortableHead label="Delivered" sortKeyValue="delivered" />
              <SortableHead label="Cancelled" sortKeyValue="cancelled" />
              <SortableHead label="Pending" sortKeyValue="pending" />
              <SortableHead label="Processing" sortKeyValue="processing" />
              <SortableHead label="On Hold" sortKeyValue="onHold" />
              <SortableHead label="Paid" sortKeyValue="paid" />
              <SortableHead label="Due" sortKeyValue="due" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {daily.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-12 text-muted-foreground"
                >
                  No orders found for this date range
                </TableCell>
              </TableRow>
            ) : (
              sortedDaily.map((row, index) => {
                return (
                  <TableRow key={row.date} className="hover:bg-muted/50">
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap pr-8">
                      {row.date}
                    </TableCell>
                    <TableCell
                      className={`whitespace-nowrap pr-8 text-sm font-medium ${tones.blue.text}`}
                    >
                      {formatCurrency(row.orderValue)} / {row.orderCount}
                    </TableCell>
                    <StatusCell
                      value={row.deliveredValue}
                      count={row.deliveredCount}
                      percent={rowPercent(row.deliveredCount, row)}
                      tone={tones.green}
                    />
                    <StatusCell
                      value={row.cancelledValue}
                      count={row.cancelledCount}
                      percent={rowPercent(row.cancelledCount, row)}
                      tone={tones.red}
                    />
                    <StatusCell
                      value={row.pendingValue}
                      count={row.pendingCount}
                      percent={rowPercent(row.pendingCount, row)}
                      tone={tones.orange}
                    />
                    <StatusCell
                      value={row.processingValue}
                      count={row.processingCount}
                      percent={rowPercent(row.processingCount, row)}
                      tone={tones.blue}
                    />
                    <StatusCell
                      value={row.onHoldValue}
                      count={row.onHoldCount}
                      percent={rowPercent(row.onHoldCount, row)}
                      tone={tones.purple}
                    />
                    <TableCell className="whitespace-nowrap pr-8">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${tones.green.badge}`}
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        {formatCurrency(row.paidAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-8">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${tones.red.badge}`}
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        {formatCurrency(row.dueAmount)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
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
