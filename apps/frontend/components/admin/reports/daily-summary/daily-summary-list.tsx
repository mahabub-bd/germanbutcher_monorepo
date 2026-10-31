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
import { PillBadge } from "@/components/common/pill-badge";
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
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  CalendarX,
  Clock,
  PackageCheck,
  PauseCircle,
  RefreshCw,
  ShoppingCart,
  Wallet,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

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
  | "pending"
  | "processing"
  | "onHold"
  | "cancelled"
  | "paid"
  | "due";

type SortDir = "asc" | "desc";

/** Color triplet per status: value text, % chip, progress bar / legend dot. */
const tones = {
  green: {
    text: "text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  orange: {
    text: "text-amber-600 dark:text-amber-400",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    bar: "bg-blue-500",
  },
  purple: {
    text: "text-violet-600 dark:text-violet-400",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
    bar: "bg-violet-500",
  },
  red: {
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    bar: "bg-red-500",
  },
  teal: {
    text: "text-teal-600 dark:text-teal-400",
    badge:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
    bar: "bg-teal-500",
  },
} as const;

type Tone = (typeof tones)[keyof typeof tones];

interface StatusColumn {
  key: SortKey;
  label: string;
  tone: Tone;
  value: (row: DailyRow) => number;
  count: (row: DailyRow) => number;
}

/** Status breakdown shared by the table columns and the mobile cards. */
const STATUS_COLUMNS: StatusColumn[] = [
  {
    key: "delivered",
    label: "Delivered",
    tone: tones.green,
    value: (row) => row.deliveredValue || 0,
    count: (row) => row.deliveredCount || 0,
  },
  {
    key: "pending",
    label: "Pending",
    tone: tones.orange,
    value: (row) => row.pendingValue || 0,
    count: (row) => row.pendingCount || 0,
  },
  {
    key: "processing",
    label: "Processing",
    tone: tones.blue,
    value: (row) => row.processingValue || 0,
    count: (row) => row.processingCount || 0,
  },
  {
    key: "onHold",
    label: "On hold",
    tone: tones.purple,
    value: (row) => row.onHoldValue || 0,
    count: (row) => row.onHoldCount || 0,
  },
  {
    key: "cancelled",
    label: "Cancelled",
    tone: tones.red,
    value: (row) => row.cancelledValue || 0,
    count: (row) => row.cancelledCount || 0,
  },
];

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Bangladesh weekend: Friday (5) and Saturday (6). */
const WEEKEND_DAYS = [5, 6];

/** Whole-amount formatting: reports never show decimal fractions. */
const formatCurrency = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(value || 0);

const amount = (value: number) => `৳${formatCurrency(value)}`;

/** Percentage of a whole, rounded — guarded against empty sets. */
const percentOf = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

/**
 * Denominator for the status percentages: delivered + cancelled + pending +
 * processing + on hold, so the status shares add up to 100%. `|| 0` guards
 * against older API responses that lack the split status fields.
 */
const statusTotal = (row: DailyRow) =>
  (row.deliveredCount || 0) +
  (row.cancelledCount || 0) +
  (row.pendingCount || 0) +
  (row.processingCount || 0) +
  (row.onHoldCount || 0);

/** Weekday caption for the API's `YYYY-MM-DD` day key, without timezone shifts. */
function parseDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(
    Date.UTC(year, (month || 1) - 1, day || 1)
  ).getUTCDay();
  return {
    weekday: WEEKDAY[weekday],
    isWeekend: WEEKEND_DAYS.includes(weekday),
  };
}

