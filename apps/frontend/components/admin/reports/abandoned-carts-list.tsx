"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchProtectedData } from "@/utils/api-utils";
import type { AbandonedCartsSummary } from "@/utils/types";
import { Clock, ShoppingCart, Tag, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface AbandonedCartItem {
  cartId: number;
  userName: string | null;
  mobileNumber: string | null;
  itemCount: number;
  value: number;
  updatedAt: string;
}

interface AbandonedReportPayload {
  summary: AbandonedCartsSummary;
  items: AbandonedCartItem[];
  total: number;
}

/** Abandoned Carts report: carts holding items, untouched 24h+, whose user
 * never checked out afterwards. */
export function AbandonedCartsList() {
  const [report, setReport] = useState<AbandonedReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchProtectedData<AbandonedReportPayload>(
        `cart/reports/abandoned?page=${currentPage}&limit=${limit}`
      );
      setReport(data);
    } catch (error) {
      console.error("Error fetching abandoned carts:", error);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalPages = report ? Math.max(1, Math.ceil(report.total / limit)) : 1;

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="w-full space-y-4">
      {/* Summary tiles */}
      {report && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatsCard
            icon={ShoppingCart}
            title="Abandoned Carts"
            value={report.summary.abandonedCarts.toLocaleString()}
            description="Items in cart · no checkout · 24h+"
            bgColor="amber"
          />
          <StatsCard
            icon={Tag}
            title="Value Left in Carts"
            value={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "BDT",
              maximumFractionDigits: 0,
            }).format(report.summary.abandonedValue)}
            description="At current selling prices"
            bgColor="orange"
          />
          <StatsCard
            icon={TrendingDown}
            title="Avg per Cart"
            value={
              report.summary.abandonedCarts > 0
                ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "BDT",
                  maximumFractionDigits: 0,
                }).format(
                  report.summary.abandonedValue /
                  report.summary.abandonedCarts
                )
                : "৳0"
            }
            description="Potential recovery per customer"
            bgColor="red"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-sm border bg-card">
        <div className="flex items-center justify-between gap-3 p-4 border-b">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <ShoppingCart className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Abandoned Carts</h3>
              <p className="text-xs text-muted-foreground">
                Newest first · updated in the last 24h excluded
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchReport}>
            <Clock className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading abandoned carts...
          </div>
        ) : !report || report.items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium">No abandoned carts</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Carts appear here once items sit unchecked-out for over 24 hours.
            </p>
          </div>
        ) : (
          <>
            <Table className="report-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Cart Value</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.items.map((item) => (
                  <TableRow key={item.cartId}>
                    <TableCell className="font-medium">
                      {item.userName || "—"}
                    </TableCell>
                    <TableCell>{item.mobileNumber || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{item.itemCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ৳
                      {item.value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(item.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
