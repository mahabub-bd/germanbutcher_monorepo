"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { PillBadge } from "@/components/common/pill-badge";
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
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
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";
import { formatDateTime } from "@/lib/utils";
import { deleteData, fetchData } from "@/utils/api-utils";
import type { PaymentMethod } from "@/utils/types";
import {
  CheckCircle2,
  CreditCard,
  MoreHorizontal,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export function PaymentMethodList() {
  const MENU_URL = "/admin/settings/payment-method";
  const { can } = usePermissions();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  // Below `md` the filters collapse into a bottom sheet.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);

  const { togglingId, toggleActive } = useActiveStatusToggle<PaymentMethod>({
    getId: (method) => method.id,
    getName: (method) => method.name,
    buildEndpoint: (id) => `order-payment-methods/${id}`,
    setStatusLocally: (id, isActive) =>
      setPaymentMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isActive } : m))
      ),
    errorLabel: "payment method status",
  });

  const fetchPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const response = await fetchData("order-payment-methods");
      setPaymentMethods(response as PaymentMethod[]);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to load payment methods. Please try again.");
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleDeleteClick = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPaymentMethod) return;

    try {
      await deleteData("order-payment-methods", selectedPaymentMethod.id);
      fetchPaymentMethods();
      toast.success("Payment method deleted successfully");
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Failed to delete payment method. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  // The endpoint returns the full list, so filtering happens over the
  // loaded rows.
  const query = searchQuery.trim().toLowerCase();
  const visibleMethods = paymentMethods.filter((method) => {
    if (statusFilter === "active" && !method.isActive) return false;
    if (statusFilter === "inactive" && method.isActive) return false;
    if (!query) return true;
    return (
      method.name?.toLowerCase().includes(query) ||
      method.code?.toLowerCase().includes(query) ||
      method.description?.toLowerCase().includes(query)
    );
  });

  const activeCount = paymentMethods.filter((m) => m.isActive).length;
  const hasFilters = Boolean(
    searchQuery || (statusFilter && statusFilter !== "all")
  );

  const activeFilterCount = [Boolean(statusFilter)].filter(Boolean).length;

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
        barClass: "md:w-35 md:shrink-0",
        node: (
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              setStatusFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
    ];
  };

  const renderActions = (method: PaymentMethod) => (
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
            <Link href={`/admin/settings/payment-method/${method.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(method)}
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
          title="Payment Methods"
          description="Payment options customers can pick at checkout, with their internal code."
        >
          {can(MENU_URL, "canCreate") && (
            <Button asChild size="sm">
              <Link href="/admin/settings/payment-method/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Payment Method</span>
              </Link>
            </Button>
          )}
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap md:gap-3">
            <TableSearch
              wrapperClassName="min-w-0 flex-1 md:max-w-xs md:flex-none"
              className="h-9"
              placeholder="Search by name, code or description..."
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
                      Narrow payment methods by status.
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
                        {visibleMethods.length > 0
                          ? `Show ${visibleMethods.length.toLocaleString("en-US")} methods`
                          : "Done"}
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop: inline filter controls */}
            <div className="hidden items-center gap-3 md:flex">
              {renderFilterControls("bar").map((control) => (
                <div key={control.key} className={control.barClass}>
                  {control.node}
                </div>
              ))}
            </div>

            {hasFilters && (
              <div className="hidden min-w-0 items-center gap-2 md:flex md:ml-auto">
                <PillBadge className="font-medium">
                  {[
                    searchQuery && `Search: ${searchQuery}`,
                    statusFilter &&
                    (statusFilter === "active"
                      ? "Status: Active"
                      : "Status: Inactive"),
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
            <LoadingIndicator message="Loading payment methods..." />
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <CreditCard className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No payment methods found</p>
              <p className="text-xs text-muted-foreground">
                Get started by creating your first payment method.
              </p>
            </div>
            {can(MENU_URL, "canCreate") && (
              <Button size="sm" asChild>
                <Link href="/admin/settings/payment-method/add">
                  <Plus className="size-4" /> Add Payment Method
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatsCard
                icon={CreditCard}
                title="Total methods"
                value={paymentMethods.length.toLocaleString("en-US")}
                description="Configured at checkout"
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle2}
                title="Active"
                value={activeCount.toLocaleString("en-US")}
                description="Offered to customers"
                bgColor="green"
              />
              <StatsCard
                icon={XCircle}
                title="Inactive"
                value={(paymentMethods.length - activeCount).toLocaleString(
                  "en-US"
                )}
                description="Hidden from checkout"
                bgColor="red"
              />
            </div>

            {/* Payment methods */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Payment methods</h3>
                  <p className="text-xs text-muted-foreground">
                    The code is what orders store against the payment.
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {visibleMethods.length.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {visibleMethods.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <CreditCard className="size-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      No methods match these filters
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try a different name, code or status.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop table — fixed layout with no pinned data
                      columns, so every column gets an equal share of the
                      panel; only the icon-only Actions column stays at w-14.
                      Uniform 6px inner gaps with the panel edges kept at
                      16px on the first and last cells; all columns stay
                      left-aligned so a value never crowds its gutter, and
                      dense cells clamp inside their equal share. */}
                  <div className="hidden md:block">
                    <Table className="report-table table-fixed [&_td]:px-1.5 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-1.5 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
                      <TableHeader className="[&_th]:font-semibold">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-14 text-right">
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleMethods.map((method) => (
                          <TableRow key={method.id}>
                            <TableCell className="py-2.5">
                              <p className="flex min-w-0 items-center">
                                <Link
                                  href={`/admin/settings/payment-method/${method.id}/edit`}
                                  className="truncate font-medium leading-tight hover:text-primaryColor hover:underline"
                                  title={method.name}
                                >
                                  {method.name}
                                </Link>
                              </p>
                            </TableCell>
                            <TableCell>
                              <PillBadge tone="blue" className="font-mono">
                                {method.code}
                              </PillBadge>
                            </TableCell>
                            <TableCell>
                              <p
                                className="line-clamp-2 text-sm text-muted-foreground"
                                title={method.description || undefined}
                              >
                                {method.description || "—"}
                              </p>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              <span className="line-clamp-2">
                                {formatDateTime(method.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <ActiveStatusToggle
                                isActive={method.isActive}
                                disabled={togglingId === method.id}
                                onToggle={() => toggleActive(method)}
                                label={method.name}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {renderActions(method)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="divide-y md:hidden">
                    {visibleMethods.map((method) => (
                      <article key={method.id} className="space-y-3 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/admin/settings/payment-method/${method.id}/edit`}
                            className="min-w-0 hover:text-primaryColor"
                          >
                            <p className="truncate text-sm font-semibold">
                              {method.name}
                            </p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                              {method.code}
                            </p>
                          </Link>
                          {renderActions(method)}
                        </div>

                        {method.description && (
                          <p className="line-clamp-3 text-xs leading-snug wrap-break-word text-muted-foreground">
                            {method.description}
                          </p>
                        )}

                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Created
                          </p>
                          <p className="text-sm">
                            {formatDateTime(method.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Status
                          </span>
                          <ActiveStatusToggle
                            isActive={method.isActive}
                            disabled={togglingId === method.id}
                            onToggle={() => toggleActive(method)}
                            label={method.name}
                          />
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Footer: what the list covers */}
                  <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                    <p className="text-xs text-muted-foreground">
                      Showing {visibleMethods.length.toLocaleString("en-US")}{" "}
                      of {paymentMethods.length.toLocaleString("en-US")} payment
                      method{paymentMethods.length === 1 ? "" : "s"}
                      {searchQuery && ` matching “${searchQuery}”`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        defaultToast={false}
      />
    </>
  );
}