// Numeric value each sortable column sorts on (status columns sort on value)
const sortValue = (row: DailyRow, key: SortKey): number | string => {
  switch (key) {
    case "date":
      return row.date;
    case "orders":
      return row.orderValue;
    case "delivered":
      return row.deliveredValue;
    case "pending":
      return row.pendingValue;
    case "processing":
      return row.processingValue;
    case "onHold":
      return row.onHoldValue;
    case "cancelled":
      return row.cancelledValue;
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
  const [isPending, startTransition] = useTransition();
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
    startTransition(() =>
      router.push(qs.toString() ? `?${qs.toString()}` : "?")
    );
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

  // The API summary has no cancelled value, but every order carries a total,
  // so the cancelled bucket is whatever the other four statuses don't cover.
  const summaryCancelledValue = summary
    ? Math.max(
        0,
        (summary.totalValue || 0) -
          (summary.deliveredValue || 0) -
          (summary.pendingValue || 0) -
          (summary.processingValue || 0) -
          (summary.onHoldValue || 0)
      )
    : 0;

  const collectedRate = percentOf(
    summary?.paidAmount ?? 0,
    summary?.totalValue ?? 0
  );
  const outstandingRate = percentOf(
    summary?.dueAmount ?? 0,
    summary?.totalValue ?? 0
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

  const exportHeaders = [
    "Date",
    "Orders",
    "Delivered",
    "Cancelled",
    "Pending",
    "Processing",
    "On Hold",
    "Paid",
    "Due",
  ];

  const hasData = daily.length > 0;
  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);

  return (
    <div className="w-full">
      <PageHeader
        title="Daily Summary"
        description={`Orders, deliveries and collections day by day — ${rangeLabel.replace(
          /^Period: /,
          ""
        ).toLowerCase()}.`}
      >
        {hasData && mounted && (
          <>
            <ReportExcelButton
              title="Daily Summary Report"
              subtitle={rangeLabel}
              headers={exportHeaders}
              rows={pdfRows}
              summary={pdfSummary}
              fileName="daily-summary-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Daily Summary Report"
                  orientation="landscape"
                  headers={exportHeaders}
                  flexes={[1.2, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 0.9, 1]}
                  alignRight={[1, 2, 3, 4, 5, 6, 7, 8]}
                  rows={pdfRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`daily-summary-report-${
                new Date().toISOString().split("T")[0]
              }.pdf`}
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

      {/* Filters — shared single-row filter bar (identical on all report pages) */}
      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={handleFilterApply}
      />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <CalendarX className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              No orders in this period
            </p>
            <p className="text-xs text-muted-foreground">
              Widen the date range or pick a different quick range.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFilterApply({ preset: "this_month" })}
          >
            Reset to this month
          </Button>
        </div>
      ) : (
        <>
          {/* Range totals */}
          {summary && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
              <StatsCard
                title="All orders"
                value={amount(summary.totalValue)}
                count={String(summary.totalOrders)}
                description={`${daily.length} active day${daily.length === 1 ? "" : "s"}`}
                icon={ShoppingCart}
                bgColor="blue"
              />
              <StatsCard
                title="Delivered"
                value={amount(summary.deliveredValue)}
                count={String(summary.deliveredOrders)}
                description={`${percentOf(
                  summary.deliveredOrders,
                  summary.totalOrders
                )}% of all orders`}
                icon={PackageCheck}
                bgColor="green"
              />
              <StatsCard
                title="Pending"
                value={amount(summary.pendingValue)}
                count={String(summary.pendingOrders)}
                description={`${percentOf(
                  summary.pendingOrders,
                  summary.totalOrders
                )}% awaiting processing`}
                icon={Clock}
                bgColor="orange"
              />
              <StatsCard
                title="Processing"
                value={amount(summary.processingValue)}
                count={String(summary.processingOrders)}
                description={`${percentOf(
                  summary.processingOrders,
                  summary.totalOrders
                )}% being processed`}
                icon={RefreshCw}
                bgColor="indigo"
              />
              <StatsCard
                title="On hold"
                value={amount(summary.onHoldValue)}
                count={String(summary.onHoldOrders)}
                description={`${percentOf(
                  summary.onHoldOrders,
                  summary.totalOrders
                )}% temporarily paused`}
                icon={PauseCircle}
                bgColor="amber"
              />
              <StatsCard
                title="Cancelled"
                value={amount(summaryCancelledValue)}
                count={String(summary.cancelledOrders)}
                description={`${percentOf(
                  summary.cancelledOrders,
                  summary.totalOrders
                )}% cancellation rate`}
                icon={XCircle}
                bgColor="red"
              />
              <StatsCard
                title="Collected"
                value={amount(summary.paidAmount)}
                description={`${collectedRate}% of order value paid`}
                icon={Wallet}
                bgColor="teal"
              />
              <StatsCard
                title="Outstanding"
                value={amount(summary.dueAmount)}
                description={`${outstandingRate}% still to collect`}
                icon={AlertCircle}
                bgColor="pink"
              />
            </div>
          )}

          {/* Day-by-day breakdown */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Day-by-day breakdown
                </h3>
                <p className="text-xs text-muted-foreground">
                  Amount / order count · status share of that day
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {daily.length} day{daily.length === 1 ? "" : "s"}
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableHead
                      label="Date"
                      sortKeyValue="date"
                      onSort={toggleSort}
                      activeKey={sortKey}
                      dir={sortDir}
                      align="left"
                      className="pl-4"
                    />
                    <SortableHead
                      label="All orders"
                      sortKeyValue="orders"
                      onSort={toggleSort}
                      activeKey={sortKey}
                      dir={sortDir}
                    />
                    {STATUS_COLUMNS.map((column) => (
                      <SortableHead
                        key={column.key}
                        label={column.label}
                        sortKeyValue={column.key}
                        onSort={toggleSort}
                        activeKey={sortKey}
                        dir={sortDir}
                      />
                    ))}
                    <SortableHead
                      label="Paid"
                      sortKeyValue="paid"
                      onSort={toggleSort}
                      activeKey={sortKey}
                      dir={sortDir}
                    />
                    <SortableHead
                      label="Due"
                      sortKeyValue="due"
                      onSort={toggleSort}
                      activeKey={sortKey}
                      dir={sortDir}
                      className="pr-4"
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDaily.map((row) => {
                    const day = parseDay(row.date);
                    const denominator = statusTotal(row);

                    return (
                      <TableRow key={row.date}>
                        <TableCell className="py-2.5 pl-4">
                          <p className="text-sm font-semibold tabular-nums">
                            {row.date}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {day.weekday}
                            {day.isWeekend ? " · weekend" : ""} ·{" "}
                            {row.orderCount} order
                            {row.orderCount === 1 ? "" : "s"}
                          </p>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span
                              className={cn(
                                "text-sm font-semibold tabular-nums",
                                tones.blue.text
                              )}
                            >
                              {formatCurrency(row.orderValue)}
                            </span>
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                              / {row.orderCount}
                            </span>
                          </div>
                        </TableCell>

                        {STATUS_COLUMNS.map((column) => (
                          <StatusCell
                            key={column.key}
                            value={column.value(row)}
                            count={column.count(row)}
                            percent={percentOf(
                              column.count(row),
                              denominator
                            )}
                            tone={column.tone}
                          />
                        ))}

                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              tones.teal.text
                            )}
                          >
                            {formatCurrency(row.paidAmount)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              row.dueAmount > 0
                                ? tones.red.text
                                : "text-muted-foreground"
                            )}
                          >
                            {formatCurrency(row.dueAmount)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {summary && (
                  <TableFooter>
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Total
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-bold tabular-nums">
                          {formatCurrency(summary.totalValue)}
                        </span>
                        <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
                          / {summary.totalOrders}
                        </span>
                      </TableCell>
                      {[
                        {
                          key: "delivered",
                          value: summary.deliveredValue,
                          count: summary.deliveredOrders,
                          tone: tones.green,
                        },
                        {
                          key: "pending",
                          value: summary.pendingValue,
                          count: summary.pendingOrders,
                          tone: tones.orange,
                        },
                        {
                          key: "processing",
                          value: summary.processingValue,
                          count: summary.processingOrders,
                          tone: tones.blue,
                        },
                        {
                          key: "onHold",
                          value: summary.onHoldValue,
                          count: summary.onHoldOrders,
                          tone: tones.purple,
                        },
                        {
                          key: "cancelled",
                          value: summaryCancelledValue,
                          count: summary.cancelledOrders,
                          tone: tones.red,
                        },
                      ].map((total) => (
                        <TableCell key={total.key} className="text-right">
                          <span
                            className={cn(
                              "text-sm font-bold tabular-nums",
                              total.tone.text
                            )}
                          >
                            {formatCurrency(total.value)}
                          </span>
                          <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
                            / {total.count}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            tones.teal.text
                          )}
                        >
                          {formatCurrency(summary.paidAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            summary.dueAmount > 0
                              ? tones.red.text
                              : "text-muted-foreground"
                          )}
                        >
                          {formatCurrency(summary.dueAmount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {sortedDaily.map((row) => {
                const day = parseDay(row.date);
                const denominator = statusTotal(row);

                return (
                  <article key={row.date} className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tabular-nums">
                          {row.date}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {day.weekday} · {amount(row.orderValue)} ·{" "}
                          {row.orderCount} orders
                        </p>
                      </div>
                      <PillBadge
                        tone={row.dueAmount > 0 ? "red" : "emerald"}
                        className="shrink-0 tabular-nums"
                      >
                        {row.dueAmount > 0
                          ? `${formatCurrency(row.dueAmount)} due`
                          : "paid"}
                      </PillBadge>
                    </div>

                    {/* Status mix */}
                    <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      {STATUS_COLUMNS.map((column) => {
                        const share = percentOf(
                          column.count(row),
                          denominator || row.orderCount
                        );
                        if (share === 0) return null;
                        return (
                          <div
                            key={column.key}
                            className={column.tone.bar}
                            style={{ width: `${share}%` }}
                          />
                        );
                      })}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                      {STATUS_COLUMNS.map((column) => (
                        <div
                          key={column.key}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                column.tone.bar
                              )}
                            />
                            {column.label}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-semibold tabular-nums",
                              column.tone.text
                            )}
                          >
                            {formatCurrency(column.value(row))}
                            <span className="ml-1 font-normal text-muted-foreground">
                              /{column.count(row)}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Wallet className="size-3.5" />
                        Paid
                        <span
                          className={cn("font-semibold", tones.teal.text)}
                        >
                          {amount(row.paidAmount)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <AlertCircle className="size-3.5" />
                        Due
                        <span
                          className={cn(
                            "font-semibold",
                            row.dueAmount > 0
                              ? tones.red.text
                              : "text-muted-foreground"
                          )}
                        >
                          {amount(row.dueAmount)}
                        </span>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** "Value / count" cell with a share bar and percentage chip. */
function StatusCell({
  value,
  count,
  percent,
  tone,
}: {
  value: number;
  count: number;
  percent: number;
  tone: Tone;
}) {
  return (
    <TableCell className="min-w-37 text-right">
      <div className="flex items-baseline justify-end gap-1.5">
        <span className={cn("text-sm font-semibold tabular-nums", tone.text)}>
          {formatCurrency(value)}
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          / {count}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-end gap-2">
        <div className="h-1 min-w-16 max-w-28 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", tone.bar)}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span
          className={cn(
            "rounded px-1 py-px text-[10px] font-semibold tabular-nums",
            tone.badge
          )}
        >
          {percent}%
        </span>
      </div>
    </TableCell>
  );
}

/** Sortable column header, right-aligned by default. */
function SortableHead({
  label,
  sortKeyValue,
  onSort,
  activeKey,
  dir,
  align = "right",
  className,
}: {
  label: string;
  sortKeyValue: SortKey;
  onSort: (key: SortKey) => void;
  activeKey: SortKey;
  dir: SortDir;
  align?: "left" | "right";
  className?: string;
}) {
  const active = activeKey === sortKeyValue;

  return (
    <TableHead
      className={cn(align === "right" && "text-right", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKeyValue)}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}
