"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Award, Eye, Users } from "lucide-react";
import Link from "next/link";
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
  createdAt: string;
  lastLoginAt: string | null;
  profilePhoto: {
    id: number;
    url: string;
  } | null;
  statistics: CustomerStatistics;
}

type TimeFilter =
  | "this_month"
  | "last_3_months"
  | "last_6_months"
  | "last_year"
  | "this_year"
  | "all_time";

export function TopCustomersList() {
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

  if (loading) {
    return (
      <Card className="w-full overflow-hidden">
        <div className="flex justify-center items-center min-h-[200px]">
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
              <SelectTrigger className="w-[100px] sm:w-[130px] h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="50">Top 50</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value: "orders" | "spending") => setSortBy(value)}
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
              onValueChange={(value: TimeFilter) => setTimeFilter(value)}
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
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto mx-4 sm:mx-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] sm:w-[60px] text-xs h-9 sm:h-10">Rank</TableHead>
                <TableHead className="text-xs h-9 sm:h-10">Customer</TableHead>
                <TableHead className="hidden md:table-cell text-xs h-9 sm:h-10">
                  Contact
                </TableHead>
                <TableHead className="text-center text-xs h-9 sm:h-10">Orders</TableHead>
                <TableHead className="text-right text-xs h-9 sm:h-10">Spent</TableHead>
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
                    <TableCell className="py-1.5 sm:py-2">{getRankBadge(index)}</TableCell>

                    {/* Customer */}
                    <TableCell className="py-1.5 sm:py-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">
                            {customer.name}
                          </span>
                          {customer.isVerified && (
                            <Badge variant="default" className="text-[10px] sm:text-xs h-3.5 sm:h-4 px-1">
                              ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell className="hidden md:table-cell py-1.5 sm:py-2">
                      <span className="text-[10px] sm:text-xs">{customer.mobileNumber}</span>
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
      </CardContent>
    </Card>
  );
}
