"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { PdfDownloadButton } from "@/components/admin/reports/pdf-download-button";
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
import { ShoppingCart, XCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MonthlyOrderPDF } from "./MonthlyOrderPDF";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

export interface MonthlyData {
  year: number;
  month: string;
  allOrderCount: number;
  allOrderValue: number;
  orderCount: number;
  totalValue: number;
  cancelOrderCount: number;
  cancelValue: number;
}

interface Props {
  monthlyData: MonthlyData[];
  availableYears: number[];
  selectedYear?: number;
}

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

  return (
    <div className="w-full">
      {/* Title + PDF export (compact on mobile, right of the title) */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Monthly Order Summary"
        />
        {monthlyData.length > 0 && mounted && (
          <PDFDownloadLink
            document={
              <MonthlyOrderPDF
                monthlyData={monthlyData}
                year={selectedYear}
                settings={settings}
              />
            }
            fileName={`monthly-order-report-${selectedYear ?? "all"}-${new Date().toISOString().split("T")[0]}.pdf`}
          >
            {({ loading, error }) => (
              <PdfDownloadButton loading={loading} error={error} />
            )}
          </PDFDownloadLink>
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
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
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
              <TableHead className="text-right">All Orders</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Cancelled</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Cancel Rate (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              monthlyData.map((item, index) => {
                const cancelRate =
                  item.allOrderCount > 0
                    ? Math.round((item.cancelOrderCount / item.allOrderCount) * 100)
                    : 0;
                return (
                  <TableRow key={`${item.year}-${item.month}-${index}`}>
                    <TableCell>{item.year}</TableCell>
                    <TableCell className="capitalize">{item.month}</TableCell>
                    <TableCell className="text-right">{item.allOrderCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyEnglish(item.allOrderValue, 0)}
                    </TableCell>
                    <TableCell className="text-right">{item.orderCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyEnglish(item.totalValue, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.cancelOrderCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyEnglish(item.cancelValue, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          cancelRate > 10
                            ? "text-red-600 font-semibold"
                            : cancelRate > 5
                              ? "text-orange-600 font-semibold"
                              : "text-green-600 font-semibold"
                        }
                      >
                        {cancelRate}%
                      </span>
                    </TableCell>
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
