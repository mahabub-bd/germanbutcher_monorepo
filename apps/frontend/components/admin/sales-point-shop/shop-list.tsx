"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { PaginationComponent } from "@/components/common/pagination";
import { PillBadge } from "@/components/common/pill-badge";
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
import { divisions } from "@/constants";
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";
import { cn } from "@/lib/utils";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { SalesPoint, Shop } from "@/utils/types";
import {
  Building,
  CheckCircle2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Store,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface ShopListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function ShopList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: ShopListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/sales-point-shop/sales-point-shop-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [shops, setShops] = useState<Shop[]>([]);
  const [salesPoints, setSalesPoints] = useState<SalesPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [salesPointFilter, setSalesPointFilter] = useState(
    getInitialParam("salesPointId") as string
  );
  const [divisionFilter, setDivisionFilter] = useState(
    getInitialParam("division") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (salesPointFilter && salesPointFilter !== "all")
      params.set("salesPointId", salesPointFilter);
    if (divisionFilter && divisionFilter !== "all")
      params.set("division", divisionFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    searchQuery,
    statusFilter,
    salesPointFilter,
    divisionFilter,
  ]);

  const fetchSalesPoints = async () => {
    try {
      const response = await fetchDataPagination<{ data: SalesPoint[] }>(
        "sales-points?limit=100"
      );
      setSalesPoints(response.data || []);
    } catch (error) {
      console.error("Error fetching sales points:", error);
    }
  };

  const fetchShops = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);
      if (salesPointFilter && salesPointFilter !== "all")
        params.append("salesPointId", salesPointFilter);
      if (divisionFilter && divisionFilter !== "all")
        params.append("division", divisionFilter);

      const response = await fetchDataPagination<{
        data: Shop[];
        total: number;
        totalPages: number;
      }>(`sales-point-shops?${params.toString()}`);

      setShops(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to load shops. Please try again.");
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    limit,
    searchQuery,
    statusFilter,
    salesPointFilter,
    divisionFilter,
  ]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // Sales point names are needed for the filter and the table, fetch once.
  useEffect(() => {
    fetchSalesPoints();
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (shop: Shop) => {
    setSelectedShop(shop);
    setIsDeleteDialogOpen(true);
  };

  const { togglingId, toggleActive } = useActiveStatusToggle<Shop>({
    getId: (shop) => shop.id,
    getName: (shop) => shop.shopName,
    // Dedicated endpoint flips the flag server-side and returns the
    // updated shop.
    buildEndpoint: (id) => `sales-point-shops/${id}/toggle-status`,
    includeBody: false,
    setStatusLocally: (id, isActive) =>
      setShops((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive } : s))
      ),
    errorLabel: "shop status",
  });

  const handleDelete = async () => {
    if (!selectedShop) return;

    try {
      await deleteData("sales-point-shops", selectedShop.id);
      fetchShops();
      toast.success("Shop deleted successfully");
    } catch (error) {
      console.error("Error deleting shop:", error);
      toast.error("Failed to delete shop. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setSalesPointFilter("");
    setDivisionFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const getSalesPointName = (salesPointId: number) => {
    const salesPoint = salesPoints.find((sp) => sp.id === salesPointId);
    return salesPoint?.name || "Unknown";
  };

  const activeCount = shops.filter((shop) => shop.isActive).length;
  const inactiveCount = shops.length - activeCount;
  const hasFilters = Boolean(
    searchQuery ||
      (statusFilter && statusFilter !== "all") ||
      (salesPointFilter && salesPointFilter !== "all") ||
      (divisionFilter && divisionFilter !== "all")
  );
  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (shop: Shop) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {can(MENU_URL, "canEdit") && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/sales-point-shop/${shop.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(shop)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Sales Point Shops"
          description="Outlet addresses attached to each sales point."
        >
          {can(MENU_URL, "canCreate") && (
            <Button asChild size="sm">
              <Link href="/admin/sales-point-shop/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Shop</span>
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchShops}
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
              placeholder="Search shops..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="grid grid-cols-2 gap-2.5 md:flex md:items-center md:gap-3">
              <div className="md:w-35 md:shrink-0">
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) => {
                    setStatusFilter(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:w-52 md:shrink-0">
                <Select
                  value={salesPointFilter || "all"}
                  onValueChange={(value) => {
                    setSalesPointFilter(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Sales point" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sales points</SelectItem>
                    {salesPoints.map((salesPoint) => (
                      <SelectItem
                        key={salesPoint.id}
                        value={salesPoint.id.toString()}
                      >
                        {salesPoint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:w-40 md:shrink-0">
                <Select
                  value={divisionFilter || "all"}
                  onValueChange={(value) => {
                    setDivisionFilter(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All divisions</SelectItem>
                    {divisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasFilters && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  {[
                    searchQuery && `Search: ${searchQuery}`,
                    statusFilter &&
                      statusFilter !== "all" &&
                      `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
                    salesPointFilter &&
                      salesPointFilter !== "all" &&
                      `Point: ${getSalesPointName(Number(salesPointFilter))}`,
                    divisionFilter &&
                      divisionFilter !== "all" &&
                      `Division: ${divisionFilter}`,
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
            <LoadingIndicator message="Loading shops..." />
          </div>
        ) : shops.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Store className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No shops found</p>
              <p className="text-xs text-muted-foreground">
                {hasFilters
                  ? "No shops match these filters. Try a different sales point, division or status."
                  : "Get started by adding your first shop."}
              </p>
            </div>
            {hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              can(MENU_URL, "canCreate") && (
                <Button size="sm" asChild>
                  <Link href="/admin/sales-point-shop/add">
                    <Plus className="size-4" /> Add Shop
                  </Link>
                </Button>
              )
            )}
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <StatsCard
                icon={Store}
                title="Total shops"
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
                bgColor="red"
              />
              <StatsCard
                icon={Building}
                title="Sales points"
                value={salesPoints.length.toLocaleString("en-US")}
                description="Available to assign"
                bgColor="purple"
              />
            </div>

            {/* Shops */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Shops</h3>
                  <p className="text-xs text-muted-foreground">
                    Grouped by sales point · {limit} per page
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {totalItems.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table min-w-190">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Shop name</TableHead>
                      <TableHead>Sales point</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="w-full">Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shops.map((shop) => (
                      <TableRow key={shop.id}>
                        <TableCell className="py-2.5 pl-4">
                          <Link
                            href={`/admin/sales-point-shop/${shop.id}/edit`}
                            className="flex items-center gap-2 font-medium leading-tight hover:text-primaryColor hover:underline"
                          >
                            <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{shop.shopName}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {getSalesPointName(shop.salesPointId)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 whitespace-nowrap text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {shop.district}, {shop.division}
                          </span>
                        </TableCell>
                        <TableCell className="w-full">
                          <p
                            className="line-clamp-2 text-sm text-muted-foreground"
                            title={shop.address || undefined}
                          >
                            {shop.address || "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <ActiveStatusToggle
                            isActive={shop.isActive}
                            disabled={togglingId === shop.id}
                            onToggle={() => toggleActive(shop)}
                            label={shop.shopName}
                          />
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          {renderActions(shop)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {shops.map((shop) => (
                  <article key={shop.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/sales-point-shop/${shop.id}/edit`}
                        className="flex min-w-0 items-center gap-2 hover:text-primaryColor"
                      >
                        <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {shop.shopName}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {getSalesPointName(shop.salesPointId)}
                          </p>
                        </div>
                      </Link>
                      {renderActions(shop)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          District
                        </p>
                        <p className="truncate text-sm font-semibold">
                          {shop.district || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Division
                        </p>
                        <p className="truncate text-sm font-semibold">
                          {shop.division || "—"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Address
                        </p>
                        <p className="line-clamp-3 text-sm leading-snug wrap-break-word">
                          {shop.address || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Status
                      </span>
                      <ActiveStatusToggle
                        isActive={shop.isActive}
                        disabled={togglingId === shop.id}
                        onToggle={() => toggleActive(shop)}
                        label={shop.shopName}
                      />
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer: what the list covers */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-xs text-muted-foreground">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} shop
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

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
