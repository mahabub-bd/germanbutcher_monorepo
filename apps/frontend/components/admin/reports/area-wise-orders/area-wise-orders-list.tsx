"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { ReportExcelButton, dateRangeSubtitle } from "@/components/admin/reports/download-excel-button";
import { ReportDateFilters } from "@/components/admin/reports/report-date-filters";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish } from "@/lib/utils";
import {
  Clock,
  MapPin,
  PackageCheck,
  PauseCircle,
  RefreshCw,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Summary {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  processingOrders: number;
  onHoldOrders: number;
  totalValue: number;
  deliveredValue: number;
  totalAreas: number;
}

interface AreaRow {
  area: string;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  processingOrders: number;
  onHoldOrders: number;
  totalValue: number;
  deliveredValue: number;
}

interface AreaWiseOrdersListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  areas: AreaRow[];
}

export default function AreaWiseOrdersList({
  fromDate,
  toDate,
  preset,
  summary,
  areas,
}: AreaWiseOrdersListProps) {
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

  const pdfRows = areas.map((a) => [
    a.area,
    a.totalOrders,
    a.deliveredOrders,
    a.cancelledOrders,
    a.pendingOrders,
    a.processingOrders,
    a.onHoldOrders,
    formatCurrencyEnglish(a.totalValue),
    formatCurrencyEnglish(a.deliveredValue),
  ]);

  const pdfSummary = [
    { label: "Total Orders", value: String(summary?.totalOrders ?? 0) },
    { label: "Delivered Orders", value: String(summary?.deliveredOrders ?? 0) },
    { label: "Cancelled Orders", value: String(summary?.cancelledOrders ?? 0) },
    { label: "Pending Orders", value: String(summary?.pendingOrders ?? 0) },
    { label: "Processing Orders", value: String(summary?.processingOrders ?? 0) },
    { label: "On Hold Orders", value: String(summary?.onHoldOrders ?? 0) },
    { label: "Order Value", value: formatCurrencyEnglish(summary?.totalValue ?? 0) },
    { label: "Delivered Value", value: formatCurrencyEnglish(summary?.deliveredValue ?? 0) },
    { label: "Areas", value: String(summary?.totalAreas ?? 0) },
  ];

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Area Wise Order Report"
        />
        {areas.length > 0 && (
          <div className="flex shrink-0 gap-2">
            <ReportExcelButton
              title="Area Wise Order Report"
              subtitle={dateRangeSubtitle(preset, fromDate, toDate)}
                            headers={[
                "Area",
                "Orders",
                "Delivered",
                "Cancelled",
                "Pending",
                "Processing",
                "On Hold",
                "Order Value",
                "Delivered Value",
              ]}
              rows={pdfRows}
              summary={pdfSummary}
              fileName="area-wise-order-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Area Wise Order Report"
                  headers={[
                    "Area",
                    "Orders",
                    "Delivered",
                    "Cancelled",
                    "Pending",
                    "Processing",
                    "On Hold",
                    "Order Value",
                    "Delivered Value",
                  ]}
                  flexes={[1.5, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 1.1, 1.1]}
                  alignRight={[1, 2, 3, 4, 5, 6, 7, 8]}
                  rows={pdfRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`area-wise-order-report-${new Date().toISOString().split("T")[0]
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

      <div className="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-7 gap-4 mb-6">
        <StatsCard
          icon={ShoppingCart}
          title="Total Orders"
          value={summary?.totalOrders ?? 0}
          bgColor="blue"
        />
        <StatsCard
          icon={PackageCheck}
          title="Delivered Orders"
          value={summary?.deliveredOrders ?? 0}
          bgColor="green"
        />
        <StatsCard
          icon={Clock}
          title="Pending Orders"
          value={summary?.pendingOrders ?? 0}
          bgColor="orange"
        />
        <StatsCard
          icon={RefreshCw}
          title="Processing Orders"
          value={summary?.processingOrders ?? 0}
          bgColor="indigo"
        />
        <StatsCard
          icon={PauseCircle}
          title="On Hold Orders"
          value={summary?.onHoldOrders ?? 0}
          bgColor="amber"
        />
        <StatsCard
          icon={XCircle}
          title="Cancelled Orders"
          value={summary?.cancelledOrders ?? 0}
          bgColor="red"
        />
        <StatsCard
          icon={MapPin}
          title="Areas"
          value={summary?.totalAreas ?? 0}
          bgColor="purple"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Cancelled</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-right">Processing</TableHead>
              <TableHead className="text-right">On Hold</TableHead>
              <TableHead className="text-right">Order Value</TableHead>
              <TableHead className="text-right">Delivered Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 text-muted-foreground"
                >
                  No orders found for this range
                </TableCell>
              </TableRow>
            ) : (
              areas.map((a) => (
                <TableRow key={a.area} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{a.area}</TableCell>
                  <TableCell className="text-right font-medium">
                    {a.totalOrders}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.deliveredOrders}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.cancelledOrders}
                  </TableCell>
                  <TableCell className="text-right text-orange-600 dark:text-orange-400">
                    {a.pendingOrders}
                  </TableCell>
                  <TableCell className="text-right text-blue-600 dark:text-blue-400">
                    {a.processingOrders}
                  </TableCell>
                  <TableCell className="text-right text-violet-600 dark:text-violet-400">
                    {a.onHoldOrders}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyEnglish(a.totalValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyEnglish(a.deliveredValue)}
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
