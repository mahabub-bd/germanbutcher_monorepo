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
import { cn } from "@/lib/utils";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { SalesPoint } from "@/utils/types";
import {
  CheckCircle2,
  Globe,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Store,
  StoreIcon,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface SalesPointListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function SalesPointList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: SalesPointListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/sales-point/sales-point-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [salesPoints, setSalesPoints] = useState<SalesPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSalesPoint, setSelectedSalesPoint] =
    useState<SalesPoint | null>(null);
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

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, statusFilter]);

  const fetchSalesPoints = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);

      const response = await fetchDataPagination<{
        data: SalesPoint[];
        total: number;
        totalPages: number;
      }>(`sales-points?${params.toString()}`);

      setSalesPoints(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching sales points:", error);
      toast.error("Failed to load sales points. Please try again.");
      setSalesPoints([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchSalesPoints();
  }, [fetchSalesPoints]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (salesPoint: SalesPoint) => {
    setSelectedSalesPoint(salesPoint);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSalesPoint) return;

    try {
      await deleteData("sales-points", selectedSalesPoint.id);
      fetchSalesPoints();
      toast.success("Sales point deleted successfully");
    } catch (error) {
      console.error("Error deleting sales point:", error);
      toast.error("Failed to delete sales point. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const { togglingId, toggleActive } = useActiveStatusToggle<SalesPoint>({
    getId: (salesPoint) => salesPoint.id,
    getName: (salesPoint) => salesPoint.name,
    buildEndpoint: (id) => `sales-points/${id}`,
    setStatusLocally: (id, isActive) =>
      setSalesPoints((prev) =>
        prev.map((sp) => (sp.id === id ? { ...sp, isActive } : sp))
      ),
    errorLabel: "sales point status",
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const activeCount = salesPoints.filter((sp) => sp.isActive).length;
  const inactiveCount = salesPoints.length - activeCount;
  const shopsOnPage = salesPoints.reduce(
    (sum, sp) => sum + (sp.shops?.length || 0),
    0
  );
  const hasFilters = Boolean(
    searchQuery || (statusFilter && statusFilter !== "all")
  );
  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (salesPoint: SalesPoint) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {can(MENU_URL, "canEdit") && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/sales-point/${salesPoint.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(salesPoint)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Sales Points"
          description="Regional outlets, their branding and the shops under each one."
        >
          {can(MENU_URL, "canCreate") && (
            <Button asChild size="sm">
              <Link href="/admin/sales-point/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Sales Point</span>
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchSalesPoints}
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
              placeholder="Search sales points..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

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

            {hasFilters && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  {[
                    searchQuery && `Search: ${searchQuery}`,
                    statusFilter &&
                      statusFilter !== "all" &&
                      `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
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
            <LoadingIndicator message="Loading sales points..." />
          </div>
        ) : salesPoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Store className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No sales points found</p>
              <p className="text-xs text-muted-foreground">
                {hasFilters
                  ? "No sales points match these filters. Try a different name or status."
                  : "Get started by adding your first sales point."}
              </p>
            </div>
            {hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              can(MENU_URL, "canCreate") && (
                <Button size="sm" asChild>
                  <Link href="/admin/sales-point/add">
                    <Plus className="size-4" /> Add Sales Point
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
                title="Total sales points"
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
                icon={StoreIcon}
                title="Shops"
                value={shopsOnPage.toLocaleString("en-US")}
                description="Attached on this page"
                bgColor="purple"
              />
            </div>

            {/* Sales points */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Sales points</h3>
                  <p className="text-xs text-muted-foreground">
                    Display order · {limit} per page
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {totalItems.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table table-fixed">
                  <TableHeader className="[&_th]:font-semibold">
                    <TableRow className="hover:bg-transparent">
                      {/* The logo lives inside the name cell so the outlet has a
                          single identity column. Contact is the one wide data
                          column — it carries phone, email and the website link,
                          so it is pinned at 256px and the website no longer needs
                          a column of its own. Banner / Shops / Order / Status stay
                          unsized and split whatever is left equally. Banner joins
                          at xl and Contact / Order at lg; below lg Shops and
                          Status keep a floor and the identity cell absorbs the
                          rest. */}
                      <TableHead className="pl-4 lg:w-72 2xl:w-80">
                        Sales point
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Banner
                      </TableHead>
                      <TableHead className="hidden lg:table-cell lg:w-64">
                        Contact
                      </TableHead>
                      <TableHead className="w-20 lg:w-auto">Shops</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Order
                      </TableHead>
                      <TableHead className="w-28 lg:w-auto">Status</TableHead>
                      <TableHead className="w-14 pr-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesPoints.map((salesPoint) => (
                      <TableRow key={salesPoint.id}>
                        <TableCell className="py-2.5 pl-4">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted p-1">
                              <Image
                                src={
                                  salesPoint?.logoAttachment?.url ||
                                  "/placeholder.svg"
                                }
                                alt={salesPoint.name}
                                width={80}
                                height={64}
                                className="h-full w-full object-contain"
                              />
                            </span>
                            <Link
                              href={`/admin/sales-point/${salesPoint.id}/edit`}
                              className="block truncate font-medium leading-tight hover:text-primaryColor hover:underline"
                              title={salesPoint.name}
                            >
                              {salesPoint.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <span className="flex aspect-2/1 h-10 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                            <Image
                              src={
                                salesPoint?.bannerAttachment?.url ||
                                "/placeholder.svg"
                              }
                              alt={`${salesPoint.name} banner`}
                              width={120}
                              height={70}
                              className="h-full w-full object-cover"
                            />
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="min-w-0 space-y-0.5">
                            <a
                              href={`tel:${salesPoint.contactNumber}`}
                              title={salesPoint.contactNumber || undefined}
                              className="flex min-w-0 items-center gap-1 whitespace-nowrap text-blue-600 hover:underline dark:text-blue-400"
                            >
                              <Phone className="size-3 shrink-0" />
                              <span className="truncate tabular-nums">
                                {salesPoint.contactNumber || "—"}
                              </span>
                            </a>
                            <a
                              href={`mailto:${salesPoint.email}`}
                              title={salesPoint.email || undefined}
                              className="flex min-w-0 items-center gap-1 text-muted-foreground hover:underline"
                            >
                              <Mail className="size-3 shrink-0" />
                              <span className="truncate">
                                {salesPoint.email || "—"}
                              </span>
                            </a>
                            {/* The website link lives here so Contact can own the
                                width a URL needs instead of spending a whole
                                column on a "Visit" label. */}
                            {salesPoint.website && (
                              <a
                                href={salesPoint.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={salesPoint.website}
                                className="flex min-w-0 items-center gap-1 text-muted-foreground hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                              >
                                <Globe className="size-3 shrink-0" />
                                <span className="truncate">
                                  {salesPoint.website.replace(
                                    /^https?:\/\//,
                                    ""
                                  )}
                                </span>
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 tabular-nums text-muted-foreground">
                            <StoreIcon className="size-3" />
                            {salesPoint.shops?.length || 0}
                          </span>
                        </TableCell>
                        <TableCell className="hidden tabular-nums text-muted-foreground lg:table-cell">
                          {salesPoint.order}
                        </TableCell>
                        <TableCell>
                          <ActiveStatusToggle
                            isActive={salesPoint.isActive}
                            disabled={togglingId === salesPoint.id}
                            onToggle={() => toggleActive(salesPoint)}
                            label={salesPoint.name}
                          />
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          {renderActions(salesPoint)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {salesPoints.map((salesPoint) => (
                  <article key={salesPoint.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/sales-point/${salesPoint.id}/edit`}
                        className="flex min-w-0 items-center gap-2.5 hover:text-primaryColor"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted p-1">
                          <Image
                            src={
                              salesPoint?.logoAttachment?.url ||
                              "/placeholder.svg"
                            }
                            alt={salesPoint.name}
                            width={80}
                            height={64}
                            className="h-full w-full object-contain"
                          />
                        </span>
                        <p className="truncate text-sm font-semibold">
                          {salesPoint.name}
                        </p>
                      </Link>
                      {renderActions(salesPoint)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Contact
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {salesPoint.contactNumber || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Shops · Order
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold tabular-nums">
                            {salesPoint.shops?.length || 0}
                          </span>{" "}
                          ·{" "}
                          <span className="font-semibold tabular-nums">
                            {salesPoint.order}
                          </span>
                        </p>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Email
                        </p>
                        <p className="truncate text-sm">{salesPoint.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Status
                      </span>
                      <ActiveStatusToggle
                        isActive={salesPoint.isActive}
                        disabled={togglingId === salesPoint.id}
                        onToggle={() => toggleActive(salesPoint)}
                        label={salesPoint.name}
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
                  {totalItems.toLocaleString("en-US")} sales point
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
