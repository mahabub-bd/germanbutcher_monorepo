"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { ReportExcelButton } from "@/components/admin/reports/download-excel-button";
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
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  Clock,
  PauseCircle,
  RefreshCw,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MonthlyOrderPDF } from "./MonthlyOrderPDF";

export interface MonthlyData {
  year: number;
  month: string;
  allOrderCount: number;
  allOrderValue: number;
  orderCount: number;
  totalValue: number;
  cancelOrderCount: number;
  cancelValue: number;
  pendingOrderCount: number;
  pendingValue: number;
  processingOrderCount: number;
  processingValue: number;
  onHoldOrderCount: number;
  onHoldValue: number;
}

interface Props {
  monthlyData: MonthlyData[];
  availableYears: number[];
  selectedYear?: number;
}

// Color triplets for each status column: value text, % badge and progress bar,
// matching daily-summary
const tones = {
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    bar: "bg-blue-500",
  },
  green: {
    text: "text-green-600 dark:text-green-400",
    badge:
      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    bar: "bg-green-500",
  },
  orange: {
    text: "text-orange-600 dark:text-orange-400",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
    bar: "bg-orange-500",
  },
  purple: {
    text: "text-purple-600 dark:text-purple-400",
    badge:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
    bar: "bg-purple-500",
  },
  red: {
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    bar: "bg-red-500",
  },
} as const;

