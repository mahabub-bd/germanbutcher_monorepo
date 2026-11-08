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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { AlarmClock, Hourglass, PackageCheck, Timer, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

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
  totalLongPending: number;
  totalDelivered: number;
  worstHours: number;
  avgHours: number;
  totalValue: number;
  thresholdHours: number;
  byStatus: { status: string; count: number }[];
}

interface LongPendingListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  orders: PendingOrderRow[];
  deliveredOrders: DeliveredOrderRow[];
}

/** Whole amounts only — report values never need decimal places. */
const bare = (value: number) => formatCurrencyEnglish(value || 0, 0);
/** @react-pdf's built-in fonts have no ৳ glyph, so exports use "BDT ". */
const formatMoney = (value: number) =>
  `BDT ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

/** Hours are always shown with one decimal place. */
const hours1 = (value: number) => Number(value || 0).toFixed(1);

/** ≥ 24h reads as days + hours ("5 Days 12 Hours"); under 24h stays in hours. */
const durationLabel = (value: number) => {
  const h = Number(value || 0);
  if (h < 24) return `${hours1(h)} Hours`;
  const days = Math.floor(h / 24);
  const rem = Math.round(h - days * 24);
  const [d, r] = rem === 24 ? [days + 1, 0] : [days, rem];
  const dayPart = `${d} Day${d === 1 ? "" : "s"}`;
  return r > 0 ? `${dayPart} ${r} Hour${r === 1 ? "" : "s"}` : dayPart;
};

const STATUS_TONES: Record<string, "amber" | "blue" | "orange" | "violet" | "red"> = {
  pending: "amber",
  processing: "blue",
  on_hold: "orange",
  shipped: "violet",
};

export default function LongPendingList({
  fromDate,
  toDate,
  preset,
  summary,
  orders,
  deliveredOrders,
}: LongPendingListProps) {
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
  const threshold = summary?.thresholdHours ?? 24;
  const hasData = orders.length > 0 || deliveredOrders.length > 0;

  const exportRows = orders.map((o) => [
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

  const pdfSummary = [
    { label: "Long pending (>", value: `${summary?.totalLongPending ?? 0} orders` },
    { label: "Delivered in range", value: String(summary?.totalDelivered ?? 0) },
    { label: "Oldest waiting", value: durationLabel(summary?.worstHours ?? 0) },
    { label: "Pending value", value: formatMoney(summary?.totalValue ?? 0) },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Long Pending Report"
        description={`Undelivered orders waiting more than ${threshold}h, plus delivered orders, in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()}.`}
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Long Pending Report"
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
              rows={exportRows}
              summary={pdfSummary}
              fileName="long-pending-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Long Pending Report"
                  headers={[
                    "Order",
                    "Status",
                    "Customer",
                    "Delivery Man",
                    "Placed",
                    "Waiting",
                    "Value",
                  ]}
                  flexes={[1.4, 1, 1.4, 1.2, 1.4, 1, 0.9]}
                  alignRight={[5, 6]}
                  rows={exportRows.map(
                    ([order, status, customer, , man, , placed, waiting, value]) => [
                      order,
                      status,
                      customer,
                      man,
                      placed,
                      waiting,
                      value,
                    ]
                  )}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`long-pending-report-${new Date()
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
            <p className="text-sm font-semibold">Nothing waiting</p>
            <p className="text-xs text-muted-foreground">
              No long-pending or delivered orders in this range.
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
              icon={Hourglass}
              title="Long pending"
              value={(summary?.totalLongPending ?? 0).toLocaleString("en-US")}
              description={`Undelivered over ${threshold}h in range`}
              bgColor="red"
            />
            <StatsCard
              icon={Timer}
              title="Oldest waiting"
              value={durationLabel(summary?.worstHours ?? 0)}
              description="Hours since the oldest order was placed"
              bgColor="orange"
            />
            <StatsCard
              icon={AlarmClock}
              title="Average wait"
              value={durationLabel(summary?.avgHours ?? 0)}
              description="Average age of long-pending orders"
              bgColor="blue"
            />
            <StatsCard
              icon={Wallet}
              title="Pending value"
              value={bare(summary?.totalValue ?? 0)}
              description="Order value still undelivered"
              bgColor="purple"
            />
            <StatsCard
              icon={PackageCheck}
              title="Delivered"
              value={(summary?.totalDelivered ?? 0).toLocaleString("en-US")}
              description="Delivered in range (list capped at 50)"
              bgColor="green"
            />
          </div>

          {/* Long pending list */}
          {orders.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Long pending orders</h3>
                  <p className="text-xs text-muted-foreground">
                    Undelivered more than {threshold}h after placement · oldest first
                  </p>
                </div>
                <PillBadge tone="red" className="font-medium tabular-nums">
                  {orders.length} order{orders.length === 1 ? "" : "s"}
                </PillBadge>
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
                    {orders.map((order) => (
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
                          <PillBadge
                            tone={STATUS_TONES[order.status] ?? "amber"}
                            className="capitalize"
                          >
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
                {orders.map((order) => (
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
                      {order.shippingMethod || "—"} · {bare(order.totalValue)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Delivered list */}
          {deliveredOrders.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Delivered orders</h3>
                  <p className="text-xs text-muted-foreground">
                    Delivered in range · newest first
                  </p>
                </div>
                <PillBadge tone="emerald" className="font-medium tabular-nums">
                  {deliveredOrders.length} order
                  {deliveredOrders.length === 1 ? "" : "s"}
                </PillBadge>
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
