"use client";

import type React from "react";

import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { Banner } from "@/utils/types";
import { Filter, ImageIcon, Plus, Search, XCircle } from "lucide-react";
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
        params.append("status", statusFilter);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <ImageIcon className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No banners found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery || statusFilter || typeFilter
          ? "No banners match your search criteria. Try different filters."
          : "Get started by adding your first banner."}
      </p>
      {!(searchQuery || statusFilter || typeFilter) && (
        <Button asChild className="mt-4">
          <Link href="/admin/banner/add">
            <Plus className="mr-2 h-4 w-4" /> Add Banner
          </Link>
        </Button>
      )}
      {(searchQuery || statusFilter || typeFilter) && (
        <Button variant="outline" className="mt-4" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );

  const renderActiveFilters = () => {
    const hasFilters = searchQuery || statusFilter || typeFilter;

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

        {typeFilter && typeFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
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

  const renderTableView = () => (
    <BannerTable banners={banners} onDeleteClick={handleDeleteClick} />
  );

  return (
    <>
      <div className="w-full md:p-6 p-2">
        <PageHeader
          title="Banners"
          description="Manage your promotional banners"
          actionLabel="Add Banner"
          actionHref="/admin/banner/add"
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search banners..."
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
                      {(statusFilter || typeFilter) && (
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
                        Status
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            setStatusFilter("all");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            statusFilter === "all"
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter("active");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
                            statusFilter === "active"
                              ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 text-green-600 dark:text-green-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Active
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter("inactive");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
                            statusFilter === "inactive"
                              ? "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 text-red-600 dark:text-red-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          Inactive
                        </button>
                      </div>
                    </div>

                    {/* Type Filter */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setTypeFilter("hero");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            typeFilter === "hero"
                              ? "bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 text-purple-600 dark:text-purple-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          Hero
                        </button>
                        <button
                          onClick={() => {
                            setTypeFilter("promo");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            typeFilter === "promo"
                              ? "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          Promo
                        </button>
                        <button
                          onClick={() => {
                            setTypeFilter("sidebar");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            typeFilter === "sidebar"
                              ? "bg-cyan-50 border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          Sidebar
                        </button>
                        <button
                          onClick={() => {
                            setTypeFilter("popup");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            typeFilter === "popup"
                              ? "bg-pink-50 border-pink-200 dark:bg-pink-900/30 dark:border-pink-800 text-pink-600 dark:text-pink-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          Popup
                        </button>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Banners..." />
          ) : banners.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="mt-6">{renderTableView()}</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
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
