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
import { Badge } from "@/components/ui/badge";
import { formatCurrencyEnglish } from "@/lib/utils";
import {
  getPaymentMethodColor,
  getPaymentMethodIcon,
} from "@/utils/order-helper";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface MethodRow {
  name: string;
  code: string;
  orders: number;
  pendingOrders: number;
  processingOrders: number;
  onHoldOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalValue: number;
  paidAmount: number;
  cashCollected: number;
  onlineAmount: number;
}

interface Summary {
  totalOrders: number;
  totalValue: number;
  totalPaid: number;
  totalCashCollected: number;
  totalOnlineAmount: number;
  avgOrderValue: number;
  methodCount: number;
}

interface PaymentMethodListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  methods: MethodRow[];
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

export default function PaymentMethodList({
  fromDate,
  toDate,
  preset,
  summary,
  methods,
}: PaymentMethodListProps) {
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
    if (!qs.toString()) {
      startTransition(() => router.push("?"));
      return;
    }

    startTransition(() => router.push(`?${qs.toString()}`));
  };

  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const hasData = methods.length > 0;

  // Sums across the visible methods (kept independent of the API summary so
  // the footer always matches the rows actually rendered).
  const totals = methods.reduce(
    (acc, m) => ({
      orders: acc.orders + m.orders,
      pending: acc.pending + m.pendingOrders,
      processing: acc.processing + m.processingOrders,
      onHold: acc.onHold + m.onHoldOrders,
      delivered: acc.delivered + m.deliveredOrders,
      cancelled: acc.cancelled + m.cancelledOrders,
      value: acc.value + m.totalValue,
      paid: acc.paid + m.paidAmount,
      cash: acc.cash + m.cashCollected,
      online: acc.online + m.onlineAmount,
    }),
    {
      orders: 0,
      pending: 0,
      processing: 0,
      onHold: 0,
      delivered: 0,
      cancelled: 0,
      value: 0,
      paid: 0,
      cash: 0,
      online: 0,
    }
  );

  const exportRows: (string | number)[][] = methods.map((m) => [
    m.name,
    m.orders,
    m.pendingOrders,
    m.processingOrders,
    m.onHoldOrders,
    m.deliveredOrders,
    m.cancelledOrders,
    formatMoney(m.totalValue),
    formatMoney(m.paidAmount),
    formatMoney(m.cashCollected),
    formatMoney(m.onlineAmount),
  ]);

  const pdfSummary = [
    { label: "Total Orders", value: (summary?.totalOrders ?? 0).toLocaleString("en-US") },
    { label: "Order Value", value: formatMoney(summary?.totalValue ?? 0) },
    { label: "Collected", value: formatMoney(summary?.totalPaid ?? 0) },
    { label: "Cash Collected", value: formatMoney(summary?.totalCashCollected ?? 0) },
    { label: "Online Payment", value: formatMoney(summary?.totalOnlineAmount ?? 0) },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Payment Method Report"
        description={`Orders broken down by payment method in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()}.`}
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Payment Method Report"
              subtitle={rangeLabel}
              headers={[
                "Payment Method",
                "Orders",
                "Pending",
                "Processing",
                "On Hold",
                "Delivered",
                "Cancelled",
                "Order Value",
                "Paid",
                "Cash",
                "Online",
              ]}
              rows={exportRows}
              summary={pdfSummary}
              fileName="payment-method-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Payment Method Report"
                  headers={[
                    "Payment Method",
                    "Orders",
                    "Delivered",
                    "Cancelled",
                    "Order Value",
                    "Paid",
                    "Cash",
                    "Online",
                  ]}
                  flexes={[1.6, 0.8, 0.9, 0.9, 1.1, 1, 1, 1]}
                  alignRight={[1, 2, 3, 4, 5, 6, 7]}
                  rows={exportRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`payment-method-report-${new Date()
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
            <Wallet className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No payment methods matched</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range or pick another quick range.
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
              icon={ShoppingBag}
              title="Orders"
              value={(summary?.totalOrders ?? 0).toLocaleString("en-US")}
              description={`Orders placed in ${rangeLabel
                .replace(/^Period: /, "")
                .toLowerCase()}`}
              bgColor="blue"
            />
            <StatsCard
              icon={Wallet}
              title="Order value"
              value={amount(summary?.totalValue ?? 0)}
              description="Sum of order value"
              bgColor="green"
            />
            <StatsCard
              icon={CheckCircle2}
              title="Collected"
              value={amount(summary?.totalPaid ?? 0)}
              description="Payments received"
              bgColor="teal"
            />
            <StatsCard
              icon={Banknote}
              title="Cash collected"
              value={amount(summary?.totalCashCollected ?? 0)}
              description="COD payments received"
              bgColor="orange"
            />
            <StatsCard
              icon={CreditCard}
              title="Online payment"
              value={amount(summary?.totalOnlineAmount ?? 0)}
              description="Card / mobile payments received"
              bgColor="purple"
            />
          </div>

          {/* Methods */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Payment methods</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · average order{" "}
                  {bare(summary?.avgOrderValue ?? 0)}
                </p>
              </div>
            </div>

            {/* Desktop table: one row per payment method */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Payment Method</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Processing</TableHead>
                    <TableHead className="text-right">On Hold</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Cancelled</TableHead>
                    <TableHead className="text-right">Order Value</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="pr-4 text-right">Online</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((m) => (
                    <TableRow key={m.code || m.name}>
                      <TableCell className="py-2 pl-4">
                        <Badge
                          variant="outline"
                          title={m.name}
                          className={`capitalize max-w-32 lg:max-w-none truncate ${getPaymentMethodColor(m.name)}`}
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            {getPaymentMethodIcon(m.name || "")}
                            <span className="truncate">{m.name}</span>
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {m.orders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {m.pendingOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {m.processingOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {m.onHoldOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {m.deliveredOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {m.cancelledOrders.toLocaleString("en-US")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(m.totalValue)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(m.paidAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                          {bare(m.cashCollected)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span className="text-sm font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                          {bare(m.onlineAmount)}
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
                        {totals.orders.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {totals.pending.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {totals.processing.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {totals.onHold.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {totals.delivered.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {totals.cancelled.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(totals.value)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(totals.paid)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums text-teal-600 dark:text-teal-400">
                        {bare(totals.cash)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <span className="text-sm font-bold tabular-nums text-violet-600 dark:text-violet-400">
                        {bare(totals.online)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards: one card per method */}
            <div className="divide-y md:hidden">
              {methods.map((m) => (
                <article key={m.code || m.name} className="space-y-3 p-3.5">
                  <div>
                    <p className="text-sm font-semibold">{m.name}</p>
                    {m.code && (
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {m.code}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Orders
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {m.orders.toLocaleString("en-US")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Value
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(m.totalValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Cash
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                        {amount(m.cashCollected)}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Online
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                        {amount(m.onlineAmount)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <div className="border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {methods.length} payment method
                {methods.length === 1 ? "" : "s"} in this range
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
