"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PaginationComponent } from "@/components/common/pagination";
import {
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_TONE,
  PillBadge,
} from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllCouponUsageLogs,
  getCouponUsageLogsByCode,
  getCouponUsageStats,
} from "@/lib/coupon-usage-log-service";
import { cn, formatDateTime } from "@/lib/utils";
import type { CouponUsageLog } from "@/utils/types";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  Filter,
  MoreHorizontal,
  Package,
  Percent,
  RefreshCw,
  ShoppingBag,
  TicketPercent,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface CouponUsageLogListProps {
  /** Scopes the list (and the stats cards) to a single coupon. */
  couponCode?: string;
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

/** Grouped amount, up to 2 decimals — the ৳ mark is added at the call site. */
const bare = (value: number | string) =>
  Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const humanize = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** formatDateTime yields "31 Oct 2026, 10:30 AM" — split on the LAST comma so
 *  the day and the clock can sit on two lines inside a narrow column. */
const splitStamp = (value: string) => {
  const stamp = formatDateTime(value);
  const cut = stamp.lastIndexOf(", ");
  return cut === -1
    ? { day: stamp, clock: "" }
    : { day: stamp.slice(0, cut), clock: stamp.slice(cut + 2) };
};

export function CouponUsageLogList({
  couponCode,
  initialPage = 1,
  initialLimit = 10,
  initialSearchParams = {},
}: CouponUsageLogListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [logs, setLogs] = useState<CouponUsageLog[]>([]);
  const [stats, setStats] = useState<{
    totalUses: number;
    totalDiscountGiven: number | string;
    avgDiscountAmount: number | string;
    totalOrderValue: number | string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fromDate, setFromDate] = useState(getInitialParam("fromDate") as string);
  const [toDate, setToDate] = useState(getInitialParam("toDate") as string);
  // DatePicker holds its own copy of the picked date, so Clear bumps this key
  // to remount both pickers without a stale selection.
  const [resetKey, setResetKey] = useState(0);
  const [startDate, setStartDate] = useState<Date | undefined>(
    fromDate ? new Date(fromDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    toDate ? new Date(toDate) : undefined
  );

  const hasDateRange = Boolean(fromDate || toDate);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, fromDate, toDate]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = couponCode
        ? await getCouponUsageLogsByCode(couponCode, currentPage, limit, {
          fromDate,
          toDate,
        })
        : await getAllCouponUsageLogs(currentPage, limit, { fromDate, toDate });
      setLogs(Array.isArray(response?.data) ? response.data : []);
      setTotalItems(response?.total ?? 0);
      setTotalPages(response?.totalPages ?? 1);

      // Per-coupon totals only exist for a single coupon.
      if (couponCode) {
        try {
          setStats(await getCouponUsageStats(couponCode));
        } catch (error) {
          console.error("Error fetching stats:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching coupon usage logs:", error);
      toast.error("Failed to load usage logs. Please try again.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [couponCode, currentPage, limit, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const applyDateRange = () => {
    setFromDate(startDate ? format(startDate, "yyyy-MM-dd") : "");
    setToDate(endDate ? format(endDate, "yyyy-MM-dd") : "");
    setCurrentPage(1);
  };

  const clearDateRange = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setFromDate("");
    setToDate("");
    setResetKey((key) => key + 1);
    setCurrentPage(1);
  };

  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const pageDiscount = logs.reduce(
    (sum, log) => sum + Number(log.discountAmount || 0),
    0
  );
  const pageOrderValue = logs.reduce(
    (sum, log) => sum + Number(log.orderTotal || 0),
    0
  );

  const renderActions = (log: CouponUsageLog) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/marketing/coupon/usage-logs/${log.id}/view`}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/order/${log.order.id}/view`}>
            <Package className="mr-2 h-4 w-4" /> View Order
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderCustomer = (log: CouponUsageLog) => (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-[11px] font-semibold uppercase text-muted-foreground">
        {log.user?.name?.charAt(0) || <User className="h-4 w-4" />}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium leading-tight">
          {log.user?.name || "Unknown"}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {log.user?.email || "—"}
        </p>
      </div>
    </div>
  );

  const renderOrderStatus = (log: CouponUsageLog) => (
    <PillBadge tone={ORDER_STATUS_TONE[log.order?.orderStatus] ?? "neutral"}>
      {humanize(log.order?.orderStatus ?? "unknown")}
    </PillBadge>
  );

  const renderPaymentStatus = (log: CouponUsageLog) => (
    <PillBadge tone={PAYMENT_STATUS_TONE[log.order?.paymentStatus] ?? "neutral"}>
      {humanize(log.order?.paymentStatus ?? "unknown")}
    </PillBadge>
  );

  return (
    <div className="w-full">
      <PageHeader
        title={couponCode ? `Usage Logs: ${couponCode}` : "Coupon Usage Logs"}
        description={
          couponCode
            ? "Every order that redeemed this coupon, with the discount it took."
            : "Every coupon redemption across the store, newest first."
        }
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/marketing/coupon/coupon-list">
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Back to Coupons</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={fetchLogs}
        >
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-3">
          <div className="md:w-44">
            <DatePicker
              key={`from-${resetKey}`}
              value={startDate}
              onChange={setStartDate}
              placeholder="From date"
              maxDate={endDate}
              showIcon={false}
              className="h-9"
            />
          </div>
          <div className="md:w-44">
            <DatePicker
              key={`to-${resetKey}`}
              value={endDate}
              onChange={setEndDate}
              placeholder="To date"
              minDate={startDate}
              showIcon={false}
              className="h-9"
            />
          </div>
          <Button
            size="sm"
            className="h-9 gap-1.5 font-medium"
            onClick={applyDateRange}
          >
            <Filter className="size-4" /> Apply
          </Button>

          {hasDateRange && (
            <div className="flex items-center gap-2 md:ml-auto">
              <PillBadge className="font-medium">
                {[fromDate, toDate].filter(Boolean).join(" → ")}
              </PillBadge>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={clearDateRange}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingIndicator message="Loading usage logs..." />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <CalendarDays className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No usage logs found</p>
            <p className="text-xs text-muted-foreground">
              {hasDateRange
                ? "No coupon was redeemed within this date range. Try widening it."
                : couponCode
                  ? "This coupon hasn't been used yet."
                  : "No coupon redemptions have been recorded yet."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={hasDateRange ? clearDateRange : fetchLogs}
          >
            {hasDateRange ? "Clear date range" : "Refresh"}
          </Button>
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {stats ? (
              <>
                <StatsCard
                  icon={TicketPercent}
                  title="Total uses"
                  value={stats.totalUses.toLocaleString("en-US")}
                  description={couponCode}
                  bgColor="blue"
                />
                <StatsCard
                  icon={Percent}
                  title="Discount given"
                  value={`৳${bare(stats.totalDiscountGiven)}`}
                  description="Across all uses"
                  bgColor="green"
                />
                <StatsCard
                  icon={ShoppingBag}
                  title="Order value"
                  value={`৳${bare(stats.totalOrderValue)}`}
                  description="Orders that used this coupon"
                  bgColor="violet"
                />
                <StatsCard
                  icon={Package}
                  title="Avg. discount"
                  value={`৳${bare(stats.avgDiscountAmount)}`}
                  description="Per redemption"
                  bgColor="amber"
                />
              </>
            ) : (
              <>
                <StatsCard
                  icon={TicketPercent}
                  title="Total logs"
                  value={totalItems.toLocaleString("en-US")}
                  description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
                  bgColor="blue"
                />
                <StatsCard
                  icon={Package}
                  title="Showing"
                  value={logs.length.toLocaleString("en-US")}
                  description={`Of ${totalItems.toLocaleString("en-US")} logs`}
                  bgColor="violet"
                />
                <StatsCard
                  icon={Percent}
                  title="Discount given"
                  value={`৳${bare(pageDiscount)}`}
                  description="On this page"
                  bgColor="green"
                />
                <StatsCard
                  icon={ShoppingBag}
                  title="Order value"
                  value={`৳${bare(pageOrderValue)}`}
                  description="On this page"
                  bgColor="amber"
                />
              </>
            )}
          </div>

          {/* Usage logs */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Usage logs</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · newest first · {limit} per page
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {totalItems.toLocaleString("en-US")} total
              </PillBadge>
            </div>

            {/* Desktop table — nine columns need xl; below that the cards
                carry the same fields. Customer and Actions are pinned, the
                rest split the panel width equally and every column is left-
                aligned, so the gutters read identical: a right-aligned amount
                would end flush against the next column's boundary and close
                its gap. */}
            <div className="hidden xl:block">
              <Table className="report-table table-fixed [&_td]:px-1.5 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-1.5 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
                <TableHeader className="[&_th]:font-semibold">
                  <TableRow className="hover:bg-transparent">
                    {!couponCode && <TableHead>Coupon</TableHead>}
                    <TableHead className="w-56 xl:w-64 2xl:w-72">
                      Customer
                    </TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Order total</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Order status</TableHead>
                    <TableHead>Payment status</TableHead>
                    <TableHead>Used at</TableHead>
                    {/* Label is screen-reader only: at 56px the word
                        "Actions" overflows the cell. */}
                    <TableHead className="w-14 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const usedAt = splitStamp(log.createdAt);
                    return (
                      <TableRow key={log.id}>
                        {!couponCode && (
                          <TableCell className="py-2.5">
                            <PillBadge tone="blue" className="font-mono">
                              {log.couponCode}
                            </PillBadge>
                          </TableCell>
                        )}

                        <TableCell className="py-2.5">
                          {renderCustomer(log)}
                        </TableCell>

                        <TableCell>
                          <Link
                            href={`/admin/order/${log.order.id}/view`}
                            className="block truncate font-mono text-sm text-foreground hover:text-primaryColor hover:underline"
                            title={log.order.orderNo}
                          >
                            {log.order.orderNo}
                          </Link>
                        </TableCell>

                        <TableCell>
                          <p className="truncate text-sm tabular-nums">
                            {bare(log.orderTotal)}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="truncate text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                            −{bare(log.discountAmount)}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {log.discountType === "percentage"
                              ? `${bare(log.discountValue)}%`
                              : "Fixed"}
                          </p>
                        </TableCell>

                        <TableCell>{renderOrderStatus(log)}</TableCell>

                        <TableCell>{renderPaymentStatus(log)}</TableCell>

                        <TableCell className="text-muted-foreground">
                          <p
                            className="truncate text-xs tabular-nums"
                            title={formatDateTime(log.createdAt)}
                          >
                            {usedAt.day}
                          </p>
                          {usedAt.clock && (
                            <p className="truncate text-[11px] tabular-nums">
                              {usedAt.clock}
                            </p>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {renderActions(log)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y xl:hidden">
              {logs.map((log) => (
                <article key={log.id} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/order/${log.order.id}/view`}
                        className="font-mono text-sm font-semibold hover:text-primaryColor hover:underline"
                      >
                        {log.order.orderNo}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <PillBadge tone="blue" className="font-mono">
                        {log.couponCode}
                      </PillBadge>
                      {renderActions(log)}
                    </div>
                  </div>

                  {renderCustomer(log)}

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Order total
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        ৳{bare(log.orderTotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Discount
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                        −৳{bare(log.discountAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Order status
                      </p>
                      <div className="mt-1">{renderOrderStatus(log)}</div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Payment status
                      </p>
                      <div className="mt-1">{renderPaymentStatus(log)}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
              <p className="text-xs text-muted-foreground">
                Showing {firstRow.toLocaleString("en-US")}–
                {lastRow.toLocaleString("en-US")} of{" "}
                {totalItems.toLocaleString("en-US")} usage log
                {totalItems === 1 ? "" : "s"}
                {hasDateRange && ` · ${[fromDate, toDate].filter(Boolean).join(" → ")}`}
              </p>
              {totalPages > 1 && (
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl="#"
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
