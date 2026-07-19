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
import { deleteData, fetchDataPagination } from "@/utils/api-utils";

import { divisions } from "@/constants";
import type { SalesPoint, Shop } from "@/utils/types";
import {
  Building,
  Filter,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
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

  // Separate URL update function (like ProductList)
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

  const fetchShops = async () => {
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
  };

  // Initial fetch
  useEffect(() => {
    fetchSalesPoints();
    fetchShops();
  }, []);

  // Fetch and update URL when dependencies change
  useEffect(() => {
    fetchShops();
    updateUrl();
  }, [
    currentPage,
    limit,
    searchQuery,
    statusFilter,
    salesPointFilter,
    divisionFilter,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (shop: Shop) => {
    setSelectedShop(shop);
    setIsDeleteDialogOpen(true);
  };

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

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Store className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No shops found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery || statusFilter || salesPointFilter || divisionFilter
          ? "No shops match your search criteria. Try different filters."
          : "Get started by adding your first shop."}
      </p>
      {!(searchQuery || statusFilter || salesPointFilter || divisionFilter) && (
        <Button asChild className="mt-4">
          <Link href="/admin/sales-point-shop/add">
            <Plus className="mr-2 h-4 w-4" /> Add Shop
          </Link>
        </Button>
      )}
      {(searchQuery || statusFilter || salesPointFilter || divisionFilter) && (
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
    const hasFilters =
      searchQuery || statusFilter || salesPointFilter || divisionFilter;
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
        {salesPointFilter && salesPointFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Sales Point: {getSalesPointName(Number(salesPointFilter))}
            <button onClick={() => setSalesPointFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {divisionFilter && divisionFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Division: {divisionFilter}
            <button onClick={() => setDivisionFilter("")} className="ml-1">
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
    <div className="md:p-6 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shop Name</TableHead>
            <TableHead className="hidden md:table-cell">Sales Point</TableHead>
            <TableHead className="hidden lg:table-cell">Location</TableHead>
            <TableHead className="hidden xl:table-cell">Address</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shops.map((shop) => (
            <TableRow key={shop.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{shop.shopName}</div>
                    <div className="text-sm text-muted-foreground md:hidden">
                      {getSalesPointName(shop.salesPointId)}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="font-medium">
                  {getSalesPointName(shop.salesPointId)}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">
                    {shop.district}, {shop.division}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <div className="text-sm text-muted-foreground max-w-xs truncate">
                  {shop.address}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={shop.isActive ? "default" : "destructive"}>
                  {shop.isActive ? "Active" : "Inactive"}
                </Badge>
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
                      <Link href={`/admin/sales-point-shop/${shop.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(shop)}
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
          title="Sales Point Shops"
          description="Manage shops for your sales points"
          actionLabel="Add Shop"
          actionHref="/admin/sales-point-shop/add"
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search shops..."
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
                  className="w-80 p-4 rounded-lg shadow-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                  sideOffset={8}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Filters</h4>
                      {(statusFilter || salesPointFilter || divisionFilter) && (
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
                            statusFilter === "all" || !statusFilter
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

                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Sales Point
                      </label>
                      <Select
                        value={salesPointFilter || "all"}
                        onValueChange={(value) => {
                          setSalesPointFilter(value === "all" ? "" : value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All Sales Points" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sales Points</SelectItem>
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

                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Division
                      </label>
                      <Select
                        value={divisionFilter || "all"}
                        onValueChange={(value) => {
                          setDivisionFilter(value === "all" ? "" : value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All Divisions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Divisions</SelectItem>
                          {divisions.map((division) => (
                            <SelectItem key={division} value={division}>
                              {division}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Shops..." />
          ) : shops.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="mt-6">{renderTableView()}</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${shops.length} of ${totalItems} shops`}
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
