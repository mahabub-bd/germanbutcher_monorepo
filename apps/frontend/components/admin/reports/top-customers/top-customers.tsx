"use client";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyEnglish } from "@/lib/utils";
import { Award, Crown, ShoppingCart, TrendingUp, Users } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StatsCard from "../../dashboard/stats-card";
import { Eye } from "lucide-react";
import { TopCustomersPDF } from "./TopCustomersPDF";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface CustomerStatistics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
}

interface TopCustomer {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  isVerified: boolean;
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

  const getRankBadge = (index: number) => {
    if (index === 0)
      return (
        <Badge className="bg-yellow-500 text-white h-5 sm:h-6">
          <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />1
        </Badge>
      );
    if (index === 1)
      return (
        <Badge className="bg-gray-400 text-white h-5 sm:h-6">
          <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />2
        </Badge>
      );
    if (index === 2)
      return (
        <Badge className="bg-amber-600 text-white h-5 sm:h-6">
          <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />3
        </Badge>
      );
    return (
      <Badge variant="outline" className="h-5 sm:h-6 text-[10px] sm:text-xs">
        {index + 1}
      </Badge>
    );
  };

  return (
    <div className="w-full">
      {/* Filters + Export */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select
            value={limit.toString()}
            onValueChange={(value) => updateFilter("limit", value)}
          >
            <SelectTrigger className="w-[100px] sm:w-[130px] h-8 sm:h-9 text-xs sm:text-sm">
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
            <SelectTrigger className="w-[100px] sm:w-[130px] h-8 sm:h-9 text-xs sm:text-sm">
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
            <SelectTrigger className="w-[110px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm">
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

        <div className="flex gap-2">
          {customers.length > 0 && mounted && (
            <PDFDownloadLink
              document={
                <TopCustomersPDF
                  customers={customers}
                  sortBy={sortBy}
                  timeFilterLabel={TIME_FILTER_LABELS[timeFilter]}
                />
              }
              fileName={`top-customers-${timeFilter}-${new Date()
                .toISOString()
                .split("T")[0]}.pdf`}
            >
              {({ loading, error }) => (
                <Button variant="secondary" disabled={!!error}>
                  {error
                    ? "PDF Error"
                    : loading
                      ? "Generating PDF..."
                      : "Download PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 2xl:grid-cols-4 gap-3">
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
          value={formatCurrencyEnglish(totalSpent)}
          count={String(customers.length)}
          description="Sum of listed customers"
          icon={TrendingUp}
          bgColor="purple"
        />
        <StatsCard
          title="Avg Order Value"
          value={formatCurrencyEnglish(avgOrderValue)}
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
              <TableHead className="w-[50px] sm:w-[60px] text-xs h-9 sm:h-10">
                Rank
              </TableHead>
              <TableHead className="text-xs h-9 sm:h-10">Customer</TableHead>
              <TableHead className="hidden md:table-cell text-xs h-9 sm:h-10">
                Contact
              </TableHead>
              <TableHead className="text-center text-xs h-9 sm:h-10">
                Orders
              </TableHead>
              <TableHead className="text-right text-xs h-9 sm:h-10">
                Spent
              </TableHead>
              <TableHead className="text-right text-xs h-9 sm:h-10 hidden lg:table-cell">
                Avg
              </TableHead>
              <TableHead className="text-right text-xs h-9 sm:h-10 w-[50px] sm:w-[60px]">
                View
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
                <TableRow key={customer.id}>
                  {/* Rank */}
                  <TableCell className="py-1.5 sm:py-2">
                    {getRankBadge(index)}
                  </TableCell>

                  {/* Customer */}
                  <TableCell className="py-1.5 sm:py-2">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">
                        {customer.name}
                      </span>
                      {customer.isVerified && (
                        <Badge
                          variant="default"
                          className="text-[10px] sm:text-xs h-3.5 sm:h-4 px-1"
                        >
                          ✓
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="hidden md:table-cell py-1.5 sm:py-2">
                    <span className="text-[10px] sm:text-xs">
                      {customer.mobileNumber}
                    </span>
                  </TableCell>

                  {/* Orders */}
                  <TableCell className="text-center py-1.5 sm:py-2">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-xs sm:text-sm">
                        {customer.statistics.totalOrders}
                      </span>
                      {customer.statistics.pendingOrders > 0 && (
                        <span className="text-[10px] sm:text-xs text-yellow-600">
                          {customer.statistics.pendingOrders}p
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Total Spent */}
                  <TableCell className="text-right py-1.5 sm:py-2">
                    <span className="font-bold text-xs sm:text-sm">
                      {formatCurrencyEnglish(customer.statistics.totalSpent)}
                    </span>
                  </TableCell>

                  {/* Average */}
                  <TableCell className="text-right py-1.5 sm:py-2 hidden lg:table-cell">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {customer.statistics.totalOrders > 0
                        ? formatCurrencyEnglish(
                          customer.statistics.averageOrderValue
                        )
                        : "—"}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right py-1.5 sm:py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                      asChild
                    >
                      <Link href={`/admin/customer/${customer.id}/view`}>
                        <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </Link>
                    </Button>
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
