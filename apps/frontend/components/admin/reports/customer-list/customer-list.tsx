"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import {
  ReportExcelButton,
  dateRangeSubtitle,
} from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import {
  ReportDateFilters,
  type ReportFilterParams,
} from "@/components/admin/reports/report-date-filters";
import { PillBadge } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
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
import { formatCurrencyEnglish } from "@/lib/utils";
import { Mail, Phone, ShoppingCart, TrendingUp, User, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CustomerListPDF } from "./CustomerListPDF";

export interface Customer {
  id?: number;
  name: string;
  email: string;
  mobileNumber: string;
  registrationDate: string;
  orderCount: number;
  totalOrderAmount: number;
}

export interface Summary {
  totalCustomers: number;
  totalOrders: number;
  totalOrderValue: number;
  from?: string;
  to?: string;
}

interface Props {
  customers: Customer[];
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary;
}

/** Whole amounts only — report values never need decimal places. */
const bare = (value: number) => formatCurrencyEnglish(value || 0, 0);
/** Cards and mobile rows carry the ৳ mark; table cells rely on the header note. */
const amount = (value: number) => `৳${bare(value)}`;

/** Two-line registration cell (Dhaka timezone, client-only so no hydration drift). */
const formatDate = (input: string | Date) => {
  const d = input instanceof Date ? input : new Date(input);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });
};

const formatTime = (input: string | Date) => {
  const d = input instanceof Date ? input : new Date(input);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  });
};

export default function CustomerListReport({
  customers,
  fromDate,
  toDate,
  preset,
  summary,
}: Props) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);
    startTransition(() => router.push(`?${qs.toString()}`));
  };

  // Calculate date range only on client side to avoid hydration issues
  const dateRange =
    summary?.from && summary?.to && mounted
      ? `${formatDate(summary.from)} ${formatTime(summary.from)} - ${formatDate(
        summary.to
      )} ${formatTime(summary.to)}`
      : "All Time";

  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const hasData = customers.length > 0;

  const totalOrders = customers.reduce((sum, c) => sum + c.orderCount, 0);
  const totalAmount = customers.reduce(
    (sum, c) => sum + (c.totalOrderAmount || 0),
    0
  );

  const excelRows = customers.map((c, i) => [
    i + 1,
    c.name,
    c.email || "—",
    c.mobileNumber,
    formatDate(c.registrationDate),
    c.orderCount,
    c.totalOrderAmount,
  ]);

  const excelSummary = [
    {
      label: "Total Customers",
      value: String(summary?.totalCustomers ?? customers.length),
    },
    { label: "Total Orders", value: String(summary?.totalOrders ?? 0) },
    {
      label: "Total Order Value",
      value: formatCurrencyEnglish(summary?.totalOrderValue ?? 0, 0),
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Customer List Report"
        description={`Registered customers in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()} — contact, registration and order totals.`}
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Customer List Report"
              subtitle={rangeLabel}
              headers={[
                "#",
                "Customer Name",
                "Email",
                "Mobile",
                "Registration Date",
                "Order Count",
                "Total Order Amount",
              ]}
              rows={excelRows}
              summary={excelSummary}
              fileName="customer-list"
            />
            <LazyPdfDownloadLink
              document={
                <CustomerListPDF
                  customers={customers}
                  summary={summary}
                  dateRange={dateRange}
                  settings={settings}
                />
              }
              fileName={`customer-list-${new Date()
                .toISOString()
                .split("T")[0]
                }.pdf`}
            />
          </>
        )}
      </PageHeader>

      {/* Filters — shared single-row filter bar (identical on all report pages) */}
      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={handleFilterApply}
      />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No customers found</p>
            <p className="text-xs text-muted-foreground">
              No accounts were registered in the selected period.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              startTransition(() => router.push("?preset=this_year"))
            }
          >
            Search this year
          </Button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <StatsCard
              title="Total Customers"
              value={String(summary.totalCustomers)}
              description="Registered in range"
              icon={Users}
              bgColor="blue"
            />
            <StatsCard
              title="Total Orders"
              value={String(summary.totalOrders)}
              description="Placed by listed customers"
              icon={ShoppingCart}
              bgColor="green"
            />
            <StatsCard
              title="Total Order Value"
              value={amount(summary.totalOrderValue)}
              description="Sum of all orders"
              icon={TrendingUp}
              bgColor="purple"
            />
            <StatsCard
              title="Avg Per Customer"
              value={
                summary.totalCustomers > 0
                  ? amount(summary.totalOrderValue / summary.totalCustomers)
                  : "৳0"
              }
              description="Average spend per customer"
              icon={User}
              bgColor="orange"
            />
          </div>

          {/* Customers */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Customers</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · Dhaka time · newest registration first
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
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="pr-4 text-right">
                      Total Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer, index) => (
                    <TableRow key={`${customer.email}-${index}`}>
                      <TableCell className="py-2.5 pl-4">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {index + 1}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="min-w-0">
                          {customer.id ? (
                            <Link
                              href={`/admin/customer/${customer.id}/view`}
                              className="truncate text-sm font-medium text-foreground hover:text-primaryColor hover:underline"
                            >
                              {customer.name}
                            </Link>
                          ) : (
                            <span className="truncate text-sm font-medium">
                              {customer.name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {customer.email ? (
                          <a
                            href={`mailto:${customer.email}`}
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
                        {customer.mobileNumber ? (
                          <a
                            href={`tel:${customer.mobileNumber}`}
                            className="text-sm whitespace-nowrap text-blue-600 hover:underline dark:text-blue-400"
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
                        <span className="whitespace-nowrap text-sm font-medium">
                          {formatDate(customer.registrationDate)}
                        </span>
                        <span className="whitespace-nowrap text-sm text-muted-foreground">
                          {" "}
                          {formatTime(customer.registrationDate)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {customer.orderCount}
                        </span>
                      </TableCell>

                      <TableCell className="pr-4 text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(customer.totalOrderAmount)}
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
                    <TableCell className="pr-4 text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(totalAmount)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {customers.map((customer, index) => (
                <article key={`${customer.email}-${index}`} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                        <User className="size-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        {customer.id ? (
                          <Link
                            href={`/admin/customer/${customer.id}/view`}
                            className="block truncate text-sm font-semibold hover:text-primaryColor hover:underline"
                          >
                            {customer.name}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-semibold">
                            {customer.name}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(customer.registrationDate)} ·{" "}
                          {formatTime(customer.registrationDate)}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}`}
                        className="flex min-w-0 items-center gap-1.5 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                      >
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </a>
                    )}
                    {customer.mobileNumber && (
                      <a
                        href={`tel:${customer.mobileNumber}`}
                        className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                      >
                        <Phone className="size-3 shrink-0" />
                        {customer.mobileNumber}
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Orders
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {customer.orderCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Total Amount
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(customer.totalOrderAmount)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <div className="border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing all {customers.length} customer
                {customers.length === 1 ? "" : "s"} in {rangeLabel.toLowerCase()}
                {summary.totalOrderValue > 0 && (
                  <> · {amount(totalAmount)} total order value</>
                )}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
