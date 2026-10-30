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
import { Input } from "@/components/ui/input";
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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock,
  MapPin,
  PackageCheck,
  PauseCircle,
  RefreshCw,
  Search,
  ShoppingCart,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

interface Summary {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  processingOrders: number;
  onHoldOrders: number;
  totalValue: number;
  deliveredValue: number;
  totalAreas: number;
}

interface AreaRow {
  area: string;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  processingOrders: number;
  onHoldOrders: number;
  totalValue: number;
  deliveredValue: number;
}

interface AreaWiseOrdersListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  areas: AreaRow[];
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
  teal: {
    text: "text-teal-600 dark:text-teal-400",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
    bar: "bg-teal-500",
  },
} as const;

type Tone = (typeof tones)[keyof typeof tones];

type StatusKey = "delivered" | "pending" | "processing" | "onHold" | "cancelled";

interface StatusColumn {
  key: StatusKey;
  label: string;
  tone: Tone;
  count: (row: AreaRow) => number;
}

/** Status breakdown shared by the table columns and the mobile cards. */
const STATUS_COLUMNS: StatusColumn[] = [
  {
    key: "delivered",
    label: "Delivered",
    tone: tones.green,
    count: (row) => row.deliveredOrders || 0,
  },
  {
    key: "pending",
    label: "Pending",
    tone: tones.orange,
    count: (row) => row.pendingOrders || 0,
  },
  {
    key: "processing",
    label: "Processing",
    tone: tones.blue,
    count: (row) => row.processingOrders || 0,
  },
  {
    key: "onHold",
    label: "On hold",
    tone: tones.purple,
    count: (row) => row.onHoldOrders || 0,
  },
  {
    key: "cancelled",
    label: "Cancelled",
    tone: tones.red,
    count: (row) => row.cancelledOrders || 0,
  },
];

type SortKey =
  | "area"
  | "orders"
  | "delivered"
  | "pending"
  | "processing"
  | "onHold"
  | "cancelled"
  | "totalValue"
  | "deliveredValue"
  | "completion";

type SortDir = "asc" | "desc";

/** Whole-amount formatting: reports never show decimal fractions. */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const amount = (value: number) => `৳${formatCurrency(value)}`;

/** Percentage of a whole, rounded — guarded against empty sets. */
const percentOf = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

/**
 * Completion rate. Cancelled orders are excluded from the denominator — they
 * never had a chance to be delivered, so they would punish the rate forever.
 */
const completionOf = (row: AreaRow) =>
  percentOf(row.deliveredOrders, row.totalOrders - row.cancelledOrders);

// Numeric value each sortable column sorts on
const sortValue = (row: AreaRow, key: SortKey): number | string => {
  switch (key) {
    case "area":
      return row.area.toLowerCase();
    case "orders":
      return row.totalOrders;
    case "delivered":
      return row.deliveredOrders;
    case "pending":
      return row.pendingOrders;
    case "processing":
      return row.processingOrders;
    case "onHold":
      return row.onHoldOrders;
    case "cancelled":
      return row.cancelledOrders;
    case "totalValue":
      return row.totalValue;
    case "deliveredValue":
      return row.deliveredValue;
    case "completion":
      return completionOf(row);
  }
};

const emptyTotals = {
  orders: 0,
  delivered: 0,
  pending: 0,
  processing: 0,
  onHold: 0,
  cancelled: 0,
  value: 0,
  deliveredValue: 0,
};

