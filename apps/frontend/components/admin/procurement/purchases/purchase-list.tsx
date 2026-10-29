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
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { Purchase } from "@/utils/types";
import {
  BadgeDollarSign,
  Ban,
  Boxes,
  CheckCircle,
  DollarSign,
  Filter,
  List,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../../delete-confirmation-dialog";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";

interface PurchaseListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function PurchaseList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: PurchaseListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/procurement/purchases";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  // Applied 400ms after typing stops — the input stays instant, the API call
  // doesn't fire per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(
    getInitialParam("paymentStatus") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (paymentStatusFilter && paymentStatusFilter !== "all")
      params.set("paymentStatus", paymentStatusFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    debouncedSearch,
    statusFilter,
    paymentStatusFilter,
  ]);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);
      if (paymentStatusFilter && paymentStatusFilter !== "all")
        params.append("paymentStatus", paymentStatusFilter);

      const response = await fetchDataPagination<{
        data: Purchase[];
        total: number;
        totalPages: number;
      }>(`purchases?${params.toString()}`);
      setPurchases(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to load purchases. Please try again.");
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchPurchases();
  }, [currentPage, limit, debouncedSearch, statusFilter, paymentStatusFilter]);

  // Sync the URL only for user-driven changes, not on first paint.
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPurchase) return;

    try {
      await deleteData("purchases", selectedPurchase.id);
      fetchPurchases();
      toast.success("Purchase deleted successfully");
    } catch (error) {
      console.error("Error deleting purchase:", error);
      toast.error("Failed to delete purchase. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPaymentStatusFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasActiveFilters = () =>
    Boolean(searchQuery || statusFilter || paymentStatusFilter);

  const renderEmptyState = () => (
    <div className="p-4 pb-6">
      <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 text-center">
        <Package className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No purchases found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          {hasActiveFilters()
            ? "No purchases match your search criteria. Try different filters."
            : "Get started by adding your first purchase."}
        </p>
        {!hasActiveFilters() && can(MENU_URL, "canCreate") && (
          <Button asChild className="mt-4">
            <Link href="/admin/procurement/purchases/add">
              <Plus className="mr-2 h-4 w-4" /> Add Purchase
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
            Status: {statusFilter}
            <button onClick={() => setStatusFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {paymentStatusFilter && paymentStatusFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Payment: {paymentStatusFilter}
            <button
              onClick={() => setPaymentStatusFilter("")}
              className="ml-1"
            >
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
          {(statusFilter || paymentStatusFilter) && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-100">
        <div className="grid grid-cols-2 gap-3 p-3">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Status</h4>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Payment</h4>
            <Select
              value={paymentStatusFilter}
              onValueChange={(value) => {
                setPaymentStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="All Payments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="due">Due</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter || paymentStatusFilter) && (
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
    <div className="overflow-x-auto">
      <Table className="min-w-215">
        <TableHeader>
          <TableRow>
            <TableHead>Purchase #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Products</TableHead>
            <TableHead className="text-center">
              Total Quantity
            </TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">
              Paid Amount
            </TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {purchases?.map((purchase) => {
            const {
              id,
              purchaseNumber,
              supplier,
              totalValue,
              amountPaid,
              paymentStatus,
              purchaseDate,
              status,
              createdBy,
              items,
            } = purchase;

            const formattedStatus = status
              ? status.charAt(0).toUpperCase() + status.slice(1)
              : "";

            const totalQuantity =
              items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <TableRow key={id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{purchaseNumber}</TableCell>

                <TableCell>{supplier?.name}</TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    {items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center"
                      >
                        <span className="font-medium text-sm">
                          {item.product.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted">
                    <Boxes className="h-3 w-3" />
                    {totalQuantity}
                  </span>
                </TableCell>

                <TableCell className="text-right font-medium">
                  <span className="inline-flex items-center justify-end gap-1.5">
                    <BadgeDollarSign className="h-3.5 w-3.5 text-green-600/70 dark:text-green-400/70" />
                    {formatCurrencyEnglish(Number(totalValue))}
                  </span>
                </TableCell>

                <TableCell className="text-right text-muted-foreground">
                  <span className="inline-flex items-center justify-end gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground/70" />
                    {formatCurrencyEnglish(Number(amountPaid))}
                  </span>
                </TableCell>

                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${paymentStatus === "paid"
                      ? "bg-emerald-600 text-white"
                      : paymentStatus === "partial"
                        ? "bg-amber-500 text-white"
                        : "bg-red-600 text-white"
                      }`}
                  >
                    {paymentStatus}
                  </span>
                </TableCell>

                <TableCell>
                  {formatDateTime(purchaseDate)}
                </TableCell>

                <TableCell>
                  {createdBy?.name}
                </TableCell>

                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold capitalize ${status === "delivered"
                      ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900"
                      : status === "pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                        : status === "shipped"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                  >
                    {formattedStatus}
                  </span>
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
                      {can(MENU_URL, "canEdit") && (
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/procurement/purchases/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {can(MENU_URL, "canCreate") &&
                        parseFloat(amountPaid) < parseFloat(totalValue) && (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/procurement/purchases/${id}/payment`}>
                              <DollarSign className="mr-2 h-4 w-4" /> Make Payment
                            </Link>
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/procurement/purchases/${id}/payments`}>
                          <List className="mr-2 h-4 w-4" /> View Payments
                        </Link>
                      </DropdownMenuItem>
                      {can(MENU_URL, "canDelete") && (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteClick(purchase)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="w-full space-y-4">
        <PageHeader
          title="Purchases"
          description="Manage your product purchases"
          {...(can(MENU_URL, "canCreate")
            ? {
              actionLabel: "Add Purchase",
              actionHref: "/admin/procurement/purchases/add",
            }
            : {})}
        />

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatsCard
            icon={Package}
            title="Total Purchases"
            value={totalItems}
            bgColor="blue"
          />
          <StatsCard
            icon={CheckCircle}
            title="Paid"
            value={purchases.filter((p) => p.paymentStatus === "paid").length}
            bgColor="green"
          />
          <StatsCard
            icon={Ban}
            title="Unpaid"
            value={purchases.filter((p) => p.paymentStatus !== "paid").length}
            bgColor="orange"
          />
        </div>

        {/* List card: toolbar + table */}
        <div className="rounded-sm border bg-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <ShoppingCart className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">All Purchases</h3>
                <p className="text-sm text-muted-foreground">
                  {totalItems} purchase{totalItems === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-2 w-full lg:w-auto">
              <TableSearch
                wrapperClassName="w-full sm:w-64 min-w-0"
                placeholder="Search purchases..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {renderFiltersMenu()}
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Purchases..." />
          ) : purchases.length === 0 ? (
            renderEmptyState()
          ) : (
            renderTableView()
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${purchases.length} of ${totalItems} purchases`}
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
