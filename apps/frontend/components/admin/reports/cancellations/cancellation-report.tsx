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
import { PillBadge, PAYMENT_STATUS_TONE } from "@/components/common/pill-badge";
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
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import {
  BadgeX,
  CalendarX2,
  CircleDollarSign,
  ShoppingCart,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface BreakdownRow {
  name: string;
  totalOrders: number;
  cancelledOrders: number;
  cancelRate: number;
  lostValue: number;
}

interface RecentCancellation {
  id: number;
  orderNo: string;
  customerName: string;
  mobileNumber: string | null;
  area: string;
  method: string;
  totalValue: number;
  paidAmount: number;
  paymentStatus: string;
  placedAt: string;
  cancelledAt: string;
  cancelHours: number | null;
}

interface Summary {
  totalOrders: number;
  cancelledOrders: number;
  cancelRate: number;
  lostValue: number;
  paidOnCancelled: number;
  avgCancelHours: number;
  sameDayCancellations: number;
}

interface CancellationReportProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  byMethod: BreakdownRow[];
  byArea: BreakdownRow[];
  recent: RecentCancellation[];
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

const EXPORT_HEADERS = [
  "Order No",
  "Customer",
  "Mobile",
  "Area",
  "Method",
  "Order Value",
  "Paid",
  "Placed At",
  "Cancelled At",
  "Hours To Cancel",
];

export default function CancellationReport({
  fromDate,
  toDate,
  preset,
  summary,
  byMethod,
  byArea,
  recent,
}: CancellationReportProps) {
  const router = useRouter();
  // Business Settings feed the PDF's company header block.
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);

    // An empty filter set means "clear".
    if (!qs.toString()) {
      startTransition(() => router.push("?"));
      return;
    }

    startTransition(() => router.push(`?${qs.toString()}`));
  };

  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const hasData = summary != null && summary.totalOrders > 0;

  // Recent cancelled orders drive the Excel/PDF exports.
  const exportRows: (string | number)[][] = recent.map((r) => [
    r.orderNo,
    r.customerName,
    r.mobileNumber ?? "-",
    r.area,
    r.method,
    formatMoney(r.totalValue),
    formatMoney(r.paidAmount),
    formatDateTime(r.placedAt),
    formatDateTime(r.cancelledAt),
    r.cancelHours != null ? Math.round(r.cancelHours) : "-",
  ]);

  const exportSummary = [
    { label: "Orders", value: (summary?.totalOrders ?? 0).toLocaleString("en-US") },
    {
      label: "Cancelled",
      value: (summary?.cancelledOrders ?? 0).toLocaleString("en-US"),
    },
    { label: "Cancel Rate", value: `${summary?.cancelRate ?? 0}%` },
    { label: "Lost Value", value: formatMoney(summary?.lostValue ?? 0) },
    {
      label: "Paid On Cancelled",
      value: formatMoney(summary?.paidOnCancelled ?? 0),
    },
  ];

  const breakdownTable = (
    title: string,
    note: string,
    rows: BreakdownRow[],
    labelHeader: string,
  ) => {
    const totalCancelled = rows.reduce((s, r) => s + r.cancelledOrders, 0);
    const totalOrdersAll = rows.reduce((s, r) => s + r.totalOrders, 0);
    const totalLost = rows.reduce((s, r) => s + r.lostValue, 0);

    return (
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{note}</p>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <Table className="report-table">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">{labelHeader}</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Cancelled</TableHead>
                <TableHead className="text-right">Cancel Rate</TableHead>
                <TableHead className="pr-4 text-right">Lost Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="py-2 pl-4">
                    <span className="truncate text-sm font-medium capitalize">
                      {r.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm tabular-nums">
                      {r.totalOrders.toLocaleString("en-US")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <PillBadge
                      tone={r.cancelledOrders > 0 ? "red" : "emerald"}
                      className="font-medium tabular-nums"
                    >
                      {r.cancelledOrders.toLocaleString("en-US")}
                    </PillBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        r.cancelRate >= 10
                          ? "text-red-600 dark:text-red-400"
                          : r.cancelRate >= 5
                            ? "text-amber-600 dark:text-amber-400"
                            : ""
                      }`}
                    >
                      {r.cancelRate}%
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <span className="text-sm font-semibold tabular-nums">
                      {bare(r.lostValue)}
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
                <TableCell className="text-right">
                  <span className="text-sm font-bold tabular-nums">
                    {totalOrdersAll.toLocaleString("en-US")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-bold tabular-nums">
                    {totalCancelled.toLocaleString("en-US")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-bold tabular-nums">
                    {totalOrdersAll
                      ? Math.round((totalCancelled / totalOrdersAll) * 100)
                      : 0}
                    %
                  </span>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <span className="text-sm font-bold tabular-nums">
                    {bare(totalLost)}
                  </span>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Mobile */}
        <div className="divide-y md:hidden">
          {rows.map((r) => (
            <article
              key={r.name}
              className="flex items-center justify-between gap-3 p-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold capitalize">
                  {r.name}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {r.totalOrders.toLocaleString("en-US")} orders · lost{" "}
                  {amount(r.lostValue)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <PillBadge
                  tone={r.cancelledOrders > 0 ? "red" : "emerald"}
                  className="font-medium tabular-nums"
                >
                  {r.cancelledOrders} cancelled
                </PillBadge>
                <PillBadge
                  tone={r.cancelRate >= 10 ? "red" : "neutral"}
                  className="font-medium tabular-nums"
                >
                  {r.cancelRate}%
                </PillBadge>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Cancellation Report"
        description={`Why orders die — cancellation rate, lost value and the latest cancellations in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()}.`}
      >
        {mounted && recent.length > 0 && (
          <>
            <ReportExcelButton
              title="Cancellation Report"
              subtitle={rangeLabel}
              headers={EXPORT_HEADERS}
              rows={exportRows}
              summary={exportSummary}
              fileName="cancellation-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Cancellation Report"
                  orientation="landscape"
                  headers={EXPORT_HEADERS}
                  flexes={[1, 1.3, 1.1, 1, 1.1, 1, 0.9, 1.4, 1.4, 1.2]}
                  alignRight={[5, 6, 9]}
                  rows={exportRows}
                  summary={exportSummary}
                  settings={settings}
                />
              }
              fileName={`cancellation-report-${new Date()
                .toISOString()
                .split("T")[0]}.pdf`}
            />
          </>
        )}
      </PageHeader>

      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={handleFilterApply}
        className="mb-4"
      />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <BadgeX className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No orders in this range</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range to see cancellations.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startTransition(() => router.push("?preset=this_year"))}
          >
            Search this year
          </Button>
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <StatsCard
              icon={ShoppingCart}
              title="Orders"
              value={(summary?.totalOrders ?? 0).toLocaleString("en-US")}
              description={`Placed in ${rangeLabel
                .replace(/^Period: /, "")
                .toLowerCase()}`}
              bgColor="blue"
            />
            <StatsCard
              icon={BadgeX}
              title="Cancelled"
              value={(summary?.cancelledOrders ?? 0).toLocaleString("en-US")}
              description={`${(
                summary?.sameDayCancellations ?? 0
              ).toLocaleString("en-US")} within 24h of placing`}
              bgColor="red"
            />
            <StatsCard
              icon={CalendarX2}
              title="Cancel rate"
              value={`${summary?.cancelRate ?? 0}%`}
              description="Cancelled ÷ placed"
              bgColor="orange"
            />
            <StatsCard
              icon={CircleDollarSign}
              title="Lost value"
              value={amount(summary?.lostValue ?? 0)}
              description="Value of cancelled orders"
              bgColor="purple"
            />
            <StatsCard
              icon={Timer}
              title="Avg time to cancel"
              value={`${summary?.avgCancelHours ?? 0}h`}
              description={`৳${bare(summary?.paidOnCancelled ?? 0)} paid needs refund`}
              bgColor="teal"
            />
          </div>

          <div className="space-y-4">
            {breakdownTable(
              "By shipping method",
              "Worst cancellation rates first",
              byMethod,
              "Shipping Method",
            )}
            {breakdownTable(
              "By area",
              "Worst cancellation rates first",
              byArea,
              "Area",
            )}
          </div>

          {/* Recent cancellations */}
          {recent.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">
                    Recent cancellations
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Latest 50 · click a row to open the order
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {recent.length} row{recent.length === 1 ? "" : "s"}
                </PillBadge>
              </div>

              {/* Desktop */}
              <div className="hidden md:block">
                <Table className="report-table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Placed</TableHead>
                      <TableHead className="text-right">Cancelled</TableHead>
                      <TableHead className="pr-4 text-right">After</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/order/${r.orderNo}/view`)}
                      >
                        <TableCell className="py-2 pl-4">
                          <span className="text-sm font-medium">{r.orderNo}</span>
                        </TableCell>
                        <TableCell>
                          <span className="block truncate text-sm">
                            {r.customerName}
                          </span>
                        </TableCell>
                        <TableCell>
                          {r.mobileNumber ? (
                            <a
                              href={`tel:${r.mobileNumber}`}
                              onClick={(event) => event.stopPropagation()}
                              className="text-sm whitespace-nowrap text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {r.mobileNumber}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No mobile
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="truncate text-sm capitalize">
                            {r.area}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="truncate text-sm capitalize">
                            {r.method}
                          </span>
                        </TableCell>
                        <TableCell>
                          <PillBadge
                            tone={
                              PAYMENT_STATUS_TONE[r.paymentStatus] ?? "neutral"
                            }
                            className="capitalize"
                          >
                            {(r.paymentStatus || "unknown").replace(/_/g, " ")}
                          </PillBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            {bare(r.totalValue)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                            {formatDateTime(r.placedAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                            {formatDateTime(r.cancelledAt)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              r.cancelHours != null && r.cancelHours < 24
                                ? "text-red-600 dark:text-red-400"
                                : ""
                            }`}
                          >
                            {r.cancelHours != null
                              ? `${Math.round(r.cancelHours)}h`
                              : "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="divide-y md:hidden">
                {recent.map((r) => (
                  <Link
                    key={r.id}
                    href={`/admin/order/${r.orderNo}/view`}
                    className="block space-y-2 p-3.5 hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {r.orderNo}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.customerName}
                          {r.mobileNumber ? ` · ${r.mobileNumber}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {amount(r.totalValue)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <PillBadge
                        tone={PAYMENT_STATUS_TONE[r.paymentStatus] ?? "neutral"}
                        className="capitalize"
                      >
                        {(r.paymentStatus || "unknown").replace(/_/g, " ")}
                      </PillBadge>
                      <PillBadge tone="neutral" className="capitalize">
                        {r.area}
                      </PillBadge>
                      <PillBadge tone="blue" className="capitalize">
                        {r.method}
                      </PillBadge>
                      {r.cancelHours != null && (
                        <PillBadge
                          tone={r.cancelHours < 24 ? "red" : "neutral"}
                          className="tabular-nums"
                        >
                          cancelled after {Math.round(r.cancelHours)}h
                        </PillBadge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Placed {formatDateTime(r.placedAt)} · Cancelled{" "}
                      {formatDateTime(r.cancelledAt)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
