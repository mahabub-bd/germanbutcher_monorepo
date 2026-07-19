"use client";

import { DateRangePreset } from "@/common/enums";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { formatCurrencyEnglish } from "@/lib/utils";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { ShoppingCart, TrendingUp, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerListPDF } from "./CustomerListPDF";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface Customer {
  name: string;
  email: string;
  mobileNumber: string;
  registrationDate: string;
  orderCount: number;
  totalOrderAmount: number;
}

interface Summary {
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

  const [startDate, setStartDate] = useState<Date | undefined>(
    fromDate ? new Date(fromDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    toDate ? new Date(toDate) : undefined
  );
  const [quickRange, setQuickRange] = useState<string>(preset || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("fromDate", format(startDate, "yyyy-MM-dd"));
    if (endDate) params.set("toDate", format(endDate, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`);
  };

  const handleQuickRange = (value: string) => {
    setQuickRange(value);
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;

    switch (value) {
      case DateRangePreset.TODAY:
        from = today;
        to = today;
        break;
      case DateRangePreset.THIS_WEEK:
        from = startOfWeek(today, { weekStartsOn: 6 });
        to = endOfWeek(today, { weekStartsOn: 6 });
        break;
      case DateRangePreset.LAST_WEEK:
        from = subWeeks(startOfWeek(today, { weekStartsOn: 6 }), 1);
        to = subWeeks(endOfWeek(today, { weekStartsOn: 6 }), 1);
        break;
      case DateRangePreset.THIS_MONTH:
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case DateRangePreset.LAST_MONTH:
        const lastMonth = subMonths(today, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case DateRangePreset.LAST_3_MONTHS:
        from = subMonths(today, 3);
        to = today;
        break;
      case DateRangePreset.LAST_6_MONTHS:
        from = subMonths(today, 6);
        to = today;
        break;
      case DateRangePreset.LAST_YEAR:
        from = subYears(today, 1);
        to = today;
        break;
      case DateRangePreset.THIS_YEAR:
        from = new Date(today.getFullYear(), 0, 1);
        to = today;
        break;
      default:
        from = undefined;
        to = undefined;
    }

    setStartDate(from);
    setEndDate(to);

    const params = new URLSearchParams();
    if (value) params.set("preset", value);
    router.push(`?${params.toString()}`);
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setQuickRange("");
    router.push("?");
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
      <PageHeader
        title="Customer List Report"
        description="View customer registration and order statistics"
      />

      {/* Filters + Export */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Range Dropdown */}
          <Select value={quickRange} onValueChange={handleQuickRange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Quick Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DateRangePreset.TODAY}>Today</SelectItem>
              <SelectItem value={DateRangePreset.THIS_WEEK}>This Week</SelectItem>
              <SelectItem value={DateRangePreset.LAST_WEEK}>Last Week</SelectItem>
              <SelectItem value={DateRangePreset.THIS_MONTH}>
                This Month
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_MONTH}>
                Last Month
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_3_MONTHS}>
                Last 3 Months
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_6_MONTHS}>
                Last 6 Months
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_YEAR}>Last Year</SelectItem>
              <SelectItem value={DateRangePreset.THIS_YEAR}>This Year</SelectItem>
            </SelectContent>
          </Select>

          {/* Manual Date Pickers */}
          <DatePicker
            value={startDate}
            onChange={(date) => setStartDate(date)}
            placeholder="From Date"
            className="w-[200px]"
          />
          <DatePicker
            value={endDate}
            onChange={(date) => setEndDate(date)}
            placeholder="To Date"
            className="w-[200px]"
          />

          <Button onClick={handleFilter}>Filter</Button>
          {(startDate || endDate) && (
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {customers.length > 0 && mounted && (
            <PDFDownloadLink
              document={
                <CustomerListPDF
                  customers={customers}
                  summary={summary}
                  dateRange={dateRange}
                />
              }
              fileName={`customer-list-${new Date().toISOString().split("T")[0]}.pdf`}
            >
              {({ loading, error }) => (
                <Button variant="secondary" disabled={!!error}>
                  {error ? "PDF Error" : loading ? "Generating PDF..." : "Download PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

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
            count={formatCurrencyEnglish(summary.totalOrderValue)}
            description="All customer orders"
            icon={ShoppingCart}
            bgColor="green"
          />
          <StatsCard
            title="Total Order Value"
            value={formatCurrencyEnglish(summary.totalOrderValue)}
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
                  summary.totalOrderValue / summary.totalCustomers
                )
                : "৳0"
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
