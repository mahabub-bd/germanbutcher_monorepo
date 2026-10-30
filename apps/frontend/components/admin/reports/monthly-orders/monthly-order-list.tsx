"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { ReportExcelButton } from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import {
  BarChart3,
  CalendarRange,
  CalendarX,
  Clock,
  Loader2,
  PackageCheck,
  PauseCircle,
  RefreshCw,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { MonthlyOrderPDF } from "./MonthlyOrderPDF";

export interface MonthlyData {
  year: number;
  month: string;
  allOrderCount: number;
  allOrderValue: number;
  orderCount: number;
  totalValue: number;
  cancelOrderCount: number;
  cancelValue: number;
  pendingOrderCount: number;
  pendingValue: number;
  processingOrderCount: number;
  processingValue: number;
  onHoldOrderCount: number;
  onHoldValue: number;
}

interface Props {
  monthlyData: MonthlyData[];
  availableYears: number[];
  selectedYear?: number;
}

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
} as const;

type Tone = (typeof tones)[keyof typeof tones];

interface StatusColumn {
  key: string;
  label: string;
  tone: Tone;
  value: (row: MonthlyData) => number;
  count: (row: MonthlyData) => number;
}

/** Status breakdown shared by the table columns and the mobile cards. */
const STATUS_COLUMNS: StatusColumn[] = [
  {
    key: "delivered",
    label: "Delivered",
    tone: tones.green,
    value: (row) => row.totalValue || 0,
    count: (row) => row.orderCount || 0,
  },
  {
    key: "pending",
    label: "Pending",
    tone: tones.orange,
    value: (row) => row.pendingValue || 0,
    count: (row) => row.pendingOrderCount || 0,
  },
  {
    key: "processing",
    label: "Processing",
    tone: tones.blue,
    value: (row) => row.processingValue || 0,
    count: (row) => row.processingOrderCount || 0,
  },
  {
    key: "onHold",
    label: "On hold",
    tone: tones.purple,
    value: (row) => row.onHoldValue || 0,
    count: (row) => row.onHoldOrderCount || 0,
  },
  {
    key: "cancelled",
    label: "Cancelled",
    tone: tones.red,
    value: (row) => row.cancelValue || 0,
    count: (row) => row.cancelOrderCount || 0,
  },
];

// Year pills follow the CRM customer-list segment tabs.
const YEAR_TAB_CLASS =
  "inline-flex h-auto flex-none items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-xs font-semibold shadow-none transition-colors data-[state=active]:shadow-none sm:px-4 sm:py-2 sm:text-sm";
const YEAR_TAB_COLORS =
  "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900";
const YEAR_TAB_ACTIVE_COLORS =
  "data-[state=active]:bg-slate-800 data-[state=active]:text-white dark:data-[state=active]:bg-slate-200 dark:data-[state=active]:text-slate-900";

const percentOf = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

/** Whole amounts only — report values never need decimal places. */
const amount = (value: number) => `৳${formatCurrencyEnglish(value || 0, 0)}`;

