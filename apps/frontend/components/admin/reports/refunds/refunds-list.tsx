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
import {
  PAYMENT_STATUS_TONE,
  PillBadge,
} from "@/components/common/pill-badge";
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
  Ban,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface Summary {
  cancelledOrders: number;
  cancelledValue: number;
  refundedAmount: number;
}

interface RefundOrder {
  id: number;
  orderNo: string;
  date: string;
  totalValue: number;
  paidAmount: number;
  paymentStatus: string;
  reason: string | null;
  refundedAmount: number;
}

interface RefundsListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  orders: RefundOrder[];
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

const humanize = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function RefundsList({
  fromDate,
  toDate,
  preset,
  summary,
  orders,
}: RefundsListProps) {
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
  const hasData = orders.length > 0;

  const totalValue = summary?.cancelledValue ?? 0;
  const totalPaid = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const totalRefunded = orders.reduce(
    (sum, o) => sum + (o.refundedAmount || 0),
    0
  );

  const pdfRows = orders.map((o) => [
    o.date,
    o.orderNo,
    formatMoney(o.totalValue),
    formatMoney(o.paidAmount),
    formatMoney(o.refundedAmount),
    o.paymentStatus,
    o.reason ?? "—",
  ]);

  const pdfSummary = [
    { label: "Cancelled Orders", value: String(summary?.cancelledOrders ?? 0) },
    { label: "Cancelled Value", value: formatMoney(totalValue) },
    {
      label: "Refunded Amount",
      value: formatMoney(summary?.refundedAmount ?? 0),
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Refund & Cancelled Orders Report"
        description={`Cancelled orders in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()} — payment status, reason and refunds.`}
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Refund & Cancelled Orders Report"
              subtitle={rangeLabel}
              headers={[
                "Date",
                "Order No",
                "Value",
                "Paid",
                "Refunded",
                "Payment Status",
                "Reason",
              ]}
              rows={pdfRows}
              summary={pdfSummary}
              fileName="refund-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Refund & Cancelled Orders Report"
                  headers={[
                    "Date",
                    "Order No",
                    "Value",
                    "Paid",
                    "Refunded",
                    "Payment Status",
                    "Reason",
                  ]}
                  flexes={[1.1, 1.3, 0.9, 0.9, 0.9, 1.2, 1.8]}
                  alignRight={[2, 3, 4]}
                  rows={pdfRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`refund-report-${new Date()
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
            <Ban className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No cancellations in this range</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range to see cancelled orders.
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
              icon={Ban}
              title="Cancelled orders"
              value={summary?.cancelledOrders ?? 0}
              description={`Cancellations in ${rangeLabel
                .replace(/^Period: /, "")
                .toLowerCase()}`}
              bgColor="red"
            />
            <StatsCard
              icon={AlertTriangle}
              title="Cancelled value"
              value={amount(totalValue)}
              description="Value of the cancelled orders"
              bgColor="amber"
            />
            <StatsCard
              icon={RotateCcw}
              title="Refunded amount"
              value={amount(summary?.refundedAmount ?? 0)}
              description={`${orders.length} order${
                orders.length === 1 ? "" : "s"
              } reviewed`}
              bgColor="purple"
            />
          </div>

          {/* Cancelled orders */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Cancelled orders</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · sorted by date
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {orders.length} row{orders.length === 1 ? "" : "s"}
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Order</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="w-full min-w-64">Reason</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="pr-4 text-right">Refunded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="py-2.5 pl-4">
                        <Link
                          href={`/admin/order/${o.id}/view`}
                          className="text-sm font-semibold text-foreground hover:text-primaryColor hover:underline"
                        >
                          {o.orderNo}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">
                          {o.date}
                        </p>
                      </TableCell>

                      <TableCell>
                        <PillBadge
                          tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? "neutral"}
                        >
                          {humanize(o.paymentStatus)}
                        </PillBadge>
                      </TableCell>

                      {/* Reason is the actionable part of this report, so it gets
                          the slack: it wraps over a few lines instead of being
                          clipped to a single truncated line. */}
                      <TableCell className="w-full min-w-64 whitespace-normal">
                        <p
                          className="line-clamp-4 text-sm leading-snug wrap-break-word text-muted-foreground"
                          title={o.reason || undefined}
                        >
                          {o.reason || "—"}
                        </p>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(o.totalValue)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                          {bare(o.paidAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            o.refundedAmount > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {bare(o.refundedAmount)}
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
                    <TableCell colSpan={2} />
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(totalValue)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums text-teal-600 dark:text-teal-400">
                        {bare(totalPaid)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <span className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                        {bare(totalRefunded)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {orders.map((o) => (
                <article key={o.id} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/order/${o.id}/view`}
                        className="text-sm font-semibold hover:text-primaryColor hover:underline"
                      >
                        {o.orderNo}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{o.date}</p>
                    </div>
                    <PillBadge
                      tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? "neutral"}
                      className="shrink-0"
                    >
                      {humanize(o.paymentStatus)}
                    </PillBadge>
                  </div>

                  {o.reason && (
                    <p className="line-clamp-4 text-xs leading-snug wrap-break-word text-muted-foreground">
                      {o.reason}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Value
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(o.totalValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Paid
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                        {amount(o.paidAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Refunded
                      </p>
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          o.refundedAmount > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {amount(o.refundedAmount)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <div className="border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing all {orders.length} cancelled order
                {orders.length === 1 ? "" : "s"} in this range
                {summary && summary.refundedAmount > 0 && (
                  <> · {amount(summary.refundedAmount)} refunded</>
                )}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
