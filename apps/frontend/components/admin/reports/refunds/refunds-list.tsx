"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { ReportExcelButton, dateRangeSubtitle } from "@/components/admin/reports/download-excel-button";
import { ReportDateFilters } from "@/components/admin/reports/report-date-filters";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
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
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish } from "@/lib/utils";
import { getPaymentStatusColor, getStatusIcon } from "@/utils/order-helper";
import {
  AlertTriangle,
  Ban,
  Calendar,
  RotateCcw,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Badge tints for date and amount cells, matching the other report tables
const badgeTones = {
  slate:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  green:
    "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
} as const;

// Cell value inside a tinted pill with a leading icon
const IconBadge = ({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof Ban;
  tone: string;
  children: React.ReactNode;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${tone}`}
  >
    <Icon className="h-3.5 w-3.5" />
    {children}
  </span>
);

// Plain number formatting for the table/PDF — the ৳ symbol stays on the
// stat cards only.
const amount = (value: number) =>
  Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Refund & Cancelled Orders Report"
        />
        {orders.length > 0 && (
          <div className="flex shrink-0 gap-2">
            <ReportExcelButton
              title="Refund & Cancelled Orders Report"
              subtitle={dateRangeSubtitle(preset, fromDate, toDate)}
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
              fileName={`refund-report-${new Date().toISOString().split("T")[0]
                }.pdf`}
             />
          </div>
        )}
      </div>

      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={applyParams}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard
          icon={Ban}
          title="Cancelled Orders"
          value={summary?.cancelledOrders ?? 0}
          bgColor="red"
        />
        <StatsCard
          icon={AlertTriangle}
          title="Cancelled Value"
          value={formatCurrencyEnglish(totalValue, 0)}
          bgColor="amber"
        />
        <StatsCard
          icon={RotateCcw}
          title="Refunded Amount"
          value={formatCurrencyEnglish(summary?.refundedAmount ?? 0, 0)}
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
            <div key={o.id} className="rounded-sm border bg-card p-3">
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
                  <TableCell className="whitespace-nowrap">
                    <IconBadge icon={Calendar} tone={badgeTones.slate}>
                      {o.date}
                    </IconBadge>
                  </TableCell>
                  <TableCell className="font-medium">{o.orderNo}</TableCell>
                  <TableCell className="text-right">
                    <IconBadge icon={ShoppingCart} tone={badgeTones.blue}>
                      {amount(o.totalValue)}
                    </IconBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <IconBadge icon={Wallet} tone={badgeTones.green}>
                      {amount(o.paidAmount)}
                    </IconBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <IconBadge icon={RotateCcw} tone={badgeTones.red}>
                      {amount(o.refundedAmount)}
                    </IconBadge>
                  </TableCell>
                  <TableCell className="pl-8">{paymentBadge(o.paymentStatus)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-60 truncate">
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
