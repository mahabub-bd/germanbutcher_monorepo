"use client";

import type React from "react";

import { PaginationComponent } from "@/components/common/pagination";
import { StatusCard } from "@/components/admin/dashboard/status-card";
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
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import type { ApiResponseusers, User } from "@/utils/types";
import {
  CheckCircle,
  MoreHorizontal,
  Pencil,
  Search,
  UserCircle,
  Users,
  XCircle,
  XCircle as XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface CustomerListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function CustomerList({
  initialPage = 1,
  initialLimit = 10,
  initialSearchParams = {},
}: CustomerListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [customers, setCustomers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [isLoading, setIsLoading] = useState(true);

  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery]);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);

      const response = await fetchDataPagination<ApiResponseusers>(
        `users/customers?${params.toString()}`
      );

      setCustomers(response.data.customers);
      setTotalItems(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers. Please try again.");
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery]);

  // Initial load with URL params
  useEffect(() => {
    const pageFromUrl = searchParams?.get("page");
    const searchFromUrl = searchParams?.get("search");

    if (pageFromUrl) {
      setCurrentPage(parseInt(pageFromUrl, 10));
    }
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Update URL when state changes
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <UserCircle className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No customers found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery
          ? "No customers match your search criteria. Try a different search term."
          : "No customers have been registered yet."}
      </p>

      {searchQuery && (
        <Button variant="outline" className="mt-4" onClick={clearSearch}>
          Clear Search
        </Button>
      )}
    </div>
  );

  const renderSearchFilter = () => {
    if (!searchQuery) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
          Search: {searchQuery}
          <button
            onClick={clearSearch}
            className="ml-1 hover:opacity-70"
            aria-label="Clear search"
          >
            <XCircle className="h-3 w-3" />
          </button>
        </Badge>
      </div>
    );
  };

  const renderTableView = () => (
    <div className="rounded-sm border p-2 md:p-4 mt-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="hidden md:table-cell">Mobile</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Joined</TableHead>
            <TableHead className="hidden lg:table-cell">Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="truncate">{customer.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="truncate max-w-[200px] block">
                  {customer.email}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {customer.mobileNumber || "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge
                  variant={customer.isVerified ? "default" : "secondary"}
                  className="capitalize"
                >
                  {customer.isVerified ? "Verified" : "Unverified"}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDateTime(customer.createdAt)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {customer.lastLoginAt
                  ? formatDateTime(customer.lastLoginAt)
                  : "Never"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/customer/${customer.id}/view`}>
                        <UserCircle className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/customer/${customer.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="w-full md:p-6 p-2">
      <PageHeader
        title="Customers"
        description="View and manage registered customers"
      />

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email, or phone..."
              className="pl-10 pr-4"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Active Search Filter */}
        {renderSearchFilter()}

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingIndicator message="Loading customers..." />
          </div>
        ) : customers.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Summary Cards */}
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatusCard
                title="Total Customers"
                value={totalItems}
                icon={Users}
                href="#"
                color="text-blue-600 dark:text-blue-400"
                gradient="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
              />
              <StatusCard
                title="Verified"
                value={customers.filter((c) => c.isVerified).length}
                icon={CheckCircle}
                href="#"
                color="text-green-600 dark:text-green-400"
                gradient="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
              />
              <StatusCard
                title="Unverified"
                value={customers.filter((c) => !c.isVerified).length}
                icon={XCircle}
                href="#"
                color="text-orange-600 dark:text-orange-400"
                gradient="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
              />
              <StatusCard
                title="Showing"
                value={customers.length}
                icon={UserCircle}
                href="#"
                color="text-purple-600 dark:text-purple-400"
                gradient="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
              />
            </div>

            {/* Customer Count */}
            <div className="text-sm text-muted-foreground">
              Found {totalItems.toLocaleString()} customer
              {totalItems !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>

            {/* Table */}
            {renderTableView()}
          </>
        )}

        {/* Pagination */}
        {!isLoading && customers.length > 0 && totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * limit + 1).toLocaleString()} -{" "}
              {Math.min(currentPage * limit, totalItems).toLocaleString()} of{" "}
              {totalItems.toLocaleString()} customers
            </div>

            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
