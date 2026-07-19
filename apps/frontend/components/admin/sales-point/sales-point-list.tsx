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
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { SalesPoint } from "@/utils/types";
import {
  Filter,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Store,
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

  const fetchSalesPoints = async () => {
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
  };

  useEffect(() => {
    fetchSalesPoints();
  }, []);

  useEffect(() => {
    fetchSalesPoints();
    updateUrl();
  }, [currentPage, limit, searchQuery, statusFilter]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center  text-center">
      <Store className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No sales points found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery || statusFilter
          ? "No sales points match your search criteria. Try different filters."
          : "Get started by adding your first sales point."}
      </p>
      {!(searchQuery || statusFilter) && (
        <Button asChild className="mt-4">
          <Link href="/admin/sales-point/add">
            <Plus className="mr-2 h-4 w-4" /> Add Sales Point
          </Link>
        </Button>
      )}
      {(searchQuery || statusFilter) && (
        <Button
          variant="outline"
          className="mt-4 bg-transparent"
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      )}
    </div>
  );

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
    <div className="md:p-4 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Logo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead className="hidden lg:table-cell">Website</TableHead>
            <TableHead className="hidden md:table-cell">Shops</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">
              Display Order
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesPoints.map((salesPoint) => (
            <TableRow key={salesPoint.id}>
              <TableCell>
                <div className="w-16 h-16  overflow-hidden">
                  <Image
                    src={salesPoint?.logoAttachment?.url || "/placeholder.svg"}
                    alt={salesPoint.name}
                    width={80}
                    height={64}
                    className="object-cover"
                  />
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{salesPoint.name}</div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3" />
                    {salesPoint.contactNumber}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="h-3 w-3" />
                    {salesPoint.email}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {salesPoint.website ? (
                  <a
                    href={salesPoint.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <Globe className="h-3 w-3" />
                    Visit
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="text-sm">
                    {salesPoint.shops?.length || 0}
                  </span>
                </div>
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <Badge
                  variant={salesPoint.isActive ? "default" : "destructive"}
                >
                  {salesPoint.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {salesPoint.order}
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
                      <Link href={`/admin/sales-point/${salesPoint.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(salesPoint)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
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
    <>
      <div className="w-full md:p-4 p-2">
        <PageHeader
          title="Sales Points"
          description="Manage your sales points and their shops"
          actionLabel="Add Sales Point"
          actionHref="/admin/sales-point/add"
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search sales points..."
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
                    className="flex items-center gap-2 px-3 bg-transparent"
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
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Sales Points..." />
          ) : salesPoints.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="mt-6">{renderTableView()}</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${salesPoints.length} of ${totalItems} sales points`}
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

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
