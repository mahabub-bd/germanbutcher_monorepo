"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PillBadge } from "@/components/common/pill-badge";
import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import type { ApiResponseusers, User } from "@/utils/types";
import {
  BadgeCheck,
  BadgeX,
  CheckCircle2,
  MapPin,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  UserCircle,
  User as UserIcon,
  Users,
} from "lucide-react";
import Image from "next/image";
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

/** Area of the customer's default (or first) saved address. */
const areaOf = (customer: User) => {
  const list = customer.addresses ?? [];
  return (list.find((a) => a.isDefault) ?? list[0])?.area || null;
};

export function CustomerList({
  initialPage = 1,
  initialLimit = 10,
  initialSearchParams = {},
}: CustomerListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/customer/customer-list";
  const { can } = usePermissions();

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

  const verifiedCount = customers.filter((c) => c.isVerified).length;
  const unverifiedCount = customers.length - verifiedCount;
  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (customer: User) => (
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
        {can(MENU_URL, "canEdit") && (
          <DropdownMenuItem asChild>
            <Link
              href={`/admin/customer/${customer.id}/edit?page=${currentPage}`}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="w-full">
      <PageHeader
        title="Customers"
        description="Registered customer accounts with their contact details and activity."
      >
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={fetchCustomers}
        >
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex flex-col gap-2.5 md:flex-row md:flex-nowrap md:items-center md:gap-3">
          <TableSearch
            wrapperClassName="w-full md:max-w-xs"
            className="h-9"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <div className="flex items-center gap-2 md:ml-auto">
              <PillBadge className="font-medium">
                Search: {searchQuery}
              </PillBadge>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={clearSearch}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingIndicator message="Loading customers..." />
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <UserCircle className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No customers found</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? "No customers match your search. Try a different name, email or phone."
                : "No customers have been registered yet."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={searchQuery ? clearSearch : fetchCustomers}
          >
            {searchQuery ? "Clear search" : "Refresh"}
          </Button>
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <StatsCard
              icon={Users}
              title="Total customers"
              value={totalItems.toLocaleString("en-US")}
              description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
              bgColor="blue"
            />
            <StatsCard
              icon={CheckCircle2}
              title="Verified"
              value={verifiedCount.toLocaleString("en-US")}
              description="On this page"
              bgColor="green"
            />
            <StatsCard
              icon={BadgeX}
              title="Unverified"
              value={unverifiedCount.toLocaleString("en-US")}
              description="On this page"
              bgColor="orange"
            />
            <StatsCard
              icon={UserCircle}
              title="Showing"
              value={customers.length.toLocaleString("en-US")}
              description={`Of ${totalItems.toLocaleString("en-US")} customers`}
              bgColor="purple"
            />
          </div>

          {/* Customers */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Customers</h3>
                <p className="text-xs text-muted-foreground">
                  Newest first · {limit} per page
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {totalItems.toLocaleString("en-US")} total
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => {
                    const area = areaOf(customer);
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="py-2.5 pl-4">
                          <Link
                            href={`/admin/customer/${customer.id}/view`}
                            className="flex items-center gap-3 font-medium leading-tight hover:text-primaryColor hover:underline"
                          >
                            {customer.profilePhoto?.url ? (
                              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-muted">
                                <Image
                                  src={customer.profilePhoto.url}
                                  alt={customer.name || "Customer"}
                                  fill
                                  className="object-contain"
                                />
                              </span>
                            ) : (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold uppercase text-muted-foreground">
                                {customer.name?.charAt(0) || (
                                  <UserIcon className="h-5 w-5" />
                                )}
                              </span>
                            )}
                            <span className="truncate">{customer.name}</span>
                          </Link>
                        </TableCell>

                        <TableCell>
                          <span className="block max-w-55 truncate text-muted-foreground">
                            {customer.email}
                          </span>
                        </TableCell>

                        <TableCell>
                          {customer.mobileNumber ? (
                            <a
                              href={`tel:${customer.mobileNumber}`}
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {customer.mobileNumber}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {area ? (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {area}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <PillBadge
                            tone={customer.isVerified ? "emerald" : "neutral"}
                            className="gap-1"
                          >
                            {customer.isVerified ? (
                              <BadgeCheck className="h-3 w-3" />
                            ) : (
                              <BadgeX className="h-3 w-3" />
                            )}
                            {customer.isVerified ? "Verified" : "Unverified"}
                          </PillBadge>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {formatDateTime(customer.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.lastLoginAt
                            ? formatDateTime(customer.lastLoginAt)
                            : "Never"}
                        </TableCell>

                        <TableCell className="pr-4 text-right">
                          {renderActions(customer)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {customers.map((customer) => {
                const area = areaOf(customer);
                return (
                  <article key={customer.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/customer/${customer.id}/view`}
                        className="flex min-w-0 items-center gap-2.5 hover:text-primaryColor"
                      >
                        {customer.profilePhoto?.url ? (
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border bg-muted">
                            <Image
                              src={customer.profilePhoto.url}
                              alt={customer.name || "Customer"}
                              fill
                              className="object-contain"
                            />
                          </span>
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold uppercase text-muted-foreground">
                            {customer.name?.charAt(0) || (
                              <UserIcon className="h-5 w-5" />
                            )}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {customer.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        <PillBadge
                          tone={customer.isVerified ? "emerald" : "neutral"}
                        >
                          {customer.isVerified ? "Verified" : "Unverified"}
                        </PillBadge>
                        {renderActions(customer)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Mobile
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {customer.mobileNumber || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Area
                        </p>
                        <p className="truncate text-sm font-semibold">
                          {area || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Joined
                        </p>
                        <p className="text-sm">
                          {formatDateTime(customer.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Last Login
                        </p>
                        <p className="text-sm">
                          {customer.lastLoginAt
                            ? formatDateTime(customer.lastLoginAt)
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Footer: what the list covers */}
            <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
              <p className="text-xs text-muted-foreground">
                Showing {firstRow.toLocaleString("en-US")}–
                {lastRow.toLocaleString("en-US")} of{" "}
                {totalItems.toLocaleString("en-US")} customer
                {totalItems === 1 ? "" : "s"}
                {searchQuery && ` matching “${searchQuery}”`}
              </p>
              {totalPages > 1 && (
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl="#"
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
