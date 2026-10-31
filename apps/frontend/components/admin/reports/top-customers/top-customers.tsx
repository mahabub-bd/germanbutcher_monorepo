"use client";

import { PageHeader } from "@/components/admin/page-header";
import { ReportExcelButton } from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { PillBadge } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { cn, formatCurrencyEnglish, shortenArea } from "@/lib/utils";
import {
  Crown,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import StatsCard from "../../dashboard/stats-card";
import { TopCustomersPDF } from "./TopCustomersPDF";

interface CustomerStatistics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
}

export interface TopCustomer {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  isVerified: boolean;
  /** Area from the customer's default saved address (null if none). */
  area: string | null;
  statistics: CustomerStatistics;
}

type TimeFilter =
  | "this_month"
  | "last_3_months"
  | "last_6_months"
  | "last_year"
  | "this_year"
  | "all_time";

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  this_month: "This Month",
  last_3_months: "Last 3 Months",
  last_6_months: "Last 6 Months",
  last_year: "Last Year",
  this_year: "This Year",
  all_time: "All Time",
};

interface TopCustomersReportProps {
  customers: TopCustomer[];
  limit: number;
  sortBy: "orders" | "spending";
  timeFilter: TimeFilter;
}

/** Whole amounts only — report values never need decimal places. */
const amount = (value: number) => `৳${formatCurrencyEnglish(value || 0, 0)}`;

