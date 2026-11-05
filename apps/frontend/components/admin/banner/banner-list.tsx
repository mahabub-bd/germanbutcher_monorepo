"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ListPaginationFooter } from "@/components/common/list-pagination-footer";
import { PillBadge } from "@/components/common/pill-badge";
import { TableSearch } from "@/components/common/table-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { Banner } from "@/utils/types";
import {
  Ban,
  CheckCircle,
  ImageIcon,
  Plus,
  SlidersHorizontal
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";
import { BannerTable } from "./banner-table";

interface BannerListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function BannerList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: BannerListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/banner/banner-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [typeFilter, setTypeFilter] = useState(
    getInitialParam("type") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  // Below `md` the filters collapse into a bottom sheet.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
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
    if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    searchQuery,
    statusFilter,
    typeFilter,
  ]);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetchDataPagination<{
        data: Banner[];
        total: number;
        totalPages: number;
      }>(`banners?${params.toString()}`);
      setBanners(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("Failed to load banners. Please try again.");
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    fetchBanners();
    updateUrl();
  }, [currentPage, limit, searchQuery, statusFilter, typeFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBanner) return;

    try {
      await deleteData("banners", selectedBanner.id);
      fetchBanners();
      toast.success("Banner deleted successfully");
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Failed to delete banner. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setTypeFilter("");
    setCurrentPage(1);
  };

  const { togglingId, toggleActive } = useActiveStatusToggle<Banner>({
    getId: (banner) => banner.id,
    getName: (banner) => banner.title,
    buildEndpoint: (id) => `banners/${id}`,
    setStatusLocally: (id, isActive) =>
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive } : b))
      ),
    errorLabel: "banner status",
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasActiveFilters = () =>
    Boolean(searchQuery || statusFilter || typeFilter);

  const activeFilterCount = [
    Boolean(statusFilter),
    Boolean(typeFilter),
  ].filter(Boolean).length;

  const activeFilterSummary = [
    searchQuery && `Search: ${searchQuery}`,
    statusFilter &&
    `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
    typeFilter && `Type: ${typeFilter.charAt(0).toUpperCase()}${typeFilter.slice(1)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  // One source of truth for the filter controls: the toolbar renders them
  // inline ("bar") at md+, the mobile sheet renders the same nodes full width
  // ("sheet") under a visible label.
  const renderFilterControls = (mode: "bar" | "sheet") => {
    const triggerClass =
      mode === "bar" ? "h-9 w-full" : "h-11 w-full px-3 text-sm font-medium";

    return [
      {
        key: "status",
        label: "Status",
        barClass: "md:w-36",
        node: (
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => {
              setStatusFilter(value === "all" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Active
                </span>
              </SelectItem>
              <SelectItem value="inactive">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Inactive
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "type",
        label: "Type",
        barClass: "md:w-36",
        node: (
          <Select
            value={typeFilter || "all"}
            onValueChange={(value) => {
              setTypeFilter(value === "all" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="main">Main</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
    ];
  };

  const renderEmptyState = () => (
    <div className="p-4 pb-6">
      <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 text-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No banners found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          {hasActiveFilters()
            ? "No banners match your search criteria. Try different filters."
            : "Get started by adding your first banner."}
        </p>
        {!hasActiveFilters() && can(MENU_URL, "canCreate") && (
          <Button asChild className="mt-4">
            <Link href="/admin/banner/add">
              <Plus className="mr-2 h-4 w-4" /> Add Banner
            </Link>
          </Button>
        )}
        {hasActiveFilters() && (
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="min-w-0">
      <BannerTable
        banners={banners}
        onDeleteClick={handleDeleteClick}
        onToggleActive={toggleActive}
        togglingId={togglingId}
      />
    </div>
  );

  return (
    <>
      <div className="w-full space-y-4">
        <PageHeader
          title="Banners"
          description="Manage your promotional banners"
          {...(can(MENU_URL, "canCreate")
            ? {
              actionLabel: "Add Banner",
              actionHref: "/admin/banner/add",
            }
            : {})}
        />

        {/* Summary tiles */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
          <StatsCard
            icon={ImageIcon}
            title="Total Banners"
            value={totalItems}
            bgColor="blue"
          />
          <StatsCard
            icon={CheckCircle}
            title="Active"
            value={banners.filter((b) => b.isActive).length}
            bgColor="green"
          />
          <StatsCard
            icon={Ban}
            title="Inactive"
            value={banners.filter((b) => !b.isActive).length}
            bgColor="orange"
          />
        </div>

        {/* List card: toolbar + table */}
        <div className="rounded-sm border bg-card">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                <ImageIcon className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">All Banners</h3>
                <p className="text-sm text-muted-foreground">
                  {totalItems} banner{totalItems === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 lg:flex-nowrap lg:justify-end">
              <TableSearch
                wrapperClassName="min-w-0 flex-1 md:max-w-xs md:flex-none"
                placeholder="Search banners..."
                value={searchQuery}
                onChange={handleSearchChange}
              />

              {/* Mobile: filters collapse into a bottom sheet */}
              <div className="shrink-0 md:hidden">
                <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5">
                      <SlidersHorizontal className="size-3.5" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge className="size-4.5 rounded-full px-0 text-[0.65rem] font-semibold">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="inset-x-3 max-h-[82dvh] gap-0 overflow-y-auto rounded-2xl"
                  >
                    <SheetHeader className="border-b pr-14">
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Narrow banners by status and type.
                      </SheetDescription>
                    </SheetHeader>

                    {renderFilterControls("sheet").map((control) => (
                      <div key={control.key} className="px-4 pt-4">
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {control.label}
                        </p>
                        {control.node}
                      </div>
                    ))}

                    <SheetFooter className="sticky bottom-0 mt-4 flex-row border-t bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          clearFilters();
                          setFilterSheetOpen(false);
                        }}
                      >
                        Clear all
                      </Button>
                      <SheetClose asChild>
                        <Button className="flex-1">
                          {totalItems > 0
                            ? `Show ${totalItems.toLocaleString("en-US")} banners`
                            : "Done"}
                        </Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop: inline filter controls */}
              <div className="hidden items-center gap-2.5 md:flex">
                {renderFilterControls("bar").map((control) => (
                  <div key={control.key} className={control.barClass}>
                    {control.node}
                  </div>
                ))}
              </div>

              {hasActiveFilters() && (
                <div className="hidden min-w-0 items-center gap-2 lg:flex">
                  <PillBadge
                    className="min-w-0 font-medium"
                    title={activeFilterSummary}
                  >
                    <span className="max-w-44 truncate">
                      {activeFilterSummary}
                    </span>
                  </PillBadge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 shrink-0 text-muted-foreground"
                    onClick={clearFilters}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <LoadingIndicator message="Loading Banners..." />
          ) : banners.length === 0 ? (
            renderEmptyState()
          ) : (
            renderTableView()
          )}
        </div>

        {/* Pagination */}
        <ListPaginationFooter
          variant="standalone"
          currentPage={currentPage}
          limit={limit}
          totalItems={totalItems}
          totalPages={totalPages}
          entityLabel="banner"
          onPageChange={handlePageChange}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