export default function MonthlyOrderReportList({
  monthlyData,
  availableYears,
  selectedYear,
}: Props) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const yearOptions = useMemo(
    () =>
      availableYears.length > 0 ? availableYears : [new Date().getFullYear()],
    [availableYears]
  );

  const navigate = (query: string) =>
    startTransition(() => router.push(query));

  const handleYearChange = (value: string) =>
    navigate(value === "all" ? "?" : `?year=${value}`);

  const totals = useMemo(
    () =>
      monthlyData.reduce(
        (sum, item) => ({
          allOrders: sum.allOrders + item.allOrderCount,
          allValue: sum.allValue + item.allOrderValue,
          byStatus: STATUS_COLUMNS.reduce(
            (acc, column) => ({
              ...acc,
              [column.key]: {
                value:
                  (acc[column.key]?.value ?? 0) + column.value(item),
                count:
                  (acc[column.key]?.count ?? 0) + column.count(item),
              },
            }),
            {} as Record<string, { value: number; count: number }>
          ),
        }),
        {
          allOrders: 0,
          allValue: 0,
          byStatus: {} as Record<string, { value: number; count: number }>,
        }
      ),
    [monthlyData]
  );

  const statusTotals = (key: string) =>
    totals.byStatus[key] ?? { value: 0, count: 0 };

  const hasData = monthlyData.length > 0;
  const overallCancelRate = percentOf(
    statusTotals("cancelled").count,
    totals.allOrders
  );

  const exportHeaders = [
    "Year",
    "Month",
    "All Orders",
    "All Amount",
    "Delivered",
    "Delivered Amount",
    "Pending",
    "Pending Amount",
    "Processing",
    "Processing Amount",
    "On Hold",
    "On Hold Amount",
    "Cancelled",
    "Cancelled Amount",
    "Cancel Rate (%)",
  ];

  const exportRows = monthlyData.map((item) => [
    item.year,
    item.month,
    item.allOrderCount,
    item.allOrderValue,
    item.orderCount,
    item.totalValue,
    item.pendingOrderCount || 0,
    item.pendingValue || 0,
    item.processingOrderCount || 0,
    item.processingValue || 0,
    item.onHoldOrderCount || 0,
    item.onHoldValue || 0,
    item.cancelOrderCount || 0,
    item.cancelValue || 0,
    percentOf(item.cancelOrderCount, item.allOrderCount),
  ]);

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Monthly Order Summary"
        description={
          selectedYear
            ? `Order mix and revenue for every month of ${selectedYear}.`
            : "Order mix and revenue for every month on record, newest first."
        }
      >
        {hasData && mounted && (
          <>
            <ReportExcelButton
              title="Monthly Order Summary"
              subtitle={selectedYear ? `Year: ${selectedYear}` : "All Years"}
              headers={exportHeaders}
              rows={exportRows}
              summary={[
                { label: "Total Orders", value: String(totals.allOrders) },
                { label: "Total Amount", value: formatCurrencyEnglish(totals.allValue, 0) },
                {
                  label: "Delivered",
                  value: `${statusTotals("delivered").count} (${percentOf(
                    statusTotals("delivered").count,
                    totals.allOrders
                  )}%)`,
                },
                {
                  label: "Cancelled",
                  value: `${statusTotals("cancelled").count} (${overallCancelRate}%)`,
                },
              ]}
              fileName={`monthly-order-report-${selectedYear ?? "all"}`}
            />
            <LazyPdfDownloadLink
              document={
                <MonthlyOrderPDF
                  monthlyData={monthlyData}
                  year={selectedYear}
                  settings={settings}
                />
              }
              fileName={`monthly-order-report-${selectedYear ?? "all"}-${new Date().toISOString().split("T")[0]}.pdf`}
            />
          </>
        )}
      </PageHeader>

      {/* Year filter + refresh */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:flex">
            <CalendarRange className="size-3.5" />
            Year
          </span>
          <Tabs
            value={selectedYear ? String(selectedYear) : "all"}
            onValueChange={handleYearChange}
            className="min-w-0 flex-1"
          >
            <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-none bg-transparent p-0 sm:gap-2 md:w-fit">
              <TabsTrigger
                value="all"
                className={cn(
                  YEAR_TAB_CLASS,
                  YEAR_TAB_COLORS,
                  YEAR_TAB_ACTIVE_COLORS
                )}
              >
                <span className="whitespace-nowrap">All years</span>
              </TabsTrigger>
              {yearOptions.map((year) => (
                <TabsTrigger
                  key={year}
                  value={String(year)}
                  className={cn(
                    YEAR_TAB_CLASS,
                    YEAR_TAB_COLORS,
                    YEAR_TAB_ACTIVE_COLORS
                  )}
                >
                  <span className="tabular-nums">{year}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isPending && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Updating
            </span>
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
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <CalendarX className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              No orders {selectedYear ? `in ${selectedYear}` : "recorded yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              Try another year, or show every month at once.
            </p>
          </div>
          {selectedYear && (
            <Button variant="outline" size="sm" onClick={() => navigate("?")}>
              Show all years
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatsCard
              title="All orders"
              value={amount(totals.allValue)}
              count={String(totals.allOrders)}
              description={`Across ${monthlyData.length} month${monthlyData.length === 1 ? "" : "s"}`}
              icon={ShoppingCart}
              bgColor="blue"
            />
            <StatsCard
              title="Delivered"
              value={amount(statusTotals("delivered").value)}
              count={String(statusTotals("delivered").count)}
              description={`${percentOf(
                statusTotals("delivered").count,
                totals.allOrders
              )}% of all orders`}
              icon={PackageCheck}
              bgColor="green"
            />
            <StatsCard
              title="Pending"
              value={amount(statusTotals("pending").value)}
              count={String(statusTotals("pending").count)}
              description={`${percentOf(
                statusTotals("pending").count,
                totals.allOrders
              )}% awaiting processing`}
              icon={Clock}
              bgColor="orange"
            />
            <StatsCard
              title="Processing"
              value={amount(statusTotals("processing").value)}
              count={String(statusTotals("processing").count)}
              description={`${percentOf(
                statusTotals("processing").count,
                totals.allOrders
              )}% being processed`}
              icon={RefreshCw}
              bgColor="indigo"
            />
            <StatsCard
              title="On hold"
              value={amount(statusTotals("onHold").value)}
              count={String(statusTotals("onHold").count)}
              description={`${percentOf(
                statusTotals("onHold").count,
                totals.allOrders
              )}% temporarily paused`}
              icon={PauseCircle}
              bgColor="amber"
            />
            <StatsCard
              title="Cancelled"
              value={amount(statusTotals("cancelled").value)}
              count={String(statusTotals("cancelled").count)}
              description={`${overallCancelRate}% cancellation rate`}
              icon={XCircle}
              bgColor="red"
            />
          </div>

          {/* Month-by-month breakdown */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Month-by-month breakdown</h3>
                <p className="text-xs text-muted-foreground">
                  Amount / order count · status share of all orders
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {monthlyData.length} month{monthlyData.length === 1 ? "" : "s"}
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Period</TableHead>
                    <TableHead className="text-right">All orders</TableHead>
                    {STATUS_COLUMNS.map((column) => (
                      <TableHead key={column.key} className="text-right">
                        {column.label}
                      </TableHead>
                    ))}
                    <TableHead className="pr-4 text-right">
                      Cancel rate
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((item) => {
                    const cancelRate = percentOf(
                      item.cancelOrderCount,
                      item.allOrderCount
                    );

                    return (
                      <TableRow key={`${item.year}-${item.month}`}>
                        <TableCell className="py-2.5 pl-4">
                          <p className="truncate text-sm font-semibold">
                            {item.month} {item.year}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.allOrderCount} order
                            {item.allOrderCount === 1 ? "" : "s"}
                          </p>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                              {formatCurrencyEnglish(item.allOrderValue, 0)}
                            </span>
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                              / {item.allOrderCount}
                            </span>
                          </div>
                        </TableCell>

                        {STATUS_COLUMNS.map((column) => {
                          const percent = percentOf(
                            column.count(item),
                            item.allOrderCount
                          );

                          return (
                            <TableCell
                              key={column.key}
                              className="min-w-37 text-right"
                            >
                              <div className="flex items-baseline justify-end gap-1.5">
                                <span
                                  className={cn(
                                    "text-sm font-semibold tabular-nums",
                                    column.tone.text
                                  )}
                                >
                                  {formatCurrencyEnglish(column.value(item), 0)}
                                </span>
                                <span className="text-[11px] tabular-nums text-muted-foreground">
                                  / {column.count(item)}
                                </span>
                              </div>
                              <div className="mt-1.5 flex items-center justify-end gap-2">
                                <div className="h-1 min-w-16 max-w-28 flex-1 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      column.tone.bar
                                    )}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span
                                  className={cn(
                                    "rounded px-1 py-px text-[10px] font-semibold tabular-nums",
                                    column.tone.badge
                                  )}
                                >
                                  {percent}%
                                </span>
                              </div>
                            </TableCell>
                          );
                        })}

                        <TableCell className="pr-4 text-right">
                          <PillBadge
                            tone={cancelRate >= 25 ? "red" : "neutral"}
                            className="font-medium tabular-nums"
                          >
                            {cancelRate}%
                          </PillBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrencyEnglish(totals.allValue, 0)}
                      </span>
                      <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
                        / {totals.allOrders}
                      </span>
                    </TableCell>
                    {STATUS_COLUMNS.map((column) => {
                      const total = statusTotals(column.key);
                      return (
                        <TableCell key={column.key} className="text-right">
                          <span
                            className={cn(
                              "text-sm font-bold tabular-nums",
                              column.tone.text
                            )}
                          >
                            {formatCurrencyEnglish(total.value, 0)}
                          </span>
                          <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
                            / {total.count}
                          </span>
                        </TableCell>
                      );
                    })}
                    <TableCell className="pr-4 text-right">
                      <PillBadge
                        tone={overallCancelRate >= 25 ? "red" : "neutral"}
                        className="font-medium tabular-nums"
                      >
                        {overallCancelRate}%
                      </PillBadge>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {monthlyData.map((item) => {
                const statusTotal = STATUS_COLUMNS.reduce(
                  (sum, column) => sum + column.count(item),
                  0
                );
                const cancelRate = percentOf(
                  item.cancelOrderCount,
                  item.allOrderCount
                );

                return (
                  <article
                    key={`${item.year}-${item.month}`}
                    className="p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.month} {item.year}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {amount(item.allOrderValue)} · {item.allOrderCount}{" "}
                          orders
                        </p>
                      </div>
                      <PillBadge
                        tone={cancelRate >= 25 ? "red" : "neutral"}
                        className="shrink-0 font-medium tabular-nums"
                      >
                        {cancelRate}% cancelled
                      </PillBadge>
                    </div>

                    {/* Status mix */}
                    <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      {STATUS_COLUMNS.map((column) => {
                        const share = percentOf(
                          column.count(item),
                          statusTotal || item.allOrderCount
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
                            {formatCurrencyEnglish(column.value(item), 0)}
                            <span className="ml-1 font-normal text-muted-foreground">
                              /{column.count(item)}
                            </span>
                          </span>
                        </div>
                      ))}
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
