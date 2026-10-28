"use client";

import { PageHeader } from "@/components/admin/page-header";
import { ReportExcelButton } from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { Badge } from "@/components/ui/badge";
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
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish } from "@/lib/utils";
import {
  BarChart3,
  Crown,
  Phone,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function TopCustomersReport({
  customers,
  limit,
  sortBy,
  timeFilter,
}: TopCustomersReportProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const settings = useBusinessSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    params.set(
      "limit",
      key === "limit" ? value : limit.toString()
    );
    params.set(
      "sortBy",
      key === "sortBy" ? value : sortBy
    );
    params.set(
      "timeFilter",
      key === "timeFilter" ? value : timeFilter
    );
    router.push(`?${params.toString()}`);
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

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Top Customers Report"
          description="Best customers by orders and spending"
        />
        <div className="flex shrink-0 gap-2">
          {customers.length > 0 && mounted && (
            <>
              <ReportExcelButton
                title="Top Customers Report"
                subtitle={`${TIME_FILTER_LABELS[timeFilter]} - Ranked by ${sortBy === "spending" ? "Spending" : "Orders"}`}
                headers={["Rank", "Customer Name", "Mobile", "Area", "Orders", "Total Spent", "Avg Order"]}
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
                  { label: "Time Filter", value: TIME_FILTER_LABELS[timeFilter] },
                  { label: "Ranked By", value: sortBy === "spending" ? "Spending" : "Orders" },
                ]}
                fileName={`top-customers-${timeFilter}`}
              />
              <LazyPdfDownloadLink
                document={
                  <TopCustomersPDF
                    customers={customers}
                    sortBy={sortBy}
                    timeFilterLabel={TIME_FILTER_LABELS[timeFilter]}
                    settings={settings}
                  />
                }
                fileName={`top-customers-${timeFilter}-${new Date()
                  .toISOString()
                  .split("T")[0]}.pdf`}
              />
            </>
          )}
        </div>
      </div>

      {/* Filters — card-style filter panel matching ReportDateFilters */}
      <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
        <div className="grid grid-cols-1 items-center gap-2.5 md:flex md:flex-nowrap md:items-center md:gap-3">
          <Select
            value={limit.toString()}
            onValueChange={(value) => updateFilter("limit", value)}
          >
            <SelectTrigger className="w-full md:w-44 md:shrink-0 h-9">
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
            <SelectTrigger className="w-full md:w-44 md:shrink-0 h-9">
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
            <SelectTrigger className="w-full md:w-44 md:shrink-0 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-3">
        <StatsCard
          title="Top Customers"
          value={String(customers.length)}
          count={TIME_FILTER_LABELS[timeFilter]}
          description={`Ranked by ${sortBy === "spending" ? "spending" : "orders"}`}
          icon={Crown}
          bgColor="blue"
        />
        <StatsCard
          title="Total Orders"
          value={String(totalOrders)}
          count={String(customers.length)}
          description="Orders of listed customers"
          icon={ShoppingCart}
          bgColor="green"
        />
        <StatsCard
          title="Total Spent"
          value={formatCurrencyEnglish(totalSpent, 0)}
          count={String(customers.length)}
          description="Sum of listed customers"
          icon={TrendingUp}
          bgColor="purple"
        />
        <StatsCard
          title="Avg Order Value"
          value={formatCurrencyEnglish(avgOrderValue, 0)}
          count={String(totalOrders)}
          description="Across listed customers"
          icon={Users}
          bgColor="orange"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12.5 sm:w-15 text-xs sm:text-sm font-bold h-9 sm:h-10">
                Rank
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-bold h-9 sm:h-10">Customer</TableHead>
              <TableHead className="hidden md:table-cell text-xs sm:text-sm font-bold h-9 sm:h-10">
                Contact
              </TableHead>
              <TableHead className="hidden xl:table-cell text-xs sm:text-sm font-bold h-9 sm:h-10">
                Area
              </TableHead>
              <TableHead className="text-center text-xs sm:text-sm font-bold h-9 sm:h-10">Orders</TableHead>
              <TableHead className="text-right text-xs sm:text-sm font-bold h-9 sm:h-10">Spent</TableHead>
              <TableHead className="text-right text-xs sm:text-sm font-bold h-9 sm:h-10 hidden lg:table-cell">
                Avg
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 sm:py-8 text-muted-foreground"
                >
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-sm">No customers found</p>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer, index) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/admin/customer/${customer.id}/view`)
                  }
                >
                  {/* Rank */}
                  <TableCell className="py-1.5 sm:py-2 text-xs sm:text-sm">
                    {index + 1}
                  </TableCell>

                  {/* Customer */}
                  <TableCell className="py-1.5 sm:py-2">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-xs sm:text-sm truncate max-w-25 sm:max-w-37.5">
                        {customer.name}
                      </span>
                      {customer.isVerified && (
                        <Badge
                          variant="default"
                          className="text-[10px] 2xl:text-xs h-3.5 sm:h-4 px-1"
                        >
                          ✓
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="hidden md:table-cell py-1.5 sm:py-2">
                    <Badge variant="outline" className="h-5 px-1.5 text-xs sm:text-sm">
                      <Phone className="h-3.5 w-3.5 shrink-0" />{customer.mobileNumber}
                    </Badge>
                  </TableCell>

                  {/* Area */}
                  <TableCell className="hidden xl:table-cell py-1.5 sm:py-2">
                    <span className="text-xs sm:text-sm">
                      {customer.area || "—"}
                    </span>
                  </TableCell>

                  {/* Orders */}
                  <TableCell className="text-center py-1.5 sm:py-2">
                    <div className="flex flex-col items-center">
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs sm:text-sm font-bold">
                        <ShoppingBag className="h-3.5 w-3.5" />{customer.statistics.totalOrders}
                      </Badge>
                      {customer.statistics.pendingOrders > 0 && (
                        <span className="text-xs sm:text-sm text-yellow-600">
                          {customer.statistics.pendingOrders}p
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Total Spent */}
                  <TableCell className="text-right py-1.5 sm:py-2">
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs sm:text-sm font-bold">
                      <Wallet className="h-3.5 w-3.5" />{formatCurrencyEnglish(customer.statistics.totalSpent)}
                    </Badge>
                  </TableCell>

                  {/* Average */}
                  <TableCell className="text-right py-1.5 sm:py-2 hidden lg:table-cell">
                    <Badge variant="outline" className="h-5 px-1.5 text-xs sm:text-sm font-normal text-muted-foreground">
                      <BarChart3 className="h-3.5 w-3.5" />
                      {customer.statistics.totalOrders > 0
                        ? formatCurrencyEnglish(
                          customer.statistics.averageOrderValue
                        )
                        : "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
