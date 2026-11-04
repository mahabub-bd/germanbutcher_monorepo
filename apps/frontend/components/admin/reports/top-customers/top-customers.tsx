"use client";

import { PageHeader } from "@/components/admin/page-header";
import { ReportExcelButton } from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { PillBadge } from "@/components/common/pill-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish, shortenArea } from "@/lib/utils";
import {
  Crown,
  Mail,
  MapPin,
  ShoppingCart,
  SlidersHorizontal,
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
  // Below `md` the filter selects collapse into a bottom sheet.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [, startTransition] = useTransition();

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

  // One source of truth for the filter controls: the toolbar renders them
  // inline ("bar") at md+, the mobile sheet renders the same nodes full width
  // ("sheet") under a visible label. Every select applies immediately.
  const renderFilterControls = (mode: "bar" | "sheet") => {
    const triggerClass =
      mode === "bar" ? "h-9 w-full" : "h-11 w-full px-3 text-sm font-medium";

    return [
      {
        key: "limit",
        label: "Customers",
        barClass: "md:w-44 md:shrink-0",
        node: (
          <Select
            value={limit.toString()}
            onValueChange={(value) => updateFilter("limit", value)}
          >
            <SelectTrigger className={triggerClass}>
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
        ),
      },
      {
        key: "sortBy",
        label: "Rank by",
        barClass: "md:w-44 md:shrink-0",
        node: (
          <Select
            value={sortBy}
            onValueChange={(value) => updateFilter("sortBy", value)}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orders">By Orders</SelectItem>
              <SelectItem value="spending">By Spending</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "timeFilter",
        label: "Time range",
        barClass: "md:w-44 md:shrink-0",
        node: (
          <Select
            value={timeFilter}
            onValueChange={(value) => updateFilter("timeFilter", value)}
          >
            <SelectTrigger className={triggerClass}>
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
        ),
      },
    ];
  };

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
                "Email",
                "Area",
                "Orders",
                "Total Spent",
                "Avg Order",
              ]}
              rows={customers.map((customer, index) => [
                index + 1,
                customer.name,
                customer.mobileNumber,
                customer.email || "-",
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
      </PageHeader>

      {/* Filters — same card panel as ReportDateFilters; inline row at md+,
          bottom sheet on mobile */}
      <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex items-center gap-2.5 md:gap-3">
          {/* Mobile: filters collapse into a bottom sheet */}
          <div className="shrink-0 md:hidden">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <SlidersHorizontal className="size-3.5" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="inset-x-3 max-h-[82dvh] gap-0 overflow-y-auto rounded-2xl"
              >
                <SheetHeader className="border-b pr-14">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Choose how many customers to show, the ranking and the
                    time window.
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
                  <SheetClose asChild>
                    <Button className="flex-1">Done</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: inline filter controls */}
          <div className="hidden items-center gap-3 md:flex">
            {renderFilterControls("bar").map((control) => (
              <div key={control.key} className={control.barClass}>
                {control.node}
              </div>
            ))}
          </div>
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
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
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
                          <PillBadge tone="amber" className="gap-1 text-sm">
                            <Crown className="size-3.5" />1
                          </PillBadge>
                        ) : (
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {index + 1}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/admin/customer/${customer.id}/view`}
                          className="truncate text-sm font-medium text-foreground hover:text-primaryColor hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {customer.name}
                        </Link>
                      </TableCell>

                      <TableCell>
                        {customer.mobileNumber ? (
                          <a
                            href={`tel:${customer.mobileNumber}`}
                            onClick={(event) => event.stopPropagation()}
                            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {customer.mobileNumber}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No mobile
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {customer.email ? (
                          <a
                            href={`mailto:${customer.email}`}
                            onClick={(event) => event.stopPropagation()}
                            className="block max-w-48 truncate text-sm text-blue-600 hover:underline dark:text-blue-400"
                            title={customer.email}
                          >
                            {customer.email}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No email
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {customer.area ? (
                          <Badge
                            variant="secondary"
                            className="max-w-52 truncate border-transparent bg-violet-100 font-normal text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                            title={customer.area}
                          >
                            <span className="hidden min-w-0 items-center gap-1 2xl:flex">
                              <MapPin className="size-3 shrink-0" />
                              <span className="truncate">
                                {shortenArea(customer.area, 5)}
                              </span>
                            </span>
                            <span className="flex min-w-0 items-center gap-1 2xl:hidden">
                              <MapPin className="size-3 shrink-0" />
                              <span className="truncate">
                                {shortenArea(customer.area)}
                              </span>
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {customer.statistics.totalOrders}
                        </span>
                        {customer.statistics.pendingOrders > 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
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
                    <TableCell colSpan={4} />
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
                        </div>
                        {customer.mobileNumber && (
                          <a
                            href={`tel:${customer.mobileNumber}`}
                            className="text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {customer.mobileNumber}
                          </a>
                        )}
                        {customer.email && (
                          <a
                            href={`mailto:${customer.email}`}
                            className="flex min-w-0 items-center gap-1 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                          >
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    {customer.area && (
                      <Badge
                        variant="secondary"
                        className="max-w-36 truncate border-transparent bg-violet-100 font-normal text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                        title={customer.area}
                      >
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">
                            {shortenArea(customer.area)}
                          </span>
                        </span>
                      </Badge>
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
