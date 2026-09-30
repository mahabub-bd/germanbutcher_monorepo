"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { ReportDateFilters } from "@/components/admin/reports/report-date-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyEnglish } from "@/lib/utils";
import { getPaymentStatusColor, getStatusIcon } from "@/utils/order-helper";
import { AlertTriangle, Ban, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

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

  const pdfRows = orders.map((o) => [
    o.date,
    o.orderNo,
    formatCurrencyEnglish(o.totalValue),
    formatCurrencyEnglish(o.paidAmount),
    o.paymentStatus,
    o.reason ?? "—",
  ]);

  const pdfSummary = [
    { label: "Cancelled Orders", value: String(summary?.cancelledOrders ?? 0) },
    { label: "Cancelled Value", value: formatCurrencyEnglish(summary?.cancelledValue ?? 0) },
    { label: "Refunded Amount", value: formatCurrencyEnglish(summary?.refundedAmount ?? 0) },
  ];

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
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
                  "Payment Status",
                  "Reason",
                ]}
                flexes={[1, 1.2, 1, 1, 1.2, 1.8]}
                alignRight={[2, 3]}
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
              <Button variant="secondary" disabled={!!error} className="shrink-0">
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
          value={formatCurrencyEnglish(summary?.cancelledValue ?? 0)}
          bgColor="amber"
        />
        <StatsCard
          icon={RotateCcw}
          title="Refunded Amount"
          value={formatCurrencyEnglish(summary?.refundedAmount ?? 0)}
          bgColor="purple"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Order No</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No cancelled orders in this date range
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id} className="hover:bg-muted/50">
                  <TableCell className="whitespace-nowrap">{o.date}</TableCell>
                  <TableCell className="font-medium">{o.orderNo}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyEnglish(o.totalValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyEnglish(o.paidAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`capitalize ${getPaymentStatusColor(o.paymentStatus)}`}>
                      <span className="flex items-center gap-1.5">
                        {getStatusIcon(o.paymentStatus)}
                        {o.paymentStatus}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {o.reason || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
