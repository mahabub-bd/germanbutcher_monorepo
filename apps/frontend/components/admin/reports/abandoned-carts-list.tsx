"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PaginationComponent } from "@/components/common/pagination";
import { PillBadge } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import type { AbandonedCartsSummary } from "@/utils/types";
import {
  RefreshCw,
  Search,
  ShoppingCart,
  Tag,
  TrendingDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
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

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

/** Abandoned Carts report: carts holding items, untouched 24h+, whose user
 * never checked out afterwards. */
export function AbandonedCartsList() {
  const router = useRouter();
  const [report, setReport] = useState<AbandonedReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const limit = 10;

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
      });
      if (search) query.set("search", search);
      const data = await fetchProtectedData<AbandonedReportPayload>(
        `cart/reports/abandoned?${query.toString()}`
      );
      setReport(data);
    } catch (error) {
      console.error("Error fetching abandoned carts:", error);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Debounce the search box; a new search restarts pagination.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const totalPages = report ? Math.max(1, Math.ceil(report.total / limit)) : 1;
  const rangeStart = report ? (currentPage - 1) * limit : 0;
  const rangeEnd = report
    ? Math.min(rangeStart + report.items.length, report.total)
    : 0;

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            value={currency.format(report.summary.abandonedValue)}
            description="At current selling prices"
            bgColor="orange"
          />
          <StatsCard
            icon={TrendingDown}
            title="Avg per Cart"
            value={
              report.summary.abandonedCarts > 0
                ? currency.format(
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

      {/* Recent abandoned carts */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <ShoppingCart className="size-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Recent abandoned carts</h3>
              <p className="text-xs text-muted-foreground">
                Newest first · Amounts in ৳
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name or mobile..."
                className="h-8 w-44 pl-8 sm:w-56"
              />
            </div>
            {report && (
              <PillBadge className="font-medium tabular-nums">
                {report.total.toLocaleString("en-US")} total
              </PillBadge>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={fetchReport}
            >
              <RefreshCw
                className={cn("size-3.5", isLoading && "animate-spin")}
              />
              <span className="ml-1.5 hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading abandoned carts...
          </div>
        ) : !report || report.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <ShoppingCart className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No abandoned carts</p>
              <p className="text-xs text-muted-foreground">
                Carts appear here once items sit unchecked-out for over 24
                hours.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table [&_td]:px-1.5 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-1.5 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
                <TableHeader className="[&_th]:font-semibold">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Customer</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Cart Value</TableHead>
                    <TableHead className="text-right">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.items.map((item) => (
                    <TableRow
                      key={item.cartId}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/crm/abandoned-carts/${item.cartId}`)
                      }
                    >
                      <TableCell className="py-2.5 font-medium">
                        <span className="line-clamp-1" title={item.userName || undefined}>
                          {item.userName || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {item.mobileNumber || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <PillBadge className="font-medium tabular-nums">
                          {item.itemCount}
                        </PillBadge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
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
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {report.items.map((item) => (
                <article
                  key={item.cartId}
                  className="cursor-pointer space-y-3 p-3.5"
                  onClick={() =>
                    router.push(`/admin/crm/abandoned-carts/${item.cartId}`)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold">
                      {item.userName || "Guest cart"}
                    </p>
                    <PillBadge tone="amber" className="font-medium tabular-nums">
                      ৳
                      {item.value.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </PillBadge>
                  </div>

                  {item.mobileNumber && (
                    <p className="truncate text-xs text-muted-foreground tabular-nums">
                      {item.mobileNumber}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Items
                      </p>
                      <p className="text-sm tabular-nums">{item.itemCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Last Updated
                      </p>
                      <p className="text-sm">{formatDateTime(item.updatedAt)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer: range position + pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
              <p className="text-xs text-muted-foreground">
                Showing {rangeStart + 1}–{rangeEnd} of{" "}
                {report.total.toLocaleString("en-US")} abandoned carts
              </p>
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
