"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { Banner } from "@/utils/types";
import {
  Ban,
  CheckCircle,
  Filter,
  ImageIcon,
  Plus,
  XCircle,
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

  const renderActiveFilters = () => {
    if (!hasActiveFilters()) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
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
            Status: {statusFilter === "active" ? "Active" : "Inactive"}
            <button onClick={() => setStatusFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {typeFilter && typeFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1 capitalize"
          >
            Type: {typeFilter}
            <button onClick={() => setTypeFilter("")} className="ml-1">
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

  const renderFiltersMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-3 shrink-0">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {(statusFilter || typeFilter) && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="grid grid-cols-2 gap-3 p-3">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Status</h4>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => {
                setStatusFilter(value === "all" ? "" : value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
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
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Type</h4>
            <Select
              value={typeFilter || "all"}
              onValueChange={(value) => {
                setTypeFilter(value === "all" ? "" : value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="main">Main</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter || typeFilter) && (
            <div className="col-span-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full mt-2"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b">
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
            <div className="flex flex-row items-center gap-2 w-full lg:w-auto">
              <TableSearch
                wrapperClassName="w-full sm:w-64"
                placeholder="Search banners..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {renderFiltersMenu()}
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Banners..." />
          ) : banners.length === 0 ? (
            renderEmptyState()
          ) : (
            renderTableView()
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${banners.length} of ${totalItems} banners`}
            </p>
          </div>

          <div className="flex-1 w-full md:w-auto">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={handlePageChange}
            />
          </div>
        </div>
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
