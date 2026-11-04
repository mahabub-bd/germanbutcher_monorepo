"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PaginationComponent } from "@/components/common/pagination";
import { PillBadge, type PillTone } from "@/components/common/pill-badge";
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { Purchase } from "@/utils/types";
import {
  BadgeDollarSign,
  CheckCircle,
  DollarSign,
  List,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../../delete-confirmation-dialog";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";

/** Purchase payment state → pill colour. */
const PAYMENT_TONE: Record<string, PillTone> = {
  paid: "emerald",
  partial: "amber",
  due: "red",
};

/** Purchase lifecycle state → pill colour. */
const STATUS_TONE: Record<string, PillTone> = {
  pending: "amber",
  shipped: "violet",
  delivered: "emerald",
  cancelled: "red",
};

/** Sentence case for the raw API values ("pending" → "Pending"). */
const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

/** Label + value block reused by the mobile cards. */
function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-foreground/60">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

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
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
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
    Boolean(
      searchQuery.trim() ||
        (statusFilter && statusFilter !== "all") ||
        (paymentStatusFilter && paymentStatusFilter !== "all")
    );

  // Select filters only — search lives outside the mobile filter sheet.
  const activeFilterCount = [
    statusFilter,
    paymentStatusFilter,
  ].filter((value) => value && value !== "all").length;

  // Shared filter selects — rendered in the md toolbar and in the mobile
  // filter sheet so both stay in sync with one definition.
  const statusSelect = (
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
        <SelectItem value="all">All statuses</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="shipped">Shipped</SelectItem>
        <SelectItem value="delivered">Delivered</SelectItem>
        <SelectItem value="cancelled">Cancelled</SelectItem>
      </SelectContent>
    </Select>
  );

  const paymentStatusSelect = (
    <Select
      value={paymentStatusFilter || "all"}
      onValueChange={(value) => {
        setPaymentStatusFilter(value === "all" ? "" : value);
        setCurrentPage(1);
      }}
    >
      <SelectTrigger className="h-9 w-full">
        <SelectValue placeholder="Payment" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All payments</SelectItem>
        <SelectItem value="paid">Paid</SelectItem>
        <SelectItem value="partial">Partial</SelectItem>
        <SelectItem value="due">Due</SelectItem>
      </SelectContent>
    </Select>
  );

  const paidCount = purchases.filter((p) => p.paymentStatus === "paid").length;
  const partialCount = purchases.filter(
    (p) => p.paymentStatus === "partial"
  ).length;
  const outstanding = purchases.reduce(
    (sum, p) => sum + Math.max(Number(p.totalValue) - Number(p.amountPaid), 0),
    0
  );

  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (purchase: Purchase) => (
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
            <Link href={`/admin/procurement/purchases/${purchase.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canCreate") &&
          parseFloat(purchase.amountPaid) < parseFloat(purchase.totalValue) && (
            <DropdownMenuItem asChild>
              <Link href={`/admin/procurement/purchases/${purchase.id}/payment`}>
                <DollarSign className="size-4" /> Make payment
              </Link>
            </DropdownMenuItem>
          )}
        <DropdownMenuItem asChild>
          <Link href={`/admin/procurement/purchases/${purchase.id}/payments`}>
            <List className="size-4" /> View payments
          </Link>
        </DropdownMenuItem>
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => handleDeleteClick(purchase)}
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
          title="Purchases"
          description="Every stock purchase order, the supplier behind it and what is still owed."
        >
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" asChild>
              <Link href="/admin/procurement/purchases/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Purchase</span>
              </Link>
            </Button>
          )}
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-nowrap md:items-center md:gap-3">
            <div className="flex items-center gap-2">
              <TableSearch
                wrapperClassName="w-full md:max-w-xs"
                className="h-9"
                placeholder="Search by purchase number or supplier..."
                value={searchQuery}
                onChange={handleSearchChange}
              />

              {/* Mobile filter trigger — opens the bottom-sheet filter */}
              <Sheet
                open={isFilterSheetOpen}
                onOpenChange={setIsFilterSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 gap-1.5 md:hidden"
                  >
                    <SlidersHorizontal className="size-4" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-primaryColor text-[10px] font-semibold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-4"
                >
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-3 pb-2">
                    {statusSelect}
                    {paymentStatusSelect}
                  </div>
                  <SheetFooter className="flex-row gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={clearFilters}
                    >
                      Clear all
                    </Button>
                    <SheetClose asChild>
                      <Button className="flex-1">Done</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>

            <div className="hidden md:flex md:items-center md:gap-3">
              <div className="md:w-40 md:shrink-0">{statusSelect}</div>
              <div className="md:w-40 md:shrink-0">{paymentStatusSelect}</div>
            </div>

            {hasActiveFilters() && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  {[
                    searchQuery.trim() && `Search: ${searchQuery.trim()}`,
                    statusFilter &&
                      statusFilter !== "all" &&
                      `Status: ${capitalize(statusFilter)}`,
                    paymentStatusFilter &&
                      paymentStatusFilter !== "all" &&
                      `Payment: ${capitalize(paymentStatusFilter)}`,
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
            <LoadingIndicator message="Loading purchases..." />
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Package className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No purchases found</p>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters()
                  ? "No purchase matches these filters. Try another number, supplier or status."
                  : "Record your first purchase to start tracking stock and supplier payments."}
              </p>
            </div>
            {hasActiveFilters() ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : can(MENU_URL, "canCreate") ? (
              <Button size="sm" asChild>
                <Link href="/admin/procurement/purchases/add">
                  <Plus className="size-4" /> Add purchase
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Page totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <StatsCard
                icon={Package}
                title="Total purchases"
                value={totalItems.toLocaleString("en-US")}
                description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle}
                title="Paid in full"
                value={paidCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="green"
              />
              <StatsCard
                icon={BadgeDollarSign}
                title="Partially paid"
                value={partialCount.toLocaleString("en-US")}
                description="Balance still open"
                bgColor="amber"
              />
              <StatsCard
                icon={DollarSign}
                title="Outstanding"
                value={formatCurrencyEnglish(outstanding)}
                description="Owed on this page"
                bgColor="red"
              />
            </div>

            {/* Purchases */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/15 dark:text-indigo-400">
                    <ShoppingCart className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">All purchases</h3>
                    <p className="text-[13px] text-foreground/70">
                      Supplier invoices, stock received and balances still open.
                    </p>
                  </div>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {totalItems.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                {/* One line per cell, uniform text-sm: each stacked pair from
                    before is now its own column so rows stay single-line. */}
                <Table className="report-table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Purchase</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created by</TableHead>
                      <TableHead className="w-14 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => {
                      const productNames =
                        purchase.items?.map((item) => item.product.name) ?? [];
                      const totalQuantity =
                        purchase.items?.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        ) ?? 0;
                      const stamp = formatDateTime(purchase.purchaseDate);
                      const itemsLabel =
                        productNames.length === 0
                          ? "No items"
                          : productNames.length > 1
                            ? `${productNames[0]} +${productNames.length - 1} more`
                            : productNames[0];

                      return (
                        <TableRow key={purchase.id}>
                          <TableCell className="py-2.5 pl-4">
                            <span
                              className="block truncate text-sm font-medium"
                              title={purchase.purchaseNumber}
                            >
                              {purchase.purchaseNumber}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span
                              className="block truncate text-sm"
                              title={purchase.supplier?.name || undefined}
                            >
                              {purchase.supplier?.name || "No supplier"}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span
                              className="block truncate text-sm"
                              title={
                                productNames.length > 0
                                  ? `${productNames.join(", ")} · ${totalQuantity} unit${totalQuantity === 1 ? "" : "s"}`
                                  : undefined
                              }
                            >
                              {itemsLabel}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            <span className="text-sm font-semibold tabular-nums">
                              {formatCurrencyEnglish(Number(purchase.totalValue))}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {formatCurrencyEnglish(Number(purchase.amountPaid))}
                            </span>
                          </TableCell>

                          <TableCell>
                            <PillBadge
                              tone={
                                PAYMENT_TONE[purchase.paymentStatus] ??
                                "neutral"
                              }
                            >
                              {capitalize(purchase.paymentStatus || "due")}
                            </PillBadge>
                          </TableCell>

                          <TableCell>
                            <span
                              className="block truncate whitespace-nowrap text-sm tabular-nums"
                              title={stamp}
                            >
                              {stamp}
                            </span>
                          </TableCell>

                          <TableCell>
                            <PillBadge
                              tone={STATUS_TONE[purchase.status] ?? "neutral"}
                            >
                              {capitalize(purchase.status || "pending")}
                            </PillBadge>
                          </TableCell>

                          <TableCell>
                            <span
                              className="block truncate text-sm"
                              title={purchase.createdBy?.name || undefined}
                            >
                              {purchase.createdBy?.name || "—"}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            {renderActions(purchase)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {purchases.map((purchase) => {
                  const productNames =
                    purchase.items?.map((item) => item.product.name) ?? [];
                  const totalQuantity =
                    purchase.items?.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    ) ?? 0;

                  return (
                    <article key={purchase.id} className="space-y-3 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:text-indigo-400">
                            <Package className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {purchase.purchaseNumber}
                            </p>
                            <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                              {purchase.supplier?.name || "No supplier"}
                            </p>
                          </div>
                        </div>
                        {renderActions(purchase)}
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/40 p-2.5">
                        <DetailField label="Items">
                          <p className="truncate text-sm font-medium">
                            {productNames.length === 0
                              ? "No items"
                              : productNames[0]}
                          </p>
                          <p className="text-[13px] text-foreground/70">
                            {productNames.length > 1
                              ? `+${productNames.length - 1} more · `
                              : ""}
                            {totalQuantity} unit
                            {totalQuantity === 1 ? "" : "s"}
                          </p>
                        </DetailField>

                        <DetailField label="Total value">
                          <p className="text-sm font-semibold tabular-nums">
                            {formatCurrencyEnglish(Number(purchase.totalValue))}
                          </p>
                          <p className="text-[13px] tabular-nums text-foreground/70">
                            Paid{" "}
                            {formatCurrencyEnglish(Number(purchase.amountPaid))}
                          </p>
                        </DetailField>

                        <DetailField label="Payment">
                          <PillBadge
                            tone={
                              PAYMENT_TONE[purchase.paymentStatus] ?? "neutral"
                            }
                          >
                            {capitalize(purchase.paymentStatus || "due")}
                          </PillBadge>
                        </DetailField>

                        <DetailField label="Status">
                          <PillBadge
                            tone={STATUS_TONE[purchase.status] ?? "neutral"}
                          >
                            {capitalize(purchase.status || "pending")}
                          </PillBadge>
                        </DetailField>

                        <div className="col-span-2">
                          <DetailField label="Date">
                            <p className="text-sm tabular-nums">
                              {formatDateTime(purchase.purchaseDate)}
                            </p>
                          </DetailField>
                        </div>

                        <div className="col-span-2">
                          <DetailField label="Created by">
                            <p className="truncate text-sm">
                              {purchase.createdBy?.name || "—"}
                            </p>
                          </DetailField>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-[13px] text-foreground/70">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} purchase
                  {totalItems === 1 ? "" : "s"}
                  {searchQuery.trim() && ` matching “${searchQuery.trim()}”`}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
