"use client";

import { OrderStatus } from "@/common/enums";
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
import {
  PillBadge,
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_TONE,
  type PillTone,
} from "@/components/common/pill-badge";
import { PaginationComponent } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  cn,
  formatCurrencyEnglish,
  formatDateTime,
  shortenArea,
} from "@/lib/utils";
import { apiUrl, resolveAuthToken } from "@/utils/api-utils";
import { formatOrderElapsedTime } from "@/utils/order-helper";
import { PaymentStatus } from "@/utils/types";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Percent,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { OrderReportPDF } from "./order-report-pdf";

interface Customer {
  name: string;
  mobileNumber: string;
  email: string;
}
interface ShippingAddress {
  address: string;
  area: string;
  city: string;
  division: string;
}
export interface Order {
  id: number;
  orderNo: string;
  orderStatus: string;
  paymentStatus: string;
  totalValue: number;
  totalDiscount: number;
  paidAmount: number;
  orderDate: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  customer: Customer;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentMethod: string;
}
interface OrderReportProps {
  orders: Order[];
  fromDate?: string;
  toDate?: string;
  preset?: string;
  orderStatus?: string;
  paymentStatus?: string;
  totalOrders: number;
  totalValue: number;
  totalDiscount: number;
  totalPaid: number;
  currentPage: number;
  limit: number;
  totalPages: number;
}

const ORDER_STATUS_OPTIONS = [
  { value: OrderStatus.PENDING, label: "Pending" },
  { value: OrderStatus.PROCESSING, label: "Processing" },
  { value: OrderStatus.ON_HOLD, label: "On hold" },
  { value: OrderStatus.SHIPPED, label: "Shipped" },
  { value: OrderStatus.DELIVERED, label: "Delivered" },
  { value: OrderStatus.CANCELLED, label: "Cancelled" },
  { value: OrderStatus.RETURNED, label: "Returned" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: PaymentStatus.PENDING, label: "Pending" },
  { value: PaymentStatus.COMPLETED, label: "Completed" },
  { value: PaymentStatus.PARTIAL, label: "Partial" },
  { value: PaymentStatus.PAID, label: "Paid" },
  { value: PaymentStatus.FAILED, label: "Failed" },
  { value: PaymentStatus.REFUNDED, label: "Refunded" },
  { value: PaymentStatus.NEED_REFUND, label: "Need refund" },
  { value: PaymentStatus.PARTIAL_REFUND, label: "Partial refund" },
  { value: PaymentStatus.REFUND_COMPLETE, label: "Refund complete" },
];

const AGEING_DAYS = 3;

/** Whole amounts only — report values never need decimal places. */
const amount = (value: number) => `৳${formatCurrencyEnglish(value || 0, 0)}`;

const humanize = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const dueOf = (order: Order) =>
  Math.max(0, (order.totalValue || 0) - (order.paidAmount || 0));

/**
 * Elapsed-time badge: terminal statuses report their own duration, open
 * orders report age and turn red once they exceed the ageing threshold.
 */
interface ElapsedBadge {
  tone: PillTone;
  label: string;
  title: string;
}

function elapsedBadge(order: Order) {
  if (order.cancelledAt) {
    return {
      tone: "neutral",
      label: formatOrderElapsedTime(order.orderDate, order.cancelledAt),
      title: `Placed ${formatDateTime(order.orderDate)} → cancelled ${formatDateTime(order.cancelledAt)}`,
    } satisfies ElapsedBadge;
  }

  if (order.deliveredAt) {
    return {
      tone: "emerald",
      label: formatOrderElapsedTime(order.orderDate, order.deliveredAt),
      title: `Placed ${formatDateTime(order.orderDate)} → delivered ${formatDateTime(order.deliveredAt)}`,
    } satisfies ElapsedBadge;
  }

  const ageDays =
    (Date.now() - new Date(order.orderDate).getTime()) / (24 * 60 * 60 * 1000);

  if (ageDays >= AGEING_DAYS) {
    return {
      tone: "red",
      label: formatOrderElapsedTime(order.orderDate),
      title: `Placed ${formatDateTime(order.orderDate)} — open for ${AGEING_DAYS}+ days`,
    } satisfies ElapsedBadge;
  }

  return {
    tone: "neutral",
    label: formatOrderElapsedTime(order.orderDate),
    title: `Placed ${formatDateTime(order.orderDate)}`,
  } satisfies ElapsedBadge;
}

