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
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import type { DeliveryMan, DeliveryManResponse } from "@/utils/types";
import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Truck,
  User,
  UserCircle,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface DeliveryManListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function DeliveryManList({
  initialPage = 1,
  initialLimit = 10,
  initialSearchParams = {},
}: DeliveryManListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [isActiveFilter, setIsActiveFilter] = useState<"all" | "true" | "false">(
    (getInitialParam("isActive") as "all" | "true" | "false") || "all"
  );
  const [isLoading, setIsLoading] = useState(true);

  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (isActiveFilter !== "all") params.set("isActive", isActiveFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, isActiveFilter]);

  const fetchDeliveryMen = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (isActiveFilter !== "all") params.append("isActive", isActiveFilter);

      const response = await fetchDataPagination<DeliveryManResponse>(
        `delivery-man?${params.toString()}`
      );

      setDeliveryMen(response.data);
      setTotalItems(response.meta?.total || 0);
      setTotalPages(
        Math.ceil((response.meta?.total || 0) / limit)
      );
    } catch (error) {
      console.error("Error fetching delivery men:", error);
      toast.error("Failed to load delivery men. Please try again.");
      setDeliveryMen([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, isActiveFilter]);

  // Initial load with URL params
  useEffect(() => {
    const pageFromUrl = searchParams?.get("page");
    const searchFromUrl = searchParams?.get("search");
    const isActiveFromUrl = searchParams?.get("isActive");

    if (pageFromUrl) {
      setCurrentPage(parseInt(pageFromUrl, 10));
    }
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
    if (isActiveFromUrl) {
      setIsActiveFilter(isActiveFromUrl as "all" | "true" | "false");
    }
  }, [searchParams]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchDeliveryMen();
  }, [fetchDeliveryMen]);

  // Update URL when state changes
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleLimitChange = (value: string) => {
    setLimit(parseInt(value));
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <UserCircle className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No delivery men found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery || isActiveFilter !== "all"
          ? "No delivery men match your search criteria. Try different filters."
          : "No delivery men have been registered yet."}
      </p>

      {(searchQuery || isActiveFilter !== "all") && (
        <Button variant="outline" className="mt-4" onClick={clearSearch}>
          Clear Filters
        </Button>
      )}
    </div>
  );

  const renderSearchFilter = () => {
    if (!searchQuery && isActiveFilter === "all") return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {searchQuery && (
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
        )}
        {isActiveFilter !== "all" && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            Status: {isActiveFilter === "true" ? "Active" : "Inactive"}
            <button
              onClick={() => setIsActiveFilter("all")}
              className="ml-1 hover:opacity-70"
              aria-label="Clear status filter"
            >
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
    );
  };

  const renderTableView = () => (
    <div className="rounded-sm border p-2 md:p-4 mt-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Mobile Number</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Deliveries</TableHead>
            <TableHead className="hidden md:table-cell">Earnings</TableHead>
            <TableHead className="hidden lg:table-cell">Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveryMen.map((deliveryMan) => (
            <TableRow key={deliveryMan.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{deliveryMan.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="truncate max-w-[200px] block">
                  {deliveryMan.mobileNumber}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge
                  variant={deliveryMan.isActive ? "default" : "secondary"}
                  className="capitalize"
                >
                  {deliveryMan.isActive ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {deliveryMan.totalDeliveries}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                ৳{Number(deliveryMan.totalEarnings).toFixed(2)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatDateTime(deliveryMan.createdAt)}
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
                      <Link href={`/admin/delivery-man/${deliveryMan.id}/view`}>
                        <UserCircle className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/delivery-man/${deliveryMan.id}/edit`}>
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

  const activeCount = deliveryMen.filter((dm) => dm.isActive).length;
  const inactiveCount = deliveryMen.filter((dm) => !dm.isActive).length;
  const totalEarnings = deliveryMen.reduce(
    (sum, dm) => sum + Number(dm.totalEarnings),
    0
  );
  const totalDeliveries = deliveryMen.reduce(
    (sum, dm) => sum + dm.totalDeliveries,
    0
  );

  return (
    <div className="w-full md:p-6 p-2">
      <PageHeader
        title="Delivery Men"
        description="View and manage delivery personnel"
      />

      <div className="space-y-4">
        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or mobile..."
              className="pl-10 pr-4"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button asChild size="sm">
              <Link href="/admin/delivery-man/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Delivery Man
              </Link>
            </Button>
            <Select
              value={isActiveFilter}
              onValueChange={(value) => {
                setIsActiveFilter(value as "all" | "true" | "false");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={limit.toString()}
              onValueChange={handleLimitChange}
            >
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Search Filter */}
        {renderSearchFilter()}

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingIndicator message="Loading delivery men..." />
          </div>
        ) : deliveryMen.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Summary Stats */}
            <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-sm border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{totalItems}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="rounded-sm border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{activeCount}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="rounded-sm border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inactive</p>
                    <p className="text-2xl font-bold">{inactiveCount}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="rounded-sm border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Deliveries</p>
                    <p className="text-2xl font-bold">
                      {totalDeliveries}
                    </p>
                    <p className="text-xs text-muted-foreground">This page</p>
                  </div>
                  <Truck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="rounded-sm border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Earnings</p>
                    <p className="text-2xl font-bold">
                      ৳{Number(totalEarnings).toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">This page</p>
                  </div>
                  <UserCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Count */}
            <div className="text-sm text-muted-foreground">
              Found {totalItems.toLocaleString()} delivery man
              {totalItems !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>

            {/* Table */}
            {renderTableView()}
          </>
        )}

        {/* Pagination */}
        {!isLoading && deliveryMen.length > 0 && totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * limit + 1).toLocaleString()} -{" "}
              {Math.min(currentPage * limit, totalItems).toLocaleString()} of{" "}
              {totalItems.toLocaleString()} delivery men
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