export default function AreaWiseOrdersList({
  fromDate,
  toDate,
  preset,
  summary,
  areas,
}: AreaWiseOrdersListProps) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("orders");
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
      setSortDir(key === "area" ? "asc" : "desc");
    }
  };

  const term = search.trim().toLowerCase();

  const visibleAreas = useMemo(() => {
    const rows = term
      ? areas.filter((a) => a.area.toLowerCase().includes(term))
      : areas;

    return [...rows].sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [areas, term, sortKey, sortDir]);

  const totals = useMemo(
    () =>
      visibleAreas.reduce(
        (acc, a) => ({
          orders: acc.orders + a.totalOrders,
          delivered: acc.delivered + a.deliveredOrders,
          pending: acc.pending + a.pendingOrders,
          processing: acc.processing + a.processingOrders,
          onHold: acc.onHold + a.onHoldOrders,
          cancelled: acc.cancelled + a.cancelledOrders,
          value: acc.value + a.totalValue,
          deliveredValue: acc.deliveredValue + a.deliveredValue,
        }),
        { ...emptyTotals }
      ),
    [visibleAreas]
  );

  const exportHeaders = [
    "Area",
    "Orders",
    "Delivered",
    "Pending",
    "Processing",
    "On Hold",
    "Cancelled",
    "Order Value",
    "Delivered Value",
  ];

  const pdfRows = areas.map((a) => [
    a.area,
    a.totalOrders,
    a.deliveredOrders,
    a.pendingOrders,
    a.processingOrders,
    a.onHoldOrders,
    a.cancelledOrders,
    formatCurrencyEnglish(a.totalValue),
    formatCurrencyEnglish(a.deliveredValue),
  ]);

  const pdfSummary = [
    { label: "Total Orders", value: String(summary?.totalOrders ?? 0) },
    { label: "Areas", value: String(summary?.totalAreas ?? 0) },
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
    { label: "Order Value", value: formatCurrencyEnglish(summary?.totalValue ?? 0) },
    {
      label: "Delivered Value",
      value: formatCurrencyEnglish(summary?.deliveredValue ?? 0),
    },
  ];

  const hasData = areas.length > 0;
  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const overallCompletion = percentOf(
    totals.delivered,
    totals.orders - totals.cancelled
  );

  // Footer figures per status, so the total row can't drift from the columns.
  const totalByStatus: Record<StatusKey, number> = {
    delivered: totals.delivered,
    pending: totals.pending,
    processing: totals.processing,
    onHold: totals.onHold,
    cancelled: totals.cancelled,
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Area-wise orders"
        description={`Orders, deliveries and cancellations grouped by delivery area — ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()}.`}
      >
        {hasData && mounted && (
          <>
            <ReportExcelButton
              title="Area Wise Order Report"
              subtitle={rangeLabel}
              headers={exportHeaders}
              rows={pdfRows}
              summary={pdfSummary}
              fileName="area-wise-order-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Area Wise Order Report"
                  orientation="landscape"
                  headers={exportHeaders}
                  flexes={[1.5, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 1.1, 1.1]}
                  alignRight={[1, 2, 3, 4, 5, 6, 7, 8]}
                  rows={pdfRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`area-wise-order-report-${
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
            <MapPin className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No orders in this period</p>
            <p className="text-xs text-muted-foreground">
              Pick a wider date range to see how deliveries spread across
              areas.
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
          {/* Headline numbers */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
            <StatsCard
              title="Orders"
              value={totals.orders.toLocaleString("en-US")}
              description={`Across ${summary?.totalAreas ?? areas.length} area${
                (summary?.totalAreas ?? areas.length) === 1 ? "" : "s"
              }`}
              icon={ShoppingCart}
              bgColor="blue"
            />
            <StatsCard
              title="Order value"
              value={amount(totals.value)}
              description="All orders in range"
              icon={Wallet}
              bgColor="violet"
            />
            <StatsCard
              title="Delivered"
              value={amount(totals.deliveredValue)}
              count={totals.delivered.toLocaleString("en-US")}
              description={`${percentOf(
                totals.delivered,
                totals.orders
              )}% of all orders`}
              icon={PackageCheck}
              bgColor="green"
            />
            <StatsCard
              title="Pending"
              value={totals.pending.toLocaleString("en-US")}
              description={`${percentOf(
                totals.pending,
                totals.orders
              )}% awaiting processing`}
              icon={Clock}
              bgColor="orange"
            />
            <StatsCard
              title="Processing"
              value={totals.processing.toLocaleString("en-US")}
              description={`${percentOf(
                totals.processing,
                totals.orders
              )}% being processed`}
              icon={RefreshCw}
              bgColor="indigo"
            />
            <StatsCard
              title="On hold"
              value={totals.onHold.toLocaleString("en-US")}
              description={`${percentOf(
                totals.onHold,
                totals.orders
              )}% temporarily paused`}
              icon={PauseCircle}
              bgColor="amber"
            />
            <StatsCard
              title="Cancelled"
              value={totals.cancelled.toLocaleString("en-US")}
              description={`${percentOf(
                totals.cancelled,
                totals.orders
              )}% cancellation rate`}
              icon={XCircle}
              bgColor="red"
            />
            <StatsCard
              title="Completion"
              value={`${overallCompletion}%`}
              description="Delivered of non-cancelled orders"
              icon={PackageCheck}
              bgColor="teal"
            />
          </div>

          {/* Orders by area */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Orders by area</h3>
                <p className="text-xs text-muted-foreground">
                  Count and share of delivery status · amount in ৳
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search area…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-40 pl-8 text-xs sm:w-56"
                  />
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {term
                    ? `${visibleAreas.length} of ${areas.length}`
                    : `${areas.length} area${areas.length === 1 ? "" : "s"}`}
                </PillBadge>
              </div>
            </div>

            {visibleAreas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
                <p className="text-sm font-semibold">
                  No areas match &ldquo;{search.trim()}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground">
                  Try a shorter search, or clear it to see every area.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearch("")}
                >
                  <X className="size-3.5" />
                  Clear search
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <SortableHead
                          label="Area"
                          sortKeyValue="area"
                          onSort={toggleSort}
                          activeKey={sortKey}
                          dir={sortDir}
                          align="left"
                          className="pl-4"
                        />
                        <SortableHead
                          label="Orders"
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
                          label="Order value"
                          sortKeyValue="totalValue"
                          onSort={toggleSort}
                          activeKey={sortKey}
                          dir={sortDir}
                        />
                        <SortableHead
                          label="Delivered value"
                          sortKeyValue="deliveredValue"
                          onSort={toggleSort}
                          activeKey={sortKey}
                          dir={sortDir}
                        />
                        <SortableHead
                          label="Completion"
                          sortKeyValue="completion"
                          onSort={toggleSort}
                          activeKey={sortKey}
                          dir={sortDir}
                          className="pr-4"
                        />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleAreas.map((row) => (
                        <TableRow key={row.area}>
                          <TableCell className="py-2.5 pl-4">
                            <Link
                              href={`/admin/orders?area=${encodeURIComponent(
                                row.area
                              )}`}
                              className="block max-w-44 truncate text-sm font-semibold hover:text-primaryColor hover:underline"
                              title={row.area}
                            >
                              {row.area}
                            </Link>
                            <p className="text-[11px] text-muted-foreground">
                              {percentOf(row.totalOrders, totals.orders)}% of
                              orders
                            </p>
                          </TableCell>

                          <TableCell className="text-right">
                            <span className="text-sm font-semibold tabular-nums">
                              {row.totalOrders.toLocaleString("en-US")}
                            </span>
                          </TableCell>

                          {STATUS_COLUMNS.map((column) => (
                            <StatusCountCell
                              key={column.key}
                              count={column.count(row)}
                              percent={percentOf(
                                column.count(row),
                                row.totalOrders
                              )}
                              tone={column.tone}
                            />
                          ))}

                          <TableCell className="text-right">
                            <span className="text-sm font-semibold tabular-nums">
                              {formatCurrency(row.totalValue)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                "text-sm font-semibold tabular-nums",
                                tones.teal.text
                              )}
                            >
                              {formatCurrency(row.deliveredValue)}
                            </span>
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <CompletionPill percent={completionOf(row)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Total
                          {term ? (
                            <span className="ml-1 normal-case tracking-normal">
                              (filtered)
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold tabular-nums">
                            {totals.orders.toLocaleString("en-US")}
                          </span>
                        </TableCell>
                        {STATUS_COLUMNS.map((column) => (
                          <TableCell key={column.key} className="text-right">
                            <span
                              className={cn(
                                "text-sm font-bold tabular-nums",
                                column.tone.text
                              )}
                            >
                              {totalByStatus[
                                column.key
                              ].toLocaleString("en-US")}
                            </span>
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <span className="text-sm font-bold tabular-nums">
                            {formatCurrency(totals.value)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "text-sm font-bold tabular-nums",
                              tones.teal.text
                            )}
                          >
                            {formatCurrency(totals.deliveredValue)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <CompletionPill percent={overallCompletion} />
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="divide-y md:hidden">
                  {visibleAreas.map((row) => (
                    <article key={row.area} className="p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/admin/orders?area=${encodeURIComponent(
                              row.area
                            )}`}
                            className="block truncate text-sm font-semibold hover:text-primaryColor hover:underline"
                          >
                            {row.area}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {row.totalOrders} order
                            {row.totalOrders === 1 ? "" : "s"} ·{" "}
                            {amount(row.totalValue)}
                          </p>
                        </div>
                        <CompletionPill
                          percent={completionOf(row)}
                          className="shrink-0"
                        />
                      </div>

                      {/* Status mix */}
                      <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        {STATUS_COLUMNS.map((column) => {
                          const share = percentOf(
                            column.count(row),
                            row.totalOrders
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
                              {column.count(row)}
                              <span className="ml-1 font-normal text-muted-foreground">
                                {percentOf(column.count(row), row.totalOrders)}%
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-xs">
                        <span className="text-muted-foreground">
                          Delivered value{" "}
                          <span
                            className={cn("font-semibold", tones.teal.text)}
                          >
                            {amount(row.deliveredValue)}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          Order value{" "}
                          <span className="font-semibold text-foreground">
                            {amount(row.totalValue)}
                          </span>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Count cell with a share bar and percentage chip. */
function StatusCountCell({
  count,
  percent,
  tone,
}: {
  count: number;
  percent: number;
  tone: Tone;
}) {
  return (
    <TableCell className="min-w-28 text-right">
      <span className={cn("text-sm font-semibold tabular-nums", tone.text)}>
        {count}
      </span>
      <div className="mt-1.5 flex items-center justify-end gap-2">
        <div className="h-1 min-w-12 max-w-24 flex-1 overflow-hidden rounded-full bg-muted">
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

/** Completion rate pill — green when healthy, red when most orders stall. */
function CompletionPill({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const tone = percent >= 75 ? "emerald" : percent >= 40 ? "amber" : "red";

  return (
    <PillBadge tone={tone} className={cn("tabular-nums", className)}>
      {percent}%
    </PillBadge>
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
    <TableHead className={cn(align === "right" && "text-right", className)}>
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
