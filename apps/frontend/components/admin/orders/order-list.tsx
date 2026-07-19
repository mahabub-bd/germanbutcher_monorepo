"use client";

import type React from "react";

import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrencyEnglish,
  formatDateTime,
} from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import {
  getOrderStatusColor,
  getPaymentMethodColor,
  getPaymentMethodIcon,
  getPaymentStatusColor,
  getStatusIcon,
} from "@/utils/order-helper";
import type { Order } from "@/utils/types";
import {
  DollarSign,
  Eye,
  Filter,
  List,
  Lock,
  MoreHorizontal,
  Pencil,
  Search,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface OrderListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function OrderList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: OrderListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("orderStatus") as string
  );

  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const updateUrl = useCallback(() => {
    // Prevent page from exceeding totalPages
    const safePage = Math.min(currentPage, totalPages);
    const finalPage = Math.max(1, safePage);

    const params = new URLSearchParams();

    params.set("page", finalPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter && statusFilter !== "all")
      params.set("orderStatus", statusFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, totalPages, limit, searchQuery, statusFilter]);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("orderStatus", statusFilter);

      const response = await fetchDataPagination<{
        data: Order[];
        total: number;
        totalPages: number;
      }>(`orders?${params.toString()}`);
      setOrders(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders. Please try again.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, statusFilter]);

  // Initial load with URL params
  useEffect(() => {
    const pageFromUrl = searchParams?.get("page");
    const searchFromUrl = searchParams?.get("search");
    const statusFromUrl = searchParams?.get("orderStatus");

    if (pageFromUrl) {
      const newPage = parseInt(pageFromUrl, 10);
      // Only update if different to prevent infinite loop
      if (newPage !== currentPage && newPage > 0) {
        setCurrentPage(newPage);
      }
    }
    if (searchFromUrl && searchFromUrl !== searchQuery) {
      setSearchQuery(searchFromUrl);
    }
    if (statusFromUrl && statusFromUrl !== statusFilter) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update URL when state changes
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Check if order can be edited
  const canEditOrder = (orderStatus: string) => {
    const nonEditableStatuses = ["shipped", "delivered"];
    return !nonEditableStatuses.includes(orderStatus.toLowerCase());
  };

  const renderActiveFilters = () => {
    const hasFilters = searchQuery || statusFilter;

    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {searchQuery && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Search: {searchQuery}
            <button onClick={() => setSearchQuery("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {statusFilter && statusFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Status: {statusFilter}
            <button onClick={() => setStatusFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-7 text-xs"
        >
          Clear all
        </Button>
      </div>
    );
  };

  const renderTableView = () => (
    <div className="">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">
                Order Status
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Payment Status
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Payment Method
              </TableHead>
              <TableHead className="hidden md:table-cell text-right">
                Total
              </TableHead>
              <TableHead className="hidden md:table-cell text-right">
                Total Paid
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(limit)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse md:hidden" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-1">
                      <h3 className="font-semibold">No orders found</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery || statusFilter
                          ? "No orders match your search criteria."
                          : "There are no orders in the system yet."}
                      </p>
                    </div>
                    {(searchQuery || statusFilter) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    <Link
                      href={`/admin/order/${order.id}/view`}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >

                      {order.orderNo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {order.user?.name || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground md:hidden">
                        {formatDateTime(order.createdAt).split(" ")[0]}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    <div className="space-y-1">
                      <div>{formatDateTime(order.createdAt)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="secondary"
                      className={`capitalize ${getOrderStatusColor(order.orderStatus)}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="secondary"
                      className={`capitalize ${getPaymentStatusColor(order.paymentStatus)}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {getStatusIcon(order.paymentStatus)}
                        {order.paymentStatus}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="outline"
                      className={`capitalize ${getPaymentMethodColor(order.paymentMethod?.name)}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {getPaymentMethodIcon(order.paymentMethod?.name || "")}
                        {order.paymentMethod?.name || "N/A"}
                      </span>
                    </Badge>
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-right font-medium">
                    {formatCurrencyEnglish(order.totalValue || 0)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right font-medium">
                    <div className="space-y-1">
                      <div>{formatCurrencyEnglish(order.paidAmount || 0)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* View - Always available */}
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/order/${order.id}/view`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>

                        {/* Edit - Only for pending, processing, cancelled orders */}
                        {canEditOrder(order.orderStatus) ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/order/${order.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Order
                            </Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled className="opacity-50">
                            <Lock className="mr-2 h-4 w-4" />
                            Edit (Order {order.orderStatus})
                          </DropdownMenuItem>
                        )}

                        {/* Payment Update - Only if not fully paid and not cancelled */}
                        {(order.paidAmount || 0) < (order.totalValue || 0) &&
                          order.orderStatus.toLowerCase() !== "cancelled" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/order/${order.id}/payment`}>
                                <DollarSign className="mr-2 h-4 w-4" /> Update
                                Payment
                              </Link>
                            </DropdownMenuItem>
                          )}

                        {/* View Payments - Always available */}
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/order/${order.id}/payments`}>
                            <List className="mr-2 h-4 w-4" /> Payment History
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Section */}
      {!isLoading && orders.length > 0 && (
        <div className="flex flex-row justify-between items-center p-4 border-t">
          <div className="text-sm text-muted-foreground whitespace-nowrap hidden md:flex">
            Showing {Math.min((currentPage - 1) * limit + 1, totalItems)} to{" "}
            {Math.min(currentPage * limit, totalItems)} of {totalItems} orders
          </div>
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="#"
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Loading Pagination Skeleton */}
      {isLoading && (
        <div className="flex flex-row justify-between items-center p-4 border-t">
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 px-3"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 p-3 rounded-lg shadow-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                sideOffset={8}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Filters</h4>
                    {statusFilter && statusFilter !== "all" && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Order Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "all",
                        "pending",
                        "processing",
                        "shipped",
                        "delivered",
                        "cancelled",
                      ].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border capitalize ${statusFilter === status ||
                              (!statusFilter && status === "all")
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                            }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {renderActiveFilters()}

        {renderTableView()}
      </div>
    </div>
  );
}
