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
import {
  BarChart3,
  Phone,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
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
          `users/customers/top?limit=${limit}&sortBy=${sortBy}&timeFilter=${timeFilter}`
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
      <Card className="w-full overflow-hidden">
        <div className="flex justify-center items-center min-h-50">
          <LoadingIndicator message="Loading top customers..." />
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl font-bold">Top Customers</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Best customers by orders and spending</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Select
              value={limit.toString()}
              onValueChange={(value) => setLimit(parseInt(value))}
            >
              <SelectTrigger className="w-25 sm:w-32.5 h-8 sm:h-9 text-xs sm:text-sm lg:text-xs 2xl:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs 2xl:text-sm" value="5">Top 5</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="10">Top 10</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="20">Top 20</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="50">Top 50</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="100">Top 100</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value: "orders" | "spending") => setSortBy(value)}
            >
              <SelectTrigger className="w-25 sm:w-32.5 h-8 sm:h-9 text-xs sm:text-sm lg:text-xs 2xl:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs 2xl:text-sm" value="orders">By Orders</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="spending">By Spending</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={timeFilter}
              onValueChange={(value: TimeFilter) => setTimeFilter(value)}
            >
              <SelectTrigger className="w-27.5 sm:w-35 h-8 sm:h-9 text-xs sm:text-sm lg:text-xs 2xl:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs 2xl:text-sm" value="last_month">Last Month</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="this_month">This Month</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="last_year">Last Year</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="this_year">This Year</SelectItem>
                <SelectItem className="text-xs 2xl:text-sm" value="all_time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto mx-4 sm:mx-2">
          <Table className="min-w-180">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12.5 sm:w-15 text-xs sm:text-sm font-bold h-9 sm:h-10">Rank</TableHead>
                <TableHead className="text-xs sm:text-sm font-bold h-9 sm:h-10">Customer</TableHead>
                <TableHead className="text-xs sm:text-sm font-bold h-9 sm:h-10">
                  Contact
                </TableHead>
                <TableHead className="text-xs sm:text-sm font-bold h-9 sm:h-10">
                  Area
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm font-bold h-9 sm:h-10">Orders</TableHead>
                <TableHead className="text-right text-xs sm:text-sm font-bold h-9 sm:h-10">Spent</TableHead>
                <TableHead className="text-right text-xs sm:text-sm font-bold h-9 sm:h-10">
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
                    onClick={() => router.push(`/admin/customer/${customer.id}/view`)}
                  >
                    {/* Rank */}
                    <TableCell className="py-1.5 sm:py-2 text-xs sm:text-sm">
                      {index + 1}
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="py-1.5 sm:py-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-xs sm:text-sm truncate max-w-25 sm:max-w-37.5">
                            {customer.name}
                          </span>
                          {customer.isVerified && (
                            <Badge variant="default" className="text-[10px] 2xl:text-xs h-3.5 sm:h-4 px-1">
                              ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell className="py-1.5 sm:py-2">
                      <Badge variant="outline" className="h-5 px-1.5 text-xs sm:text-sm">
                        <Phone className="h-3.5 w-3.5 shrink-0" />{customer.mobileNumber}
                      </Badge>
                    </TableCell>

                    {/* Area */}
                    <TableCell className="py-1.5 sm:py-2">
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
                    <TableCell className="text-right py-1.5 sm:py-2">
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
      </CardContent>
    </Card>
  );
}
