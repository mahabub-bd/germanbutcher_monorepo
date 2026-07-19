"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyEnglish } from "@/lib/utils";
import { ShoppingCart, XCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MonthlyOrderPDF } from "./MonthlyOrderPDF";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface MonthlyData {
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
}

export default function MonthlyOrderReportList({ monthlyData }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <PageHeader
        title="Monthly Order Summary"
        description="View monthly order statistics and trends"
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 mb-6">
        {monthlyData.length > 0 && mounted && (
          <PDFDownloadLink
            document={<MonthlyOrderPDF monthlyData={monthlyData} />}
            fileName={`monthly-order-report-${new Date().toISOString().split("T")[0]}.pdf`}
          >
            {({ loading, error }) => (
              <Button variant="secondary" disabled={!!error}>
                {error ? "PDF Error" : loading ? "Generating PDF..." : "Download PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </div>

      {/* Summary */}
      {monthlyData.length > 0 && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatsCard
            title="All Orders"
            value={formatCurrencyEnglish(totalAllOrderValue)}
            count={String(totalAllOrders)}
            description="All orders regardless of status"
            icon={ShoppingCart}
            bgColor="blue"
          />
          <StatsCard
            title="Delivered Orders"
            value={formatCurrencyEnglish(totalValue)}
            count={String(totalOrders)}
            description="Successfully delivered orders"
            icon={ShoppingCart}
            bgColor="green"
          />
          <StatsCard
            title="Cancelled Orders"
            value={formatCurrencyEnglish(totalCancelValue)}
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
                    ? ((item.cancelOrderCount / item.allOrderCount) * 100).toFixed(1)
                    : "0.0";
                return (
                  <TableRow key={`${item.year}-${item.month}-${index}`}>
                    <TableCell>{item.year}</TableCell>
                    <TableCell className="capitalize">{item.month}</TableCell>
                    <TableCell className="text-right">{item.allOrderCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyEnglish(item.allOrderValue)}
                    </TableCell>
                    <TableCell className="text-right">{item.orderCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyEnglish(item.totalValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.cancelOrderCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyEnglish(item.cancelValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          parseFloat(cancelRate) > 10
                            ? "text-red-600 font-semibold"
                            : parseFloat(cancelRate) > 5
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
