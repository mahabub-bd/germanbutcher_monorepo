"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { ReportDateFilters } from "@/components/admin/reports/report-date-filters";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrencyEnglish } from "@/lib/utils";
import { getPaymentStatusColor, getStatusIcon } from "@/utils/order-helper";
import { AlertTriangle, Ban, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Plain number formatting for the table/PDF — the ৳ symbol stays on the
// stat cards only.
const amount = (value: number) =>
  Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

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

export default function RefundsList({
  fromDate,
  toDate,
  preset,
  summary,
  orders,
}: RefundsListProps) {
  const router = useRouter();

  const applyParams = (params: {
    preset?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const q = new URLSearchParams();
    if (params.preset) q.set("preset", params.preset);
    if (params.fromDate) q.set("fromDate", params.fromDate);
    if (params.toDate) q.set("toDate", params.toDate);
    router.push(`?${q.toString()}`);
  };

  const settings = useBusinessSettings();

  const totalValue = summary?.cancelledValue ?? 0;
  const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalRefunded = orders.reduce(
    (sum, o) => sum + o.refundedAmount,
    0
  );

  const pdfRows = orders.map((o) => [
    o.date,
    o.orderNo,
    amount(o.totalValue),
    amount(o.paidAmount),
    amount(o.refundedAmount),
    o.paymentStatus,
    o.reason ?? "—",
  ]);

  const pdfSummary = [
    { label: "Cancelled Orders", value: String(summary?.cancelledOrders ?? 0) },
    { label: "Cancelled Value", value: amount(totalValue) },
    { label: "Refunded Amount", value: amount(summary?.refundedAmount ?? 0) },
  ];

  const paymentBadge = (status: string) => (
    <Badge
      variant="secondary"
      className={`capitalize ${getPaymentStatusColor(status)}`}
    >
      <span className="flex items-center gap-1.5">
        {getStatusIcon(status)}
        {status}
      </span>
    </Badge>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader
          title="Refund & Cancelled Orders Report"
          description="Cancelled orders, refunded money and cancellation reasons for a date range"
        />
        {orders.length > 0 && (
          <PDFDownloadLink
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
            fileName={`refund-report-${
              new Date().toISOString().split("T")[0]
            }.pdf`}
          >
            {({ loading, error }) => (
              <Button disabled={!!error} className="bg-primaryColor hover:bg-primaryColor/90 text-white shrink-0 w-full sm:w-auto">
                {error
                  ? "PDF Error"
                  : loading
                    ? "Generating PDF..."
                    : "Download PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </div>

      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={applyParams}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard
          icon={Ban}
          title="Cancelled Orders"
          value={summary?.cancelledOrders ?? 0}
          bgColor="red"
        />
        <StatsCard
          icon={AlertTriangle}
          title="Cancelled Value"
          value={formatCurrencyEnglish(totalValue)}
          bgColor="amber"
        />
        <StatsCard
          icon={RotateCcw}
          title="Refunded Amount"
          value={formatCurrencyEnglish(summary?.refundedAmount ?? 0)}
          bgColor="purple"
        />
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-10 text-center">
            <Ban className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No cancelled orders in this date range
            </p>
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{o.orderNo}</p>
                  <p className="text-xs text-muted-foreground mt-1">{o.date}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-primaryColor">
                    {amount(o.totalValue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paid {amount(o.paidAmount)}
                  </p>
                  {o.refundedAmount > 0 && (
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-0.5">
                      Refunded {amount(o.refundedAmount)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {paymentBadge(o.paymentStatus)}
                {o.reason && (
                  <span className="text-xs text-muted-foreground truncate">
                    {o.reason}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Order No</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Refunded</TableHead>
              <TableHead className="pl-8">Payment Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Ban className="h-8 w-8 text-muted-foreground/50" />
                    No cancelled orders in this date range
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id} className="hover:bg-muted/50">
                  <TableCell className="whitespace-nowrap">{o.date}</TableCell>
                  <TableCell className="font-medium">{o.orderNo}</TableCell>
                  <TableCell className="text-right font-medium">
                    {amount(o.totalValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {amount(o.paidAmount)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                    {amount(o.refundedAmount)}
                  </TableCell>
                  <TableCell className="pl-8">{paymentBadge(o.paymentStatus)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                    {o.reason || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {orders.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Total ({orders.length} orders)</TableCell>
                <TableCell className="text-right font-semibold">
                  {amount(totalValue)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {amount(totalPaid)}
                </TableCell>
                <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                  {amount(totalRefunded)}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <div className="text-sm text-muted-foreground mt-3">
        {orders.length} cancelled order{orders.length === 1 ? "" : "s"} in this
        date range
        {summary && summary.refundedAmount > 0 && (
          <> · {amount(summary.refundedAmount)} refunded</>
        )}
      </div>
    </div>
  );
}
