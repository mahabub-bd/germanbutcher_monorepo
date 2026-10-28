"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import {
  ReportDateFilters,
  type ReportFilterParams,
} from "@/components/admin/reports/report-date-filters";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { ReportExcelButton, dateRangeSubtitle } from "@/components/admin/reports/download-excel-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyEnglish } from "@/lib/utils";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { format } from "date-fns";
import { ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerListPDF } from "./CustomerListPDF";

export interface Customer {
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

export default function CustomerListReport({
  customers,
  fromDate,
  toDate,
  preset,
  summary,
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const settings = useBusinessSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);
    router.push(`?${qs.toString()}`);
  };

  // Calculate date range only on client side to avoid hydration issues
  const dateRange =
    summary?.from && summary?.to && mounted
      ? `${format(new Date(summary.from), "PPp")} - ${format(
        new Date(summary.to),
        "PPp"
      )}`
      : "All Time";

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Customer List Report"
        />
        {customers.length > 0 && mounted && (
          <div className="flex shrink-0 gap-2">
            <ReportExcelButton
              title="Customer List Report"
              subtitle={dateRangeSubtitle(preset, fromDate, toDate)}
                            headers={[
                "#",
                "Customer Name",
                "Email",
                "Mobile",
                "Registration Date",
                "Order Count",
                "Total Order Amount",
              ]}
              rows={customers.map((c, i) => [
                i + 1,
                c.name,
                c.email || "—",
                c.mobileNumber,
                c.registrationDate,
                c.orderCount,
                c.totalOrderAmount,
              ])}
              summary={[
                { label: "Total Customers", value: String(summary?.totalCustomers ?? customers.length) },
                { label: "Total Orders", value: String(summary?.totalOrders ?? 0) },
                { label: "Total Order Value", value: formatCurrencyEnglish(summary?.totalOrderValue ?? 0, 0) },
              ]}
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
              fileName={`customer-list-${new Date().toISOString().split("T")[0]}.pdf`}
             />
          </div>
        )}
      </div>

      {/* Filters — shared single-row filter bar (identical on all report pages) */}
      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={handleFilterApply}
      />

      {/* Summary */}
      {summary && (
        <div className="mb-4 grid grid-cols-2 2xl:grid-cols-4 gap-3">
          <StatsCard
            title="Total Customers"
            value={String(summary.totalCustomers)}
            count={String(summary.totalOrders)}
            description="Registered customers"
            icon={Users}
            bgColor="blue"
          />
          <StatsCard
            title="Total Orders"
            value={String(summary.totalOrders)}
            count={formatCurrencyEnglish(summary.totalOrderValue, 0)}
            description="All customer orders"
            icon={ShoppingCart}
            bgColor="green"
          />
          <StatsCard
            title="Total Order Value"
            value={formatCurrencyEnglish(summary.totalOrderValue, 0)}
            count={String(summary.totalCustomers)}
            description="Sum of all orders"
            icon={ShoppingCart}
            bgColor="purple"
          />
          <StatsCard
            title="Avg Per Customer"
            value={
              summary.totalCustomers > 0
                ? formatCurrencyEnglish(
                  summary.totalOrderValue / summary.totalCustomers,
                  0
                )
                : "BDT 0"
            }
            icon={TrendingUp}
            count={String(summary.totalCustomers)}
            description="Average order value"
            bgColor="orange"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Email</TableHead>
              <TableHead className="text-xs">Mobile</TableHead>
              <TableHead className="text-xs">Registration Date</TableHead>
              <TableHead className="text-xs">Order Count</TableHead>
              <TableHead className="text-xs">Total Order Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer, index) => (
                <TableRow key={`${customer.email}-${index}`}>
                  <TableCell className="font-medium">
                    {customer.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {customer.email}
                  </TableCell>
                  <TableCell>{customer.mobileNumber}</TableCell>
                  <TableCell>
                    {format(new Date(customer.registrationDate), "PPp")}
                  </TableCell>
                  <TableCell>{customer.orderCount}</TableCell>
                  <TableCell>
                    {formatCurrencyEnglish(customer.totalOrderAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Note */}
      {mounted && summary?.from && summary?.to && (
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Report Period: {dateRange}
        </p>
      )}
    </div>
  );
}