export default function TopCustomersReport({
  customers,
  limit,
  sortBy,
  timeFilter,
}: TopCustomersReportProps) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    params.set("limit", key === "limit" ? value : limit.toString());
    params.set("sortBy", key === "sortBy" ? value : sortBy);
    params.set("timeFilter", key === "timeFilter" ? value : timeFilter);
    startTransition(() => router.push(`?${params.toString()}`));
  };

  const handleRefresh = () => startTransition(() => router.refresh());

  // Totals across the ranked customers, for the summary cards and PDF.
  const totalOrders = customers.reduce(
    (sum, c) => sum + c.statistics.totalOrders,
    0
  );
  const totalSpent = customers.reduce(
    (sum, c) => sum + c.statistics.totalSpent,
    0
  );
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const hasData = customers.length > 0;
  const rangeLabel = TIME_FILTER_LABELS[timeFilter];
  const rankLabel = sortBy === "spending" ? "spending" : "orders";

  return (
    <div className="w-full">
      <PageHeader
        title="Top Customers Report"
        description={`Best customers by ${rankLabel} in ${rangeLabel.toLowerCase()} — ranked, with contact and spend.`}
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Top Customers Report"
              subtitle={`${rangeLabel} - Ranked by ${sortBy === "spending" ? "Spending" : "Orders"}`}
              headers={[
                "Rank",
                "Customer Name",
                "Mobile",
                "Area",
                "Orders",
                "Total Spent",
                "Avg Order",
              ]}
              rows={customers.map((customer, index) => [
                index + 1,
                customer.name,
                customer.mobileNumber,
                customer.area || "-",
                customer.statistics.totalOrders,
                customer.statistics.totalSpent,
                customer.statistics.averageOrderValue,
              ])}
              summary={[
                { label: "Time Filter", value: rangeLabel },
                {
                  label: "Ranked By",
                  value: sortBy === "spending" ? "Spending" : "Orders",
                },
              ]}
              fileName={`top-customers-${timeFilter}`}
            />
            <LazyPdfDownloadLink
              document={
                <TopCustomersPDF
                  customers={customers}
                  sortBy={sortBy}
                  timeFilterLabel={rangeLabel}
                  settings={settings}
                />
              }
              fileName={`top-customers-${timeFilter}-${new Date()
                .toISOString()
                .split("T")[0]}.pdf`}
            />
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleRefresh}
        >
          <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      {/* Filters — same card panel as ReportDateFilters, with the report's
          own limit / sort / time selects */}
      <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
        <div className="grid grid-cols-1 items-center gap-2.5 md:flex md:flex-nowrap md:items-center md:gap-3">
          <Select
            value={limit.toString()}
            onValueChange={(value) => updateFilter("limit", value)}
          >
            <SelectTrigger className="h-9 w-full md:w-44 md:shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Top 5</SelectItem>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="20">Top 20</SelectItem>
              <SelectItem value="50">Top 50</SelectItem>
              <SelectItem value="100">Top 100</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) => updateFilter("sortBy", value)}
          >
            <SelectTrigger className="h-9 w-full md:w-44 md:shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orders">By Orders</SelectItem>
              <SelectItem value="spending">By Spending</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={timeFilter}
            onValueChange={(value) => updateFilter("timeFilter", value)}
          >
            <SelectTrigger className="h-9 w-full md:w-44 md:shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(TIME_FILTER_LABELS) as [TimeFilter, string][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No customers matched</p>
            <p className="text-xs text-muted-foreground">
              Widen the time filter or raise the limit.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              startTransition(() =>
                router.push(
                  `?limit=${limit}&sortBy=${sortBy}&timeFilter=all_time`
                )
              )
            }
          >
            Search all time
          </Button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <StatsCard
              title="Top customers"
              value={String(customers.length)}
              description={`Ranked by ${rankLabel} in ${rangeLabel.toLowerCase()}`}
              icon={Crown}
              bgColor="blue"
            />
            <StatsCard
              title="Total orders"
              value={totalOrders.toLocaleString("en-US")}
              description="Orders placed by listed customers"
              icon={ShoppingCart}
              bgColor="green"
            />
            <StatsCard
              title="Total spent"
              value={amount(totalSpent)}
              description="Spend of listed customers"
              icon={TrendingUp}
              bgColor="purple"
            />
            <StatsCard
              title="Avg order value"
              value={amount(avgOrderValue)}
              description="Across listed customers"
              icon={Users}
              bgColor="orange"
            />
          </div>

          {/* Customers */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Customers</h3>
                <p className="text-xs text-muted-foreground">
                  Ranked by {rankLabel} · amounts in ৳ · {rangeLabel}
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {customers.length} row{customers.length === 1 ? "" : "s"}
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="pr-4 text-right">Avg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer, index) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/customer/${customer.id}/view`)
                      }
                    >
                      <TableCell className="py-2.5 pl-4">
                        {index === 0 ? (
                          <PillBadge tone="amber" className="gap-1">
                            <Crown className="size-3" />1
                          </PillBadge>
                        ) : (
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {index + 1}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/customer/${customer.id}/view`}
                            className="truncate text-sm font-medium text-foreground hover:text-primaryColor hover:underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {customer.name}
                          </Link>
                          {customer.isVerified && (
                            <PillBadge
                              tone="emerald"
                              className="px-1.5"
                              title="Verified customer"
                            >
                              ✓
                            </PillBadge>
                          )}
                        </div>
                        {customer.email && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {customer.email}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        {customer.mobileNumber ? (
                          <a
                            href={`tel:${customer.mobileNumber}`}
                            onClick={(event) => event.stopPropagation()}
                            className="text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {customer.mobileNumber}
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            No mobile
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {customer.area ? (
                          <PillBadge
                            tone="violet"
                            className="max-w-40 truncate font-normal"
                            title={customer.area}
                          >
                            {shortenArea(customer.area)}
                          </PillBadge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {customer.statistics.totalOrders}
                        </span>
                        {customer.statistics.pendingOrders > 0 && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400">
                            {customer.statistics.pendingOrders} pending
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrencyEnglish(
                            customer.statistics.totalSpent,
                            0
                          )}
                        </span>
                      </TableCell>

                      <TableCell className="pr-4 text-right">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {customer.statistics.totalOrders > 0
                            ? formatCurrencyEnglish(
                                customer.statistics.averageOrderValue,
                                0
                              )
                            : "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total
                    </TableCell>
                    <TableCell colSpan={3} />
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {totalOrders.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrencyEnglish(totalSpent, 0)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrencyEnglish(avgOrderValue, 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {customers.map((customer, index) => (
                <article key={customer.id} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      {index === 0 ? (
                        <PillBadge tone="amber" className="gap-1">
                          <Crown className="size-3" />1
                        </PillBadge>
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/customer/${customer.id}/view`}
                            className="truncate text-sm font-semibold hover:text-primaryColor hover:underline"
                          >
                            {customer.name}
                          </Link>
                          {customer.isVerified && (
                            <PillBadge
                              tone="emerald"
                              className="px-1.5"
                              title="Verified customer"
                            >
                              ✓
                            </PillBadge>
                          )}
                        </div>
                        {customer.mobileNumber && (
                          <a
                            href={`tel:${customer.mobileNumber}`}
                            className="text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {customer.mobileNumber}
                          </a>
                        )}
                      </div>
                    </div>
                    {customer.area && (
                      <PillBadge
                        tone="violet"
                        className="max-w-36 shrink-0 truncate font-normal"
                        title={customer.area}
                      >
                        {shortenArea(customer.area)}
                      </PillBadge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Orders
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {customer.statistics.totalOrders}
                      </p>
                      {customer.statistics.pendingOrders > 0 && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                          {customer.statistics.pendingOrders} pending
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Spent
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(customer.statistics.totalSpent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Avg
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {customer.statistics.totalOrders > 0
                          ? amount(customer.statistics.averageOrderValue)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing top {customers.length} customer
                {customers.length === 1 ? "" : "s"} by {rankLabel} in{" "}
                {rangeLabel.toLowerCase()}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
