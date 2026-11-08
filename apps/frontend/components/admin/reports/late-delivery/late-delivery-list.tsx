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
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import {
  AlarmClockOff,
  PackageCheck,
  Timer,
  TrendingDown,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface DeliveryManRow {
  id: number | null;
  name: string;
  delivered: number;
  late: number;
  avgHours: number;
  worstHours: number;
}

interface LateOrderRow {
  orderId: number;
  orderNo: string;
  customerName: string;
  mobileNumber: string;
  deliveryMan: string;
  shippingMethod?: string | null;
  totalValue: number;
  orderDate: string;
  deliveredAt: string;
  hours: number;
}

interface PendingOrderRow {
  orderId: number;
  orderNo: string;
  status: string;
  customerName: string;
  mobileNumber: string | null;
  deliveryMan: string;
  shippingMethod: string | null;
  totalValue: number;
  orderDate: string;
  hours: number;
}

interface DeliveredOrderRow {
  orderId: number;
  orderNo: string;
  customerName: string;
  mobileNumber: string | null;
  deliveryMan: string;
  shippingMethod: string | null;
  totalValue: number;
  orderDate: string;
  deliveredAt: string;
  hours: number;
}

interface Summary {
  totalDelivered: number;
  totalLate: number;
  lateRate: number;
  onTimeRate: number;
  thresholdHours: number;
  /** Per-method timelines ("Inside Dhaka 48h · Outside Dhaka 5 days · Express 6h"). */
  thresholdNote?: string;
  lateMenCount: number;
}

interface LateDeliveryListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  deliveryMen: DeliveryManRow[];
  lateOrders: LateOrderRow[];
  pendingOrders: PendingOrderRow[];
  deliveredOrders: DeliveredOrderRow[];
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

/** Hours are always shown with one decimal place. */
const hours1 = (value: number) => Number(value || 0).toFixed(1);

/** ≥ 24h reads as days + hours ("5 Day 12 Hours"); under 24h stays in hours. */
const durationLabel = (value: number) => {
  const h = Number(value || 0);
  if (h < 24) return `${hours1(h)} Hours`;
  const days = Math.floor(h / 24);
  const rem = Math.round(h - days * 24);
  const [d, r] = rem === 24 ? [days + 1, 0] : [days, rem];
  const dayPart = `${d} Day${d === 1 ? "" : "s"}`;
  return r > 0 ? `${dayPart} ${r} Hour${r === 1 ? "" : "s"}` : dayPart;
};

export default function LateDeliveryList({
  fromDate,
  toDate,
  preset,
  summary,
  deliveryMen,
  lateOrders,
  pendingOrders,
  deliveredOrders,
}: LateDeliveryListProps) {
  const router = useRouter();
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
    startTransition(() =>
      router.push(qs.toString() ? `?${qs.toString()}` : "?")
    );
  };

  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const thresholdNote =
    summary?.thresholdNote ??
    "Inside Dhaka 48h · Outside Dhaka 5 days · Express 6h";
  const hasData = deliveryMen.length > 0 || lateOrders.length > 0;

  // Column sums for the delivery-men footer.
  const totals = deliveryMen.reduce(
    (acc, dm) => ({
      delivered: acc.delivered + (dm.delivered || 0),
      late: acc.late + (dm.late || 0),
    }),
    { delivered: 0, late: 0 }
  );

  const exportRows: (string | number)[][] = deliveryMen.map((dm) => [
    dm.name,
    dm.delivered,
    dm.late,
    hours1(dm.avgHours),
    hours1(dm.worstHours),
  ]);

  const pendingExportRows = pendingOrders.map((o) => [
    o.orderNo,
    o.status,
    o.customerName,
    o.mobileNumber ?? "",
    o.deliveryMan,
    o.shippingMethod ?? "",
    formatDateTime(o.orderDate),
    durationLabel(o.hours),
    bare(o.totalValue),
  ]);

  const deliveredExportRows = deliveredOrders.map((o) => [
    o.orderNo,
    o.customerName,
    o.mobileNumber ?? "",
    o.deliveryMan,
    o.shippingMethod ?? "",
    formatDateTime(o.orderDate),
    formatDateTime(o.deliveredAt),
    durationLabel(o.hours),
    bare(o.totalValue),
  ]);

  const lateExportRows = lateOrders.map((o) => [
    o.orderNo,
    o.customerName,
    o.deliveryMan || "Unassigned",
    o.shippingMethod ?? "",
    formatDateTime(o.orderDate),
    formatDateTime(o.deliveredAt),
    durationLabel(o.hours),
    bare(o.totalValue),
  ]);

  const pdfSummary = [
    { label: "Total Delivered", value: String(summary?.totalDelivered ?? 0) },
    { label: "Total Late", value: String(summary?.totalLate ?? 0) },
    { label: "Late Rate", value: `${summary?.lateRate ?? 0}%` },
    { label: "Threshold", value: thresholdNote },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Late Delivery Report"
        description={`Delivered after the method's delivery timeline (${thresholdNote}) in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()}.`}
      >
        {mounted && hasData && (
          <>
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Late Delivery Report"
                  headers={[
                    "Delivery Man",
                    "Delivered",
                    "Late",
                    "Avg Hours",
                    "Worst Hours",
                  ]}
                  flexes={[1.5, 1, 0.8, 1, 1.1]}
                  alignRight={[1, 2, 3, 4]}
                  rows={exportRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`late-delivery-report-${new Date()
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
      />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <PackageCheck className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No deliveries found</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range to see delivery performance.
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
              icon={PackageCheck}
              title="Delivered"
              value={(summary?.totalDelivered ?? 0).toLocaleString("en-US")}
              description={`Orders delivered in ${rangeLabel
                .replace(/^Period: /, "")
                .toLowerCase()}`}
              bgColor="green"
            />
            <StatsCard
              icon={AlarmClockOff}
              title="Late"
              value={(summary?.totalLate ?? 0).toLocaleString("en-US")}
              description="Delivered after the method's delivery timeline"
              bgColor="red"
            />
            <StatsCard
              icon={Timer}
              title="On-time rate"
              value={`${summary?.onTimeRate ?? 0}%`}
              description="Deliveries within the threshold"
              bgColor="blue"
            />
            <StatsCard
              icon={TrendingDown}
              title="Late rate"
              value={`${summary?.lateRate ?? 0}%`}
              description="Share of deliveries past the threshold"
              bgColor="orange"
            />
            <StatsCard
              icon={Users}
              title="Men with late deliveries"
              value={(summary?.lateMenCount ?? 0).toLocaleString("en-US")}
              description="Delivery men with at least one late order"
              bgColor="purple"
            />
          </div>

          {/* Delivery men */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Delivery men</h3>
                <p className="text-xs text-muted-foreground">
                  Hours after ordering · thresholds: by shipping method
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PillBadge className="font-medium tabular-nums">
                  {deliveryMen.length} man{deliveryMen.length === 1 ? "" : ""}
                </PillBadge>
                {mounted && (
                  <ReportExcelButton
                    title="Late Delivery Report"
                    subtitle={rangeLabel}
                    headers={[
                      "Delivery Man",
                      "Delivered",
                      "Late",
                      "Avg Hours",
                      "Worst Hours",
                    ]}
                    rows={exportRows}
                    summary={pdfSummary}
                    fileName="late-delivery-report"
                  />
                )}
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Delivery Man</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Late</TableHead>
                    <TableHead className="text-right">Avg Hours</TableHead>
                    <TableHead className="pr-4 text-right">Worst Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryMen.map((dm) => (
                    <TableRow key={dm.id ?? dm.name}>
                      <TableCell className="py-2 pl-4">
                        <span className="text-sm font-medium">{dm.name}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {dm.delivered}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            dm.late > 0
                              ? "text-sm font-semibold tabular-nums text-red-600 dark:text-red-400"
                              : "text-sm font-semibold tabular-nums text-muted-foreground"
                          }
                        >
                          {dm.late}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {hours1(dm.avgHours)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {hours1(dm.worstHours)}
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
                        {(summary?.totalDelivered ?? totals.delivered).toLocaleString(
                          "en-US"
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                        {summary?.totalLate ?? totals.late}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" colSpan={2} />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {deliveryMen.map((dm) => (
                <article key={dm.id ?? dm.name} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{dm.name}</p>
                    {dm.late > 0 ? (
                      <PillBadge tone="red" className="shrink-0">
                        {dm.late} late
                      </PillBadge>
                    ) : (
                      <PillBadge tone="emerald" className="shrink-0">
                        {dm.delivered} on time
                      </PillBadge>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Delivered
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {dm.delivered}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Late
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {dm.late}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Avg hrs
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {hours1(dm.avgHours)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Worst
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {hours1(dm.worstHours)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {deliveryMen.length} delivery man
                {deliveryMen.length === 1 ? "" : ""} in this range
              </p>
            </div>
          </div>

          {/* Slowest deliveries */}
          {lateOrders.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Slowest deliveries</h3>
                  <p className="text-xs text-muted-foreground">
                    Delivered after the method's delivery timeline
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PillBadge tone="red" className="font-medium tabular-nums">
                    {lateOrders.length} order{lateOrders.length === 1 ? "" : "s"}
                  </PillBadge>
                  {mounted && lateExportRows.length > 0 && (
                    <ReportExcelButton
                      title="Slowest Deliveries"
                      subtitle={rangeLabel}
                      headers={[
                        "Order",
                        "Customer",
                        "Delivery Man",
                        "Method",
                        "Placed",
                        "Delivered",
                        "Took",
                        "Value",
                      ]}
                      rows={lateExportRows}
                      summary={[
                        {
                          label: "Late deliveries in range",
                          value: `${lateOrders.length} orders`,
                        },
                      ]}
                      fileName="slowest-deliveries"
                    />
                  )}
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Delivery Man</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Placed</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="pr-4 text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lateOrders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="py-2 pl-4">
                          <Link
                            href={`/admin/order/${order.orderNo}/view`}
                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {order.orderNo}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {order.customerName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {order.deliveryMan || "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {order.shippingMethod || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                            {formatDateTime(order.orderDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                            {formatDateTime(order.deliveredAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                            {durationLabel(order.hours)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            {bare(order.totalValue)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {lateOrders.map((order) => (
                  <article key={order.orderId} className="space-y-2 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/order/${order.orderNo}/view`}
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {order.orderNo}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.customerName}
                        </p>
                      </div>
                      <PillBadge tone="red" className="shrink-0 tabular-nums">
                        {durationLabel(order.hours)}
                      </PillBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.deliveryMan || "Unassigned"} ·{" "}
                      {order.shippingMethod || "—"} ·{" "}
                      {bare(order.totalValue)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Long pending — undelivered past the threshold */}
          {pendingOrders.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Long pending orders</h3>
                  <p className="text-xs text-muted-foreground">
                    Undelivered more than {summary?.thresholdHours ?? 24}h after
                    placement · oldest first
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PillBadge tone="red" className="font-medium tabular-nums">
                    {pendingOrders.length} order{pendingOrders.length === 1 ? "" : "s"}
                  </PillBadge>
                  {mounted && pendingExportRows.length > 0 && (
                    <ReportExcelButton
                      title="Long Pending Orders"
                      subtitle={rangeLabel}
                      headers={[
                        "Order",
                        "Status",
                        "Customer",
                        "Mobile",
                        "Delivery Man",
                        "Method",
                        "Placed",
                        "Waiting",
                        "Value",
                      ]}
                      rows={pendingExportRows}
                      summary={[
                        {
                          label: `Undelivered over ${summary?.thresholdHours ?? 24}h`,
                          value: `${pendingOrders.length} orders`,
                        },
                      ]}
                      fileName="long-pending-orders"
                    />
                  )}
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Delivery Man</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Placed</TableHead>
                      <TableHead className="text-right">Waiting</TableHead>
                      <TableHead className="pr-4 text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="py-2 pl-4">
                          <Link
                            href={`/admin/order/${order.orderNo}/view`}
                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {order.orderNo}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <PillBadge className="capitalize">
                            {order.status.replace("_", " ")}
                          </PillBadge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{order.customerName}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {order.deliveryMan || "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {order.shippingMethod || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                            {formatDateTime(order.orderDate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                            {durationLabel(order.hours)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            {bare(order.totalValue)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {pendingOrders.map((order) => (
                  <article key={order.orderId} className="space-y-2 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/order/${order.orderNo}/view`}
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {order.orderNo}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.customerName}
                        </p>
                      </div>
                      <PillBadge tone="red" className="shrink-0 tabular-nums">
                        {durationLabel(order.hours)}
                      </PillBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.status.replace("_", " ")} ·{" "}
                      {order.deliveryMan || "Unassigned"} · {bare(order.totalValue)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* All delivered orders in range */}
          {deliveredOrders.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Delivered orders</h3>
                  <p className="text-xs text-muted-foreground">
                    All delivered in range · newest first
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PillBadge tone="emerald" className="font-medium tabular-nums">
                    {deliveredOrders.length} order
                    {deliveredOrders.length === 1 ? "" : "s"}
                  </PillBadge>
                  {mounted && deliveredExportRows.length > 0 && (
                    <ReportExcelButton
                      title="Delivered Orders"
                      subtitle={rangeLabel}
                      headers={[
                        "Order",
                        "Customer",
                        "Mobile",
                        "Delivery Man",
                        "Method",
                        "Placed",
                        "Delivered",
                        "Took",
                        "Value",
                      ]}
                      rows={deliveredExportRows}
                      summary={[
                        {
                          label: "Delivered in range",
                          value: `${deliveredOrders.length} orders`,
                        },
                      ]}
                      fileName="delivered-orders"
                    />
                  )}
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Delivery Man</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Placed</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead className="text-right">Took</TableHead>
                      <TableHead className="pr-4 text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveredOrders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="py-2 pl-4">
                          <Link
                            href={`/admin/order/${order.orderNo}/view`}
                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {order.orderNo}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{order.customerName}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {order.deliveryMan || "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {order.shippingMethod || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                            {formatDateTime(order.orderDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                            {formatDateTime(order.deliveredAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            {durationLabel(order.hours)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            {bare(order.totalValue)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {deliveredOrders.map((order) => (
                  <article key={order.orderId} className="space-y-2 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/order/${order.orderNo}/view`}
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {order.orderNo}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.customerName}
                        </p>
                      </div>
                      <PillBadge tone="emerald" className="shrink-0 tabular-nums">
                        {durationLabel(order.hours)}
                      </PillBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.deliveryMan || "Unassigned"} ·{" "}
                      {order.shippingMethod || "—"} · {bare(order.totalValue)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
