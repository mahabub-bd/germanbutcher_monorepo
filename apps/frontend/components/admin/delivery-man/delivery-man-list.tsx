"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
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
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";
import { cn, formatDateTime } from "@/lib/utils";
import { fetchDataPagination, fetchProtectedData } from "@/utils/api-utils";
import type {
  DeliveryMan,
  DeliveryManResponse,
  DeliveryPerformance,
} from "@/utils/types";
import {
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
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

/** Grouped amount without the ৳ mark — used inside the desktop table. */
const money = (value: number) =>
  Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

/** Cards carry the ৳ mark; desktop cells rely on the column header. */
const amount = (value: number) => `৳${money(value)}`;

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
  const MENU_URL = "/admin/delivery-man";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [deliverySummary, setDeliverySummary] =
    useState<DeliveryPerformance | null>(null);
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
      setTotalItems(response.total || 0);
      setTotalPages(
        response.totalPages || Math.ceil((response.total || 0) / limit)
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
    // Delivery performance is auxiliary — a failure leaves the tile hidden.
    fetchProtectedData<DeliveryPerformance>(
      "orders/reports/delivery-performance-summary"
    )
      .then((data) => setDeliverySummary(data ?? null))
      .catch(() => setDeliverySummary(null));
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

  const clearFilters = () => {
    setSearchQuery("");
    setIsActiveFilter("all");
    setCurrentPage(1);
  };

  const { togglingId, toggleActive } = useActiveStatusToggle<DeliveryMan>({
    getId: (deliveryMan) => deliveryMan.id,
    getName: (deliveryMan) => deliveryMan.name,
    buildEndpoint: (id) => `delivery-man/${id}`,
    setStatusLocally: (id, isActive) =>
      setDeliveryMen((prev) =>
        prev.map((dm) => (dm.id === id ? { ...dm, isActive } : dm))
      ),
    errorLabel: "delivery man status",
  });

  const activeCount = deliveryMen.filter((dm) => dm.isActive).length;
  const inactiveCount = deliveryMen.length - activeCount;
  const totalEarnings = deliveryMen.reduce(
    (sum, dm) => sum + Number(dm.totalEarnings),
    0
  );
  const totalDeliveries = deliveryMen.reduce(
    (sum, dm) => sum + dm.totalDeliveries,
    0
  );
  const hasFilters = Boolean(searchQuery || isActiveFilter !== "all");
  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (deliveryMan: DeliveryMan) => (
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
        {can(MENU_URL, "canEdit") && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/delivery-man/${deliveryMan.id}/edit`}>
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
        title="Delivery Men"
        description="Delivery personnel, their workload and delivery earnings."
      >
        {can(MENU_URL, "canCreate") && (
          <Button asChild size="sm">
            <Link href="/admin/delivery-man/create">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Create Delivery Man</span>
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={fetchDeliveryMen}
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
            placeholder="Search by name or mobile..."
            value={searchQuery}
            onChange={handleSearchChange}
          />

          <div className="grid grid-cols-2 gap-2.5 md:flex md:items-center md:gap-3">
            <div className="md:w-37 md:shrink-0">
              <Select
                value={isActiveFilter}
                onValueChange={(value) => {
                  setIsActiveFilter(value as "all" | "true" | "false");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:w-22 md:shrink-0">
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="h-9 w-full">
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

          {hasFilters && (
            <div className="flex items-center gap-2 md:ml-auto">
              <PillBadge className="font-medium">
                {[
                  searchQuery && `Search: ${searchQuery}`,
                  isActiveFilter !== "all" &&
                    `Status: ${isActiveFilter === "true" ? "Active" : "Inactive"}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </PillBadge>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={clearFilters}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingIndicator message="Loading delivery men..." />
        </div>
      ) : deliveryMen.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Truck className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No delivery men found</p>
            <p className="text-xs text-muted-foreground">
              {hasFilters
                ? "No delivery men match these filters. Try a different name or status."
                : "No delivery men have been registered yet."}
            </p>
          </div>
          {hasFilters ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            can(MENU_URL, "canCreate") && (
              <Button size="sm" asChild>
                <Link href="/admin/delivery-man/create">
                  <Plus className="size-4" /> Create Delivery Man
                </Link>
              </Button>
            )
          )}
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatsCard
              icon={Users}
              title="Total"
              value={totalItems.toLocaleString("en-US")}
              description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
              bgColor="blue"
            />
            <StatsCard
              icon={CheckCircle2}
              title="Active"
              value={activeCount.toLocaleString("en-US")}
              description="On this page"
              bgColor="green"
            />
            <StatsCard
              icon={XCircle}
              title="Inactive"
              value={inactiveCount.toLocaleString("en-US")}
              description="On this page"
              bgColor="orange"
            />
            <StatsCard
              icon={Truck}
              title="Deliveries"
              value={totalDeliveries.toLocaleString("en-US")}
              description="On this page"
              bgColor="indigo"
            />
            <StatsCard
              icon={UserCircle}
              title="Earnings"
              value={amount(totalEarnings)}
              description="On this page"
              bgColor="purple"
            />
            {deliverySummary && (
              <StatsCard
                icon={Clock}
                title="Avg delivery time"
                value={
                  deliverySummary.avgDeliveryHours !== null
                    ? `${deliverySummary.avgDeliveryHours}h`
                    : "—"
                }
                description={`Placement → delivered · ${deliverySummary.deliveredOrders30d} orders (30d)`}
                bgColor="amber"
              />
            )}
          </div>

          {/* Delivery men */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Delivery men</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · ordered by name
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {totalItems.toLocaleString("en-US")} total
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table min-w-220">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Delivery man</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="text-right">In Progress</TableHead>
                    <TableHead className="text-right">Cancelled</TableHead>
                    <TableHead className="text-right">Deliveries</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryMen.map((deliveryMan) => (
                    <TableRow key={deliveryMan.id}>
                      <TableCell className="py-2.5 pl-4">
                        <Link
                          href={`/admin/delivery-man/${deliveryMan.id}/view`}
                          className="flex items-center gap-3 font-medium leading-tight hover:text-primaryColor hover:underline"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold uppercase text-muted-foreground">
                            {deliveryMan.name?.charAt(0) || (
                              <User className="h-5 w-5" />
                            )}
                          </span>
                          <span className="truncate">{deliveryMan.name}</span>
                        </Link>
                      </TableCell>

                      <TableCell>
                        {deliveryMan.mobileNumber ? (
                          <a
                            href={`tel:${deliveryMan.mobileNumber}`}
                            className="block max-w-50 truncate text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {deliveryMan.mobileNumber}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {deliveryMan.assignedOrders ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            (deliveryMan.inProgressOrders ?? 0) > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {deliveryMan.inProgressOrders ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            (deliveryMan.cancelledOrders ?? 0) > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {deliveryMan.cancelledOrders ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {deliveryMan.totalDeliveries}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {money(Number(deliveryMan.totalEarnings))}
                        </span>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {formatDateTime(deliveryMan.createdAt)}
                      </TableCell>

                      <TableCell>
                        <ActiveStatusToggle
                          isActive={deliveryMan.isActive}
                          disabled={togglingId === deliveryMan.id}
                          onToggle={() => toggleActive(deliveryMan)}
                          label={deliveryMan.name}
                        />
                      </TableCell>

                      <TableCell className="pr-4 text-right">
                        {renderActions(deliveryMan)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {deliveryMen.map((deliveryMan) => (
                <article key={deliveryMan.id} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/admin/delivery-man/${deliveryMan.id}/view`}
                      className="flex min-w-0 items-center gap-2.5 hover:text-primaryColor"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold uppercase text-muted-foreground">
                        {deliveryMan.name?.charAt(0) || (
                          <User className="h-5 w-5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {deliveryMan.name}
                        </p>
                        {deliveryMan.mobileNumber && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {deliveryMan.mobileNumber}
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1">
                      <PillBadge
                        tone={deliveryMan.isActive ? "emerald" : "neutral"}
                      >
                        {deliveryMan.isActive ? "Active" : "Inactive"}
                      </PillBadge>
                      {renderActions(deliveryMan)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Assigned
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {deliveryMan.assignedOrders ?? 0}
                        {(deliveryMan.inProgressOrders ?? 0) > 0 && (
                          <span className="ml-1 text-[10px] font-normal text-amber-600 dark:text-amber-400">
                            {deliveryMan.inProgressOrders} in progress
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Deliveries
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {deliveryMan.totalDeliveries}
                        {(deliveryMan.cancelledOrders ?? 0) > 0 && (
                          <span className="ml-1 text-[10px] font-normal text-red-600 dark:text-red-400">
                            {deliveryMan.cancelledOrders} cancelled
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Earnings
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(Number(deliveryMan.totalEarnings))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Joined
                      </p>
                      <p className="text-sm">
                        {formatDateTime(deliveryMan.createdAt)}
                      </p>
                    </div>
                  </div>

                  <ActiveStatusToggle
                    isActive={deliveryMan.isActive}
                    disabled={togglingId === deliveryMan.id}
                    onToggle={() => toggleActive(deliveryMan)}
                    label={deliveryMan.name}
                  />
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
              <p className="text-xs text-muted-foreground">
                Showing {firstRow.toLocaleString("en-US")}–
                {lastRow.toLocaleString("en-US")} of{" "}
                {totalItems.toLocaleString("en-US")} delivery{" "}
                {totalItems === 1 ? "man" : "men"}
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
