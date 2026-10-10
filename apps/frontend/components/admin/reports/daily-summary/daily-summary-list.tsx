"use client";

import { DateRangePreset } from "@/common/enums";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import { useBusinessSettings } from "@/hooks/use-business-settings";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { CalendarDays, ShoppingCart, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface DailySummary {
  totalOrders: number;
  totalValue: number;
  deliveredOrders: number;
  deliveredValue: number;
  cancelledOrders: number;
  paidAmount: number;
  dueAmount: number;
}

interface DailyRow {
  date: string;
  orderCount: number;
  orderValue: number;
  deliveredCount: number;
  deliveredValue: number;
  cancelledCount: number;
  cancelledValue: number;
  paidAmount: number;
  dueAmount: number;
}

interface DailySummaryListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: DailySummary | null;
  daily: DailyRow[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function DailySummaryList({
  fromDate,
  toDate,
  preset,
  summary,
  daily,
}: DailySummaryListProps) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);

  const [startDate, setStartDate] = useState<Date | undefined>(
    fromDate ? new Date(fromDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    toDate ? new Date(toDate) : undefined
  );
  const [quickRange, setQuickRange] = useState<string>(preset || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  const applyFilters = (
    range: string,
    start: Date | undefined,
    end: Date | undefined
  ) => {
    const params = new URLSearchParams();
    if (range) params.set("preset", range);
    if (start) params.set("fromDate", format(start, "yyyy-MM-dd"));
    if (end) params.set("toDate", format(end, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`);
  };

  const handleFilter = () => {
    applyFilters("", startDate, endDate);
  };

  const handleQuickRange = (value: string) => {
    setQuickRange(value);
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;

    switch (value) {
      case DateRangePreset.TODAY:
        from = today;
        to = today;
        break;
      case DateRangePreset.THIS_WEEK:
        from = startOfWeek(today, { weekStartsOn: 6 });
        to = endOfWeek(today, { weekStartsOn: 6 });
        break;
      case DateRangePreset.LAST_WEEK:
        from = subWeeks(startOfWeek(today, { weekStartsOn: 6 }), 1);
        to = subWeeks(endOfWeek(today, { weekStartsOn: 6 }), 1);
        break;
      case DateRangePreset.THIS_MONTH:
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case DateRangePreset.LAST_MONTH: {
        const lastMonth = subMonths(today, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      }
      case DateRangePreset.LAST_3_MONTHS:
        from = subMonths(today, 3);
        to = today;
        break;
      case DateRangePreset.LAST_6_MONTHS:
        from = subMonths(today, 6);
        to = today;
        break;
      case DateRangePreset.LAST_YEAR:
        from = subYears(today, 1);
        to = today;
        break;
      case DateRangePreset.THIS_YEAR:
        from = new Date(today.getFullYear(), 0, 1);
        to = today;
        break;
      default:
        from = undefined;
        to = undefined;
    }

    setStartDate(from);
    setEndDate(to);
    applyFilters(value, undefined, undefined);
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setQuickRange("");
    router.push("?");
  };

  const pdfRows = daily.map((row) => [
    row.date,
    row.orderCount,
    formatCurrency(row.orderValue),
    row.deliveredCount,
    formatCurrency(row.deliveredValue),
    row.cancelledCount,
    formatCurrency(row.cancelledValue),
    formatCurrency(row.paidAmount),
    formatCurrency(row.dueAmount),
  ]);

  const pdfSummary = [
    { label: "Total Orders", value: String(summary?.totalOrders ?? 0) },
    { label: "Total Value", value: formatCurrency(summary?.totalValue ?? 0) },
    { label: "Paid", value: formatCurrency(summary?.paidAmount ?? 0) },
    { label: "Due", value: formatCurrency(summary?.dueAmount ?? 0) },
  ];

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Daily Summary Report"
          description="Day-by-day order, delivered, cancelled, paid and due summary"
        />
        {daily.length > 0 && mounted && (
          <PDFDownloadLink
            document={
              <ReportTablePDF
                title="Daily Summary Report"
                headers={[
                  "Date",
                  "Orders",
                  "Order Value",
                  "Delivered",
                  "Delivered Value",
                  "Cancelled",
                  "Cancelled Value",
                  "Paid",
                  "Due",
                ]}
                flexes={[1.2, 0.7, 1, 0.8, 1, 0.8, 1, 1, 1]}
                alignRight={[1, 2, 3, 4, 5, 6, 7, 8]}
                rows={pdfRows}
                summary={pdfSummary}
                settings={settings}
              />
            }
            fileName={`daily-summary-report-${
              new Date().toISOString().split("T")[0]
            }.pdf`}
          >
            {({ loading, error }) => (
              <Button
                className="bg-primaryColor hover:bg-primaryColor/90 text-white shrink-0"
                disabled={!!error}
              >
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

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Quick Range</label>
          <Select value={quickRange} onValueChange={handleQuickRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Quick Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DateRangePreset.TODAY}>Today</SelectItem>
              <SelectItem value={DateRangePreset.THIS_WEEK}>
                This Week
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_WEEK}>
                Last Week
              </SelectItem>
              <SelectItem value={DateRangePreset.THIS_MONTH}>
                This Month
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_MONTH}>
                Last Month
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_3_MONTHS}>
                Last 3 Months
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_6_MONTHS}>
                Last 6 Months
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_YEAR}>
                Last Year
              </SelectItem>
              <SelectItem value={DateRangePreset.THIS_YEAR}>
                This Year
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mounted && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">From</label>
              <DatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">To</label>
              <DatePicker value={endDate} onChange={(date) => setEndDate(date)} />
            </div>
          </>
        )}

        <Button onClick={handleFilter}>Apply</Button>
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
      </div>

      {/* Range summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon={ShoppingCart}
          title="Total Orders"
          value={summary?.totalOrders ?? 0}
          count={formatCurrency(summary?.totalValue ?? 0)}
          bgColor="blue"
        />
        <StatsCard
          icon={CalendarDays}
          title="Delivered"
          value={summary?.deliveredOrders ?? 0}
          count={formatCurrency(summary?.deliveredValue ?? 0)}
          bgColor="green"
        />
        <StatsCard
          icon={Wallet}
          title="Paid"
          value={formatCurrency(summary?.paidAmount ?? 0)}
          bgColor="purple"
        />
        <StatsCard
          icon={Wallet}
          title="Due"
          value={formatCurrency(summary?.dueAmount ?? 0)}
          bgColor="red"
        />
      </div>

      {/* Daily table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Order Value</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Delivered Value</TableHead>
              <TableHead className="text-right">Cancelled</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daily.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground"
                >
                  No orders found for this date range
                </TableCell>
              </TableRow>
            ) : (
              daily.map((row) => (
                <TableRow key={row.date} className="hover:bg-muted/50">
                  <TableCell className="font-medium whitespace-nowrap">
                    {row.date}
                  </TableCell>
                  <TableCell className="text-right">{row.orderCount}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.orderValue)}
                  </TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400">
                    {row.deliveredCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.deliveredValue)}
                  </TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400">
                    {row.cancelledCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.paidAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.dueAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground mt-3">
        {daily.length} day{daily.length === 1 ? "" : "s"} with orders
      </div>
    </div>
  );
}
