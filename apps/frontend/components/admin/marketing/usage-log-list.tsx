"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { ListPaginationFooter } from "@/components/common/list-pagination-footer";
import { PillBadge } from "@/components/common/pill-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import { format } from "date-fns";
import {
  CalendarDays,
  Filter,
  ListOrdered,
  ShoppingBag,
  SlidersHorizontal,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

/**
 * The three campaign usage-log pages (free delivery, flash sale, BOGO) publish
 * identical rows — a customer, an order, the campaign credited and the amount
 * it saved. This component renders that shared shape so all three stay in step.
 */
export interface MarketingUsageLog {
  id: number;
  campaignName: string;
  campaign?: { id: number; name: string };
  order?: { id: number; orderNo: string };
  user?: { id: number; name: string; email: string };
  discountAmount?: string | number;
  shippingWaived?: string | number;
  orderTotal: string | number;
  createdAt: string;
}

interface MarketingUsageLogListProps {
  /** API path without the query string, e.g. `free-delivery-usage-logs`. */
  endpoint: string;
  title: string;
  description: string;
  /** Shown in the empty state, explaining when rows start appearing. */
  emptyHint: string;
  icon: LucideIcon;
  /** Wallet-side column: what the campaign gave away. */
  valueLabel: string;
  valueKey: "discountAmount" | "shippingWaived";
  /** Discounts read as a deduction; waived shipping as a saving. */
  negateValue?: boolean;
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

export function MarketingUsageLogList({
  endpoint,
  title,
  description,
  emptyHint,
  icon: Icon,
  valueLabel,
  valueKey,
  negateValue = false,
  initialPage = 1,
  initialLimit = 10,
  initialSearchParams = {},
}: MarketingUsageLogListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [logs, setLogs] = useState<MarketingUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Below `md` the date-range filters collapse into a bottom sheet.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fromDate, setFromDate] = useState(getInitialParam("fromDate") as string);
  const [toDate, setToDate] = useState(getInitialParam("toDate") as string);
  // DatePicker keeps its own copy of the picked date, so Clear bumps this key
  // to remount both pickers without a stale selection.
  const [resetKey, setResetKey] = useState(0);
  const [startDate, setStartDate] = useState<Date | undefined>(
    fromDate ? new Date(fromDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    toDate ? new Date(toDate) : undefined
  );

  const hasDateRange = Boolean(fromDate || toDate);

  const activeFilterCount = hasDateRange ? 1 : 0;

  // One source of truth for the date-range pickers: the toolbar renders them
  // inline ("bar") at md+, the mobile sheet renders the same nodes full width
  // ("sheet") under a visible label.
  const renderFilterControls = (mode: "bar" | "sheet") => {
    const wrapClass = mode === "bar" ? "md:w-44" : "w-full";
    const pickerClass = mode === "bar" ? "h-9 w-full" : "h-11 w-full";

    return [
      {
        key: "from",
        label: "From date",
        wrapClass,
        node: (
          <DatePicker
            key={`from-${resetKey}`}
            value={startDate}
            onChange={setStartDate}
            placeholder="From date"
            maxDate={endDate}
            showIcon={false}
            className={pickerClass}
          />
        ),
      },
      {
        key: "to",
        label: "To date",
        wrapClass,
        node: (
          <DatePicker
            key={`to-${resetKey}`}
            value={endDate}
            onChange={setEndDate}
            placeholder="To date"
            minDate={startDate}
            showIcon={false}
            className={pickerClass}
          />
        ),
      },
    ];
  };

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
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const response = await fetchDataPagination<{
        data: MarketingUsageLog[];
        total: number;
        totalPages: number;
      }>(`${endpoint}?${params.toString()}`);

      setLogs(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      toast.error("Failed to load usage logs. Please try again.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, currentPage, limit, fromDate, toDate]);

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

  const valueOf = (log: MarketingUsageLog) => Number(log[valueKey] || 0);

  const pageValue = logs.reduce((sum, log) => sum + valueOf(log), 0);
  const pageOrderValue = logs.reduce(
    (sum, log) => sum + Number(log.orderTotal || 0),
    0
  );

  const valueSign = negateValue ? "−" : "";

  const renderCustomer = (log: MarketingUsageLog) => (
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

  return (
    <div className="w-full">
      <PageHeader title={title} description={description} />

      {/* Toolbar */}
      <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap md:gap-3">
          {/* Mobile: date-range filters collapse into a bottom sheet */}
          <div className="shrink-0 md:hidden">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <SlidersHorizontal className="size-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="size-4.5 rounded-full px-0 text-[0.65rem] font-semibold">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="inset-x-3 max-h-[82dvh] gap-0 overflow-y-auto rounded-2xl"
              >
                <SheetHeader className="border-b pr-14">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Narrow usage logs by date range.
                  </SheetDescription>
                </SheetHeader>

                {renderFilterControls("sheet").map((control) => (
                  <div key={control.key} className="px-4 pt-4">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {control.label}
                    </p>
                    {control.node}
                  </div>
                ))}

                <SheetFooter className="sticky bottom-0 mt-4 flex-row border-t bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      clearDateRange();
                      setFilterSheetOpen(false);
                    }}
                  >
                    Clear all
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1" onClick={applyDateRange}>
                      Apply
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: inline date-range controls */}
          <div className="hidden items-center gap-3 md:flex">
            {renderFilterControls("bar").map((control) => (
              <div key={control.key} className={control.wrapClass}>
                {control.node}
              </div>
            ))}
            <Button
              size="sm"
              className="h-9 shrink-0 gap-1.5 font-medium"
              onClick={applyDateRange}
            >
              <Filter className="size-4" /> Apply
            </Button>
          </div>

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
                ? "Nothing was logged inside this date range. Try widening it."
                : emptyHint}
            </p>
          </div>
          {hasDateRange && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearDateRange}
            >
              Clear date range
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <StatsCard
              icon={Icon}
              title="Total logs"
              value={totalItems.toLocaleString("en-US")}
              description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
              bgColor="blue"
            />
            <StatsCard
              icon={ListOrdered}
              title="Showing"
              value={logs.length.toLocaleString("en-US")}
              description={`Of ${totalItems.toLocaleString("en-US")} logs`}
              bgColor="violet"
            />
            <StatsCard
              icon={Icon}
              title={valueLabel}
              value={`৳${bare(pageValue)}`}
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

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table min-w-170">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Customer</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">{valueLabel}</TableHead>
                    <TableHead className="text-right">Order total</TableHead>
                    <TableHead className="pr-4">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="py-2.5 pl-4">
                        {renderCustomer(log)}
                      </TableCell>

                      <TableCell>
                        {log.order?.orderNo ? (
                          <Link
                            href={
                              log.order.id
                                ? `/admin/order/${log.order.orderNo}/view`
                                : "/admin/orders"
                            }
                            className="font-mono text-sm text-foreground hover:text-primaryColor hover:underline"
                          >
                            {log.order.orderNo}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <PillBadge tone="violet" className="max-w-60 truncate">
                          {log.campaignName}
                        </PillBadge>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {valueSign}৳{bare(valueOf(log))}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {bare(log.orderTotal)}
                        </span>
                      </TableCell>

                      <TableCell className="pr-4 text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {logs.map((log) => (
                <article key={log.id} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {log.order?.orderNo ? (
                        <Link
                          href={
                            log.order.id
                              ? `/admin/order/${log.order.orderNo}/view`
                              : "/admin/orders"
                          }
                          className="font-mono text-sm font-semibold hover:text-primaryColor hover:underline"
                        >
                          {log.order.orderNo}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold">No order</p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                    <PillBadge tone="violet" className="max-w-40 truncate">
                      {log.campaignName}
                    </PillBadge>
                  </div>

                  {renderCustomer(log)}

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {valueLabel}
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {valueSign}৳{bare(valueOf(log))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Order total
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        ৳{bare(log.orderTotal)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <ListPaginationFooter
              currentPage={currentPage}
              limit={limit}
              totalItems={totalItems}
              totalPages={totalPages}
              entityLabel="usage log"
              entityLabelPlural="usage logs"
              onPageChange={setCurrentPage}
              filterSummary={
                hasDateRange
                  ? [fromDate, toDate].filter(Boolean).join(" → ")
                  : undefined
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