export default function MonthlyOrderReportList({
  monthlyData,
  availableYears,
  selectedYear,
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const settings = useBusinessSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  const yearOptions =
    availableYears.length > 0 ? availableYears : [new Date().getFullYear()];

  const handleYearChange = (value: string) => {
    router.push(value === "all" ? "?" : `?year=${value}`);
  };

  const totalAllOrders = monthlyData.reduce((sum, item) => sum + item.allOrderCount, 0);
  const totalAllOrderValue = monthlyData.reduce((sum, item) => sum + item.allOrderValue, 0);
  const totalOrders = monthlyData.reduce((sum, item) => sum + item.orderCount, 0);
  const totalValue = monthlyData.reduce((sum, item) => sum + item.totalValue, 0);
  const totalCancelled = monthlyData.reduce(
    (sum, item) => sum + item.cancelOrderCount,
    0
  );
  const totalCancelValue = monthlyData.reduce(
    (sum, item) => sum + item.cancelValue,
    0
  );
  const totalPending = monthlyData.reduce(
    (sum, item) => sum + (item.pendingOrderCount || 0),
    0
  );
  const totalPendingValue = monthlyData.reduce(
    (sum, item) => sum + (item.pendingValue || 0),
    0
  );
  const totalProcessing = monthlyData.reduce(
    (sum, item) => sum + (item.processingOrderCount || 0),
    0
  );
  const totalProcessingValue = monthlyData.reduce(
    (sum, item) => sum + (item.processingValue || 0),
    0
  );
  const totalOnHold = monthlyData.reduce(
    (sum, item) => sum + (item.onHoldOrderCount || 0),
    0
  );
  const totalOnHoldValue = monthlyData.reduce(
    (sum, item) => sum + (item.onHoldValue || 0),
    0
  );

  return (
    <div className="w-full">
      {/* Title + PDF export (compact on mobile, right of the title) */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Monthly Order Summary"
        />
        {monthlyData.length > 0 && mounted && (
          <div className="flex shrink-0 gap-2">
            <ReportExcelButton
              title="Monthly Order Summary"
              subtitle={selectedYear ? `Year: ${selectedYear}` : "All Years"}
                            headers={[
                "Year",
                "Month",
                "All Orders",
                "All Amount",
                "Delivered",
                "Delivered Amount",
                "Pending",
                "Pending Amount",
                "Processing",
                "Processing Amount",
                "On Hold",
                "On Hold Amount",
                "Cancelled",
                "Cancelled Amount",
                "Cancel Rate (%)",
              ]}
              rows={monthlyData.map((item) => [
                item.year,
                item.month,
                item.allOrderCount,
                item.allOrderValue,
                item.orderCount,
                item.totalValue,
                item.pendingOrderCount || 0,
                item.pendingValue || 0,
                item.processingOrderCount || 0,
                item.processingValue || 0,
                item.onHoldOrderCount || 0,
                item.onHoldValue || 0,
                item.cancelOrderCount || 0,
                item.cancelValue || 0,
                item.allOrderCount > 0
                  ? Math.round((item.cancelOrderCount / item.allOrderCount) * 100)
                  : 0,
              ])}
              fileName={`monthly-order-report-${selectedYear ?? "all"}`}
            />
            <LazyPdfDownloadLink
              document={
                <MonthlyOrderPDF
                  monthlyData={monthlyData}
                  year={selectedYear}
                  settings={settings}
                />
              }
              fileName={`monthly-order-report-${selectedYear ?? "all"}-${new Date().toISOString().split("T")[0]}.pdf`}
             />
          </div>
        )}
      </div>

      {/* Filters — card-style filter panel matching ReportDateFilters */}
      <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
        <div className="grid grid-cols-1 items-center gap-2.5 md:flex md:flex-nowrap md:items-center md:gap-3">
          <Select
            value={selectedYear ? String(selectedYear) : "all"}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-full md:w-44 md:shrink-0">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      {monthlyData.length > 0 && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3">
          <StatsCard
            title="All Orders"
            value={formatCurrencyEnglish(totalAllOrderValue, 0)}
            count={String(totalAllOrders)}
            description="All orders regardless of status"
            icon={ShoppingCart}
            bgColor="blue"
          />
          <StatsCard
            title="Delivered Orders"
            value={formatCurrencyEnglish(totalValue, 0)}
            count={String(totalOrders)}
            description="Successfully delivered orders"
            icon={ShoppingCart}
            bgColor="green"
          />
          <StatsCard
            title="Pending Orders"
            value={formatCurrencyEnglish(totalPendingValue, 0)}
            count={String(totalPending)}
            description="Awaiting processing"
            icon={Clock}
            bgColor="orange"
          />
          <StatsCard
            title="Processing Orders"
            value={formatCurrencyEnglish(totalProcessingValue, 0)}
            count={String(totalProcessing)}
            description="Currently being processed"
            icon={RefreshCw}
            bgColor="indigo"
          />
          <StatsCard
            title="On Hold Orders"
            value={formatCurrencyEnglish(totalOnHoldValue, 0)}
            count={String(totalOnHold)}
            description="Temporarily on hold"
            icon={PauseCircle}
            bgColor="amber"
          />
          <StatsCard
            title="Cancelled Orders"
            value={formatCurrencyEnglish(totalCancelValue, 0)}
            count={String(totalCancelled)}
            description="Cancelled orders"
            icon={XCircle}
            bgColor="red"
          />
        </div>
      )}

      {/* Table */}
      <div className=" overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>All Orders</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Processing</TableHead>
              <TableHead>On Hold</TableHead>
              <TableHead>Cancelled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              monthlyData.map((item, index) => {
                return (
                  <TableRow key={`${item.year}-${item.month}-${index}`}>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${tones.purple.badge}`}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {item.year}
                      </span>
                    </TableCell>
                    <TableCell className="pr-8">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium capitalize ${tones.blue.badge}`}
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        {item.month}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`min-w-35 whitespace-nowrap pr-8 text-sm font-medium ${tones.blue.text}`}
                    >
                      {formatCurrencyEnglish(item.allOrderValue, 0)} /{" "}
                      {item.allOrderCount}
                    </TableCell>
                    {[
                      {
                        value: item.totalValue,
                        count: item.orderCount,
                        tone: tones.green,
                      },
                      {
                        value: item.pendingValue || 0,
                        count: item.pendingOrderCount || 0,
                        tone: tones.orange,
                      },
                      {
                        value: item.processingValue || 0,
                        count: item.processingOrderCount || 0,
                        tone: tones.blue,
                      },
                      {
                        value: item.onHoldValue || 0,
                        count: item.onHoldOrderCount || 0,
                        tone: tones.purple,
                      },
                      {
                        value: item.cancelValue,
                        count: item.cancelOrderCount,
                        tone: tones.red,
                      },
                    ].map(({ value, count, tone }) => {
                      const percent =
                        item.allOrderCount > 0
                          ? Math.round((count / item.allOrderCount) * 100)
                          : 0;
                      return (
                        <TableCell
                          key={`${item.year}-${item.month}-${tone.bar}`}
                          className="min-w-35 whitespace-nowrap pr-8"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-sm font-medium ${tone.text}`}
                            >
                              {formatCurrencyEnglish(value, 0)} / {count}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.badge}`}
                            >
                              {percent}%
                            </span>
                          </div>
                          <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${tone.bar}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
