"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { fetchProtectedData } from "@/utils/api-utils";
import { BarChart3, Phone, ShoppingBag, Users, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";

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
  /** Area from the customer's default saved address (null if none). */
  area: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  profilePhoto: {
    id: number;
    url: string;
  } | null;
  statistics: CustomerStatistics;
}

type TimeFilter =
  | "last_month"
  | "this_month"
  | "last_3_months"
  | "last_6_months"
  | "last_year"
  | "this_year"
  | "all_time";

export function TopCustomersList() {
  const router = useRouter();
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [limit, setLimit] = useState<number>(5);
  const [sortBy, setSortBy] = useState<"orders" | "spending">("orders");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all_time");

  useEffect(() => {
    const fetchTopCustomers = async () => {
      setLoading(true);
      try {
        const response = await fetchProtectedData(
          `users/customers/top?limit=${limit}&sortBy=${sortBy}&timeFilter=${timeFilter}`,
        );

        setCustomers(response as TopCustomer[]);
      } catch (error) {
        console.error("Error fetching top customers:", error);
        toast.error("Failed to load top customers. Please try again.");
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCustomers();
  }, [limit, sortBy, timeFilter]);

  if (loading) {
    return (
      <Card className="w-full gap-0 overflow-hidden rounded-xl border-border/70 py-0 shadow-sm">
        <div className="flex min-h-50 items-center justify-center">
          <LoadingIndicator message="Loading top customers..." />
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl border-border/70 py-0 shadow-sm">
      <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold sm:text-lg">
            Top Customers
          </CardTitle>
          <CardDescription className="mt-1 text-xs sm:text-sm">
            Best customers by orders and spending
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={limit.toString()}
            onValueChange={(value) => setLimit(parseInt(value))}
          >
            <SelectTrigger className="h-9 w-27.5 rounded-lg bg-background text-xs sm:w-30 sm:text-sm">
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
            onValueChange={(value: "orders" | "spending") => setSortBy(value)}
          >
            <SelectTrigger className="h-9 w-30 rounded-lg bg-background text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orders">By Orders</SelectItem>
              <SelectItem value="spending">By Spending</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={timeFilter}
            onValueChange={(value: TimeFilter) => setTimeFilter(value)}
          >
            <SelectTrigger className="h-9 w-32.5 rounded-lg bg-background text-xs sm:w-35 sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-3 py-3 sm:px-5 sm:py-4">
        <div className="overflow-x-auto">
          <Table className="min-w-190">
            <TableHeader className="[&_tr]:border-0 [&_tr]:bg-muted/40">
              <TableRow>
                <TableHead className="h-10 w-16 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Rank
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Customer
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Area
                </TableHead>
                <TableHead className="h-10 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Orders
                </TableHead>
                <TableHead className="h-10 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Spent
                </TableHead>
                <TableHead className="h-10 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Avg
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No customers found</p>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer, index) => (
                  <TableRow
                    key={customer.id}
                    className="group cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/customer/${customer.id}/view`)
                    }
                  >
                    {/* Rank */}
                    <TableCell className="py-3">
                      <span
                        className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold ${
                          index === 0
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : index === 1
                              ? "bg-slate-400/15 text-slate-600 dark:text-slate-300"
                              : index === 2
                                ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="max-w-37.5 truncate text-sm font-medium group-hover:text-primary">
                            {customer.name}
                          </span>
                          {customer.isVerified && (
                            <Badge
                              variant="default"
                              className="h-4 px-1 text-[10px]"
                            >
                              ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="size-3.5 shrink-0" />
                        {customer.mobileNumber}
                      </span>
                    </TableCell>

                    {/* Area */}
                    <TableCell className="py-3">
                      <span className="text-sm text-muted-foreground">
                        {customer.area || "—"}
                      </span>
                    </TableCell>

                    {/* Orders */}
                    <TableCell className="py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
                          <ShoppingBag className="size-3.5 text-muted-foreground" />
                          {customer.statistics.totalOrders}
                        </span>
                        {customer.statistics.pendingOrders > 0 && (
                          <span className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                            {customer.statistics.pendingOrders} pending
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Total Spent */}
                    <TableCell className="py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
                        <Wallet className="size-3.5 text-muted-foreground" />
                        {formatCurrencyEnglish(customer.statistics.totalSpent)}
                      </span>
                    </TableCell>

                    {/* Average */}
                    <TableCell className="py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <BarChart3 className="size-3.5" />
                        {customer.statistics.totalOrders > 0
                          ? formatCurrencyEnglish(
                              customer.statistics.averageOrderValue,
                            )
                          : "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
