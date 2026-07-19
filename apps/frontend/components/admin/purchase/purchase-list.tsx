"use client";

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
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { Purchase } from "@/utils/types";
import {
  DollarSign,
  Filter,
  List,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
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

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
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

    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, statusFilter]);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);

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

  useEffect(() => {
    fetchPurchases();
  }, []);

  useEffect(() => {
    fetchPurchases();
    updateUrl();
  }, [currentPage, limit, searchQuery, statusFilter]);

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
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Package className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No purchases found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery || statusFilter
          ? "No purchases match your search criteria. Try different filters."
          : "Get started by adding your first purchase."}
      </p>
      {!(searchQuery || statusFilter) && (
        <Button asChild className="mt-4">
          <Link href="/admin/purchase/add">
            <Plus className="mr-2 h-4 w-4" /> Add Purchase
          </Link>
        </Button>
      )}
      {(searchQuery || statusFilter) && (
        <Button variant="outline" className="mt-4" onClick={clearFilters}>
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
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Purchase #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Products</TableHead>
            <TableHead className="text-right">Total Quantity</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Paid Amount</TableHead>
            <TableHead className="text-right">Payment Status</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="hidden md:table-cell">Created By</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
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

            const badgeVariant =
              status === "delivered"
                ? "default"
                : status === "pending"
                ? "outline"
                : "destructive";

            const totalQuantity =
              items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <TableRow key={id}>
                <TableCell className="font-medium">{purchaseNumber}</TableCell>

                <TableCell>{supplier?.name}</TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    {items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center"
                      >
                        <span className="font-medium ">
                          {item.product.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="text-center">{totalQuantity}</TableCell>

                <TableCell className="text-right">
                  {formatCurrencyEnglish(Number(totalValue))}
                </TableCell>

                <TableCell className="text-right">
                  {formatCurrencyEnglish(Number(amountPaid))}
                </TableCell>

                <TableCell className="capitalize text-center">
                  <Badge
                    variant={
                      paymentStatus === "paid"
                        ? "default"
                        : paymentStatus === "partial"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {paymentStatus}
                  </Badge>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {formatDateTime(purchaseDate)}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {createdBy?.name}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <Badge variant={badgeVariant}>{formattedStatus}</Badge>
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
                        <Link href={`/admin/purchase/${id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      {parseFloat(amountPaid) < parseFloat(totalValue) && (
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/purchase/${id}/payment`}>
                            <DollarSign className="mr-2 h-4 w-4" /> Make Payment
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/purchase/${id}/payments`}>
                          <List className="mr-2 h-4 w-4" /> View Payments
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(purchase)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
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
      <div className="w-full md:p-6 p-2">
        <PageHeader
          title="Purchases"
          description="Manage your product purchases"
          actionLabel="Add Purchase"
          actionHref="/admin/purchase/add"
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search purchases..."
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
                      {statusFilter && statusFilter !== "all" && (
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
                            setStatusFilter("completed");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
                            statusFilter === "completed"
                              ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 text-green-600 dark:text-green-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Completed
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter("pending");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
                            statusFilter === "pending"
                              ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-yellow-500" />
                          Pending
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter("cancelled");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
                            statusFilter === "cancelled"
                              ? "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 text-red-600 dark:text-red-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          Cancelled
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
            <LoadingIndicator message="Loading Purchases..." />
          ) : purchases.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="mt-6">{renderTableView()}</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
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
