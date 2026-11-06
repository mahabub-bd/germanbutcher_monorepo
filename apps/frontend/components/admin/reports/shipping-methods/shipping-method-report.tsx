"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { ReportExcelButton } from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { ReportDateFilters } from "@/components/admin/reports/report-date-filters";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import { PillBadge } from "@/components/common/pill-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyEnglish } from "@/lib/utils";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import {
  getShippingMethodColor,
  getShippingMethodIcon,
} from "@/utils/order-helper";
import {
  AlarmClockOff,
  Clock,
  PackageCheck,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface MethodRow {
  name: string;
  code: string;
  orders: number;
  pendingOrders: number;
  processingOrders: number;
  onHoldOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalValue: number;
  avgHours: number;
  lateDeliveries: number;
}

interface Summary {
  totalOrders: number;
  totalDelivered: number;
  totalLate: number;
  lateRate: number;
  totalValue: number;
  avgOrderValue: number;
  methodCount: number;
}

interface ShippingMethodReportProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  methods: MethodRow[];
}

/** Whole amounts only — report values never need decimal places. */
const bare = (value: number) => formatCurrencyEnglish(value || 0, 0);
/** @react-pdf's built-in fonts have no ৳ glyph, so exports use "BDT ". */
const formatMoney = (value: number) =>
  `BDT ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

/** Per-method timelines — mirrors the late-delivery report's rules. */
const THRESHOLD_NOTE = "Inside 48h · Outside 5 days · Express 6h";

export default function ShippingMethodReport({
  fromDate,
  toDate,
  preset,
  summary,
  methods,
}: ShippingMethodReportProps) {
  const router = useRouter();
  // Business Settings feed the PDF's company header block.
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const rangeLabel = `Period: ${preset ?? ""}`.trim();

  // Shared by the Excel and PDF exports next to the page title.
  const exportRows: (string | number)[][] = methods.map((m) => [
    m.name,
    m.orders,
    m.pendingOrders,
    m.processingOrders,
    m.onHoldOrders,
    m.shippedOrders,
    m.deliveredOrders,
    m.cancelledOrders,
    formatMoney(m.totalValue),
    m.deliveredOrders > 0 ? m.avgHours : "",
    m.lateDeliveries,
  ]);
  const exportSummary = [
    { label: "Orders", value: String(summary?.totalOrders ?? 0) },
    { label: "Delivered", value: String(summary?.totalDelivered ?? 0) },
    { label: "Late", value: String(summary?.totalLate ?? 0) },
    { label: "Late rate", value: `${summary?.lateRate ?? 0}%` },
    { label: "Threshold", value: THRESHOLD_NOTE },
  ];
  const EXPORT_HEADERS = [
    "Shipping Method",
    "Orders",
    "Pending",
    "Processing",
    "On Hold",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Order Value",
    "Avg Hours",
    "Late",
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const applyFilters = useCallback(
    (params: { preset?: string; fromDate?: string; toDate?: string }) => {
      const query = new URLSearchParams();
      if (params.preset) query.set("preset", params.preset);
      if (params.fromDate) query.set("fromDate", params.fromDate);
      if (params.toDate) query.set("toDate", params.toDate);
      router.push(`/admin/reports/shipping-methods?${query.toString()}`);
    },
    [router]
  );

  // Re-fetch on mount so the browser bfcache doesn't show stale numbers
  // after switching pages — the server page already loaded fresh data.
  useEffect(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="w-full">
      <PageHeader
        title="Shipping Method Report"
        description={`Orders, value and delivery performance per shipping method. Timelines: ${THRESHOLD_NOTE}.`}
      >
        {mounted && methods.length > 0 && (
          <>
            <ReportExcelButton
              title="Shipping Method Report"
              subtitle={rangeLabel}
              headers={EXPORT_HEADERS}
              rows={exportRows}
              summary={exportSummary}
              fileName="shipping-method-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Shipping Method Report"
                  orientation="landscape"
                  headers={EXPORT_HEADERS}
                  flexes={[1.6, 0.8, 0.8, 0.9, 0.8, 0.8, 0.9, 0.9, 1.1, 0.8, 0.7]}
                  alignRight={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                  rows={exportRows}
                  summary={exportSummary}
                  settings={settings}
                />
              }
              fileName="shipping-method-report.pdf"
            />
          </>
        )}
      </PageHeader>

      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={applyFilters}
        className="mb-4"
      />

      {methods.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          No shipping-method data for this range.
        </p>
      ) : (
        <>
          {/* Summary stats */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <StatsCard
              icon={ShoppingCart}
              title="Orders"
              value={(summary?.totalOrders ?? 0).toLocaleString("en-US")}
              description="Placed in the selected range"
              bgColor="blue"
            />
            <StatsCard
              icon={PackageCheck}
              title="Delivered"
              value={(summary?.totalDelivered ?? 0).toLocaleString("en-US")}
              description="Across all methods"
              bgColor="green"
            />
            <StatsCard
              icon={AlarmClockOff}
              title="Late deliveries"
              value={(summary?.totalLate ?? 0).toLocaleString("en-US")}
              description={`After each method's timeline`}
              bgColor="red"
            />
            <StatsCard
              icon={TrendingDown}
              title="Late rate"
              value={`${summary?.lateRate ?? 0}%`}
              description="Late ÷ delivered"
              bgColor="orange"
            />
            <StatsCard
              icon={Clock}
              title="Order value"
              value={bare(summary?.totalValue ?? 0)}
              description="Sum of placed order value"
              bgColor="purple"
            />
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-xl border bg-card shadow-xs">
            <Table className="report-table table-fixed [&_td]:px-1.5 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-1.5 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[15%]">Method</TableHead>
                  <TableHead className="w-[8%] text-center">Orders</TableHead>
                  <TableHead className="w-[7%] text-center">Pending</TableHead>
                  <TableHead className="w-[8%] text-center">Processing</TableHead>
                  <TableHead className="w-[7%] text-center">On Hold</TableHead>
                  <TableHead className="w-[7%] text-center">Shipped</TableHead>
                  <TableHead className="w-[8%] text-center">Delivered</TableHead>
                  <TableHead className="w-[8%] text-center">Cancelled</TableHead>
                  <TableHead className="w-[10%] text-right">Value</TableHead>
                  <TableHead className="w-[8%] text-right">Avg Hours</TableHead>
                  <TableHead className="w-[8%] text-right pr-4">Late</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((m) => {
                  const lateRate =
                    m.deliveredOrders > 0
                      ? Math.round((m.lateDeliveries / m.deliveredOrders) * 100)
                      : 0;
                  return (
                    <TableRow key={m.code || m.name}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          title={m.name}
                          className={`capitalize max-w-52 truncate ${getShippingMethodColor(m.name)}`}
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            {getShippingMethodIcon(m.name || "")}
                            <span className="truncate">{m.name}</span>
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold tabular-nums">
                          {m.orders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm tabular-nums">
                          {m.pendingOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm tabular-nums">
                          {m.processingOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm tabular-nums">
                          {m.onHoldOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm tabular-nums">
                          {m.shippedOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold tabular-nums">
                          {m.deliveredOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {m.cancelledOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(m.totalValue)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {m.deliveredOrders > 0 ? m.avgHours : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <PillBadge
                          tone={m.lateDeliveries > 0 ? "red" : "emerald"}
                          className="font-medium tabular-nums"
                        >
                          {m.lateDeliveries}
                          {m.deliveredOrders > 0 && ` · ${lateRate}%`}
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
                  <TableCell className="text-center">
                    <span className="text-sm font-bold tabular-nums">
                      {methods
                        .reduce((s, m) => s + m.orders, 0)
                        .toLocaleString("en-US")}
                    </span>
                  </TableCell>
                  {(
                    [
                      "pendingOrders",
                      "processingOrders",
                      "onHoldOrders",
                      "shippedOrders",
                      "deliveredOrders",
                      "cancelledOrders",
                    ] as const
                  ).map((key) => (
                    <TableCell key={key} className="text-center">
                      <span className="text-sm font-bold tabular-nums">
                        {methods
                          .reduce((s, m) => s + m[key], 0)
                          .toLocaleString("en-US")}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <span className="text-sm font-bold tabular-nums">
                      {bare(methods.reduce((s, m) => s + m.totalValue, 0))}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" />
                  <TableCell className="text-right pr-4">
                    <span className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                      {methods.reduce((s, m) => s + m.lateDeliveries, 0)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y rounded-xl border bg-card md:hidden">
            {methods.map((m) => {
              const lateRate =
                m.deliveredOrders > 0
                  ? Math.round((m.lateDeliveries / m.deliveredOrders) * 100)
                  : 0;
              return (
                <article key={m.code || m.name} className="space-y-2.5 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`capitalize ${getShippingMethodColor(m.name)}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {getShippingMethodIcon(m.name || "")}
                        {m.name}
                      </span>
                    </Badge>
                    <PillBadge tone="blue" className="tabular-nums">
                      {m.orders} orders
                    </PillBadge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Delivered
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {m.deliveredOrders}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Late
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                        {m.lateDeliveries} ({lateRate}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Avg hours
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {m.deliveredOrders > 0 ? m.avgHours : "—"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground tabular-nums">
                    Value {bare(m.totalValue)} · Pending {m.pendingOrders} ·
                    Processing {m.processingOrders} · On hold {m.onHoldOrders} ·
                    Shipped {m.shippedOrders} · Cancelled {m.cancelledOrders}
                  </p>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