function StatusBadge({
  status,
  tone,
}: {
  status: string;
  tone: "order" | "payment";
}) {
  const toneMap = tone === "order" ? ORDER_STATUS_TONE : PAYMENT_STATUS_TONE;

  return (
    <PillBadge tone={toneMap[status] ?? "neutral"}>{humanize(status)}</PillBadge>
  );
}

export default function OrderReportList({
  orders,
  fromDate,
  toDate,
  preset,
  orderStatus,
  paymentStatus,
  totalOrders,
  totalValue,
  totalDiscount,
  totalPaid,
  currentPage,
  limit,
  totalPages,
}: OrderReportProps) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>(
    orderStatus || "all"
  );
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>(
    paymentStatus || "all"
  );

  // Full-range rows for Excel/PDF export, fetched on demand (first export
  // click of each filter combination) so the page load stays light. Rows are
  // tagged with the filter they belong to, so a stale set is never exported.
  const [exportState, setExportState] = useState<{
    key: string;
    orders: Order[];
  } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentFilterQuery = useMemo(() => {
    const qs = new URLSearchParams();
    if (preset) qs.set("preset", preset);
    else {
      if (fromDate) qs.set("fromDate", fromDate);
      if (toDate) qs.set("toDate", toDate);
    }
    if (orderStatus) qs.set("orderStatus", orderStatus);
    if (paymentStatus) qs.set("paymentStatus", paymentStatus);
    return qs.toString();
  }, [preset, fromDate, toDate, orderStatus, paymentStatus]);

  const exportOrders =
    exportState && exportState.key === currentFilterQuery
      ? exportState.orders
      : null;

  // Current-page sums — the range totals shown in the cards come from the API.
  const pageTotals = useMemo(
    () =>
      orders.reduce(
        (sum, order) => ({
          value: sum.value + (order.totalValue || 0),
          paid: sum.paid + (order.paidAmount || 0),
          due: sum.due + dueOf(order),
        }),
        { value: 0, paid: 0, due: 0 }
      ),
    [orders]
  );

  const handleExportPrepare = async () => {
    if (exporting || exportOrders) return;
    setExporting(true);
    try {
      const token = await resolveAuthToken();
      const all: Order[] = [];
      let page = 1;
      let lastPage = 1;
      do {
        const qs = new URLSearchParams(currentFilterQuery);
        qs.set("page", String(page));
        qs.set("limit", "500");
        const response = await fetch(
          `${apiUrl}/orders/reports/date-range?${qs.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) {
          throw new Error(`Export request failed (${response.status})`);
        }
        // Raw fetch returns the API envelope; report data is in `.data`.
        const json = await response.json();
        const data = json?.data;
        all.push(...(data?.orders || []));
        lastPage = data?.totalPages || 1;
        page += 1;
      } while (page <= lastPage);
      setExportState({ key: currentFilterQuery, orders: all });
    } catch (error) {
      console.error("Failed to prepare export:", error);
      toast.error("Failed to load orders for export");
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (page: number) => {
    const qs = new URLSearchParams(currentFilterQuery);
    if (page > 1) qs.set("page", String(page));
    startTransition(() => router.push(`?${qs.toString()}`));
  };

  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);

    // An empty filter set means "clear" — drop the status filters too, which
    // the date bar owns no state for.
    if (!qs.toString()) {
      setSelectedOrderStatus("all");
      setSelectedPaymentStatus("all");
      startTransition(() => router.push("?"));
      return;
    }

    if (selectedOrderStatus && selectedOrderStatus !== "all")
      qs.set("orderStatus", selectedOrderStatus);
    if (selectedPaymentStatus && selectedPaymentStatus !== "all")
      qs.set("paymentStatus", selectedPaymentStatus);
    startTransition(() => router.push(`?${qs.toString()}`));
  };

  const handleFilterClear = () => {
    setSelectedOrderStatus("all");
    setSelectedPaymentStatus("all");
  };

  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const hasData = totalOrders > 0;
  const collectedRate =
    totalValue > 0 ? Math.round((totalPaid / totalValue) * 100) : 0;
  const totalDue = Math.max(0, totalValue - totalPaid);

  const firstRow = Math.min((currentPage - 1) * limit + 1, totalOrders);
  const lastRow = Math.min(currentPage * limit, totalOrders);

  return (
    <div className="w-full">
      <PageHeader
        title="Sales Report"
        description={`Every order in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()} — status, ageing, payment and amount.`}
      >
        {mounted && hasData && (
          <>
            {exportOrders ? (
              <>
                <ReportExcelButton
                  title="Sales Report"
                  subtitle={rangeLabel}
                  headers={[
                    "#",
                    "Date",
                    "Order No",
                    "Customer",
                    "Mobile",
                    "Area",
                    "Status",
                    "Payment",
                    "Elapsed Time",
                    "Total",
                    "Discount",
                    "Paid",
                  ]}
                  rows={exportOrders.map((o, i) => [
                    i + 1,
                    formatDateTime(o.orderDate),
                    o.orderNo,
                    o.customer?.name || "N/A",
                    o.customer?.mobileNumber || "N/A",
                    o.shippingAddress?.area || "N/A",
                    o.orderStatus,
                    o.paymentStatus,
                    o.cancelledAt
                      ? formatOrderElapsedTime(o.orderDate, o.cancelledAt)
                      : o.deliveredAt
                        ? formatOrderElapsedTime(o.orderDate, o.deliveredAt)
                        : formatOrderElapsedTime(o.orderDate),
                    o.totalValue,
                    o.totalDiscount,
                    o.paidAmount,
                  ])}
                  summary={[
                    { label: "Total Orders", value: String(totalOrders) },
                    {
                      label: "Total Value",
                      value: formatCurrencyEnglish(totalValue, 0),
                    },
                    {
                      label: "Total Discount",
                      value: formatCurrencyEnglish(totalDiscount, 0),
                    },
                    {
                      label: "Total Paid",
                      value: formatCurrencyEnglish(totalPaid, 0),
                    },
                    {
                      label: "Total Due",
                      value: formatCurrencyEnglish(totalDue, 0),
                    },
                  ]}
                  fileName="sales-report"
                />
                <LazyPdfDownloadLink
                  document={
                    <OrderReportPDF
                      orders={exportOrders}
                      settings={settings}
                    />
                  }
                  fileName={`order-report-${new Date().toISOString().split("T")[0]}.pdf`}
                />
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPrepare}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Preparing…
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Export
                  </>
                )}
              </Button>
            )}
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

      {/* Filters — shared date bar plus the report's own status selects */}
      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        extra={
          <>
            <Select
              value={selectedOrderStatus || "all"}
              onValueChange={setSelectedOrderStatus}
            >
              <SelectTrigger className="w-full md:w-40 md:shrink-0">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All order status</SelectItem>
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedPaymentStatus || "all"}
              onValueChange={setSelectedPaymentStatus}
            >
              <SelectTrigger className="w-full md:w-40 md:shrink-0">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payment status</SelectItem>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        onApply={handleFilterApply}
        onClear={handleFilterClear}
      />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <ReceiptText className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No orders matched</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range or relax the status filters.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleFilterClear();
              startTransition(() => router.push("?preset=this_year"));
            }}
          >
            Search this year
          </Button>
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <StatsCard
              title="Orders"
              value={totalOrders.toLocaleString("en-US")}
              description={`Matching orders in ${rangeLabel
                .replace(/^Period: /, "")
                .toLowerCase()}`}
              icon={ShoppingCart}
              bgColor="blue"
            />
            <StatsCard
              title="Order value"
              value={amount(totalValue)}
              description="Before discounts are deducted"
              icon={Wallet}
              bgColor="green"
            />
            <StatsCard
              title="Discount given"
              value={amount(totalDiscount)}
              description={`${totalOrders} order${totalOrders === 1 ? "" : "s"} discounted`}
              icon={Percent}
              bgColor="orange"
            />
            <StatsCard
              title="Collected"
              value={amount(totalPaid)}
              description={`${collectedRate}% of order value paid`}
              icon={CheckCircle2}
              bgColor="teal"
            />
            <StatsCard
              title="Outstanding"
              value={amount(totalDue)}
              description={
                totalValue > 0
                  ? `${100 - collectedRate}% still to collect`
                  : "Nothing billed in this range"
              }
              icon={AlertCircle}
              bgColor="red"
            />
          </div>

          {/* Orders */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Orders</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · page {currentPage} of {Math.max(totalPages, 1)}
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {orders.length} row{orders.length === 1 ? "" : "s"}
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Elapsed</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="pr-4 text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const elapsed = elapsedBadge(order);
                    const due = dueOf(order);

                    return (
                      <TableRow key={order.orderNo}>
                        <TableCell className="py-2.5 pl-4">
                          <Link
                            href={`/admin/order/${order.id}/view`}
                            className="text-sm font-semibold text-foreground hover:text-primaryColor hover:underline"
                          >
                            {order.orderNo}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDateTime(order.orderDate)}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="text-sm font-medium">
                            {order.customer?.name || "N/A"}
                          </p>
                          {order.customer?.mobileNumber ? (
                            <a
                              href={`tel:${order.customer.mobileNumber}`}
                              className="text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {order.customer.mobileNumber}
                            </a>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              No mobile
                            </p>
                          )}
                        </TableCell>

                        <TableCell>
                          <PillBadge
                            tone="violet"
                            className="max-w-40 truncate font-normal"
                            title={order.shippingAddress?.area || undefined}
                          >
                            {shortenArea(order.shippingAddress?.area || "N/A")}
                          </PillBadge>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={order.orderStatus} tone="order" />
                        </TableCell>

                        <TableCell>
                          <PillBadge
                            tone={elapsed.tone}
                            className="font-normal tabular-nums"
                            title={elapsed.title}
                          >
                            {elapsed.label}
                          </PillBadge>
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={order.paymentStatus}
                            tone="payment"
                          />
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrencyEnglish(order.totalValue, 0)}
                          </span>
                          {order.totalDiscount > 0 && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400">
                              −{formatCurrencyEnglish(order.totalDiscount, 0)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                            {formatCurrencyEnglish(order.paidAmount, 0)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              due > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatCurrencyEnglish(due, 0)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Page total
                    </TableCell>
                    <TableCell colSpan={5} />
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrencyEnglish(pageTotals.value, 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums text-teal-600 dark:text-teal-400">
                        {formatCurrencyEnglish(pageTotals.paid, 0)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          pageTotals.due > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrencyEnglish(pageTotals.due, 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {orders.map((order) => {
                const elapsed = elapsedBadge(order);
                const due = dueOf(order);

                return (
                  <article key={order.orderNo} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/order/${order.id}/view`}
                          className="text-sm font-semibold hover:text-primaryColor hover:underline"
                        >
                          {order.orderNo}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDateTime(order.orderDate)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={order.orderStatus} tone="order" />
                        <StatusBadge
                          status={order.paymentStatus}
                          tone="payment"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                      <span className="font-medium">
                        {order.customer?.name || "N/A"}
                      </span>
                      {order.customer?.mobileNumber && (
                        <a
                          href={`tel:${order.customer.mobileNumber}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {order.customer.mobileNumber}
                        </a>
                      )}
                      <PillBadge
                        tone="violet"
                        className="max-w-36 truncate font-normal"
                      >
                        {shortenArea(order.shippingAddress?.area || "N/A")}
                      </PillBadge>
                      <PillBadge
                        tone={elapsed.tone}
                        className="font-normal tabular-nums"
                        title={elapsed.title}
                      >
                        {elapsed.label}
                      </PillBadge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Total
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {amount(order.totalValue)}
                        </p>
                        {order.totalDiscount > 0 && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400">
                            −{amount(order.totalDiscount)} off
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Paid
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                          {amount(order.paidAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Due
                        </p>
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            due > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {amount(due)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Footer: range position + pagination */}
            <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {firstRow}–{lastRow} of {totalOrders} order
                {totalOrders === 1 ? "" : "s"}
              </p>
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="#"
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
