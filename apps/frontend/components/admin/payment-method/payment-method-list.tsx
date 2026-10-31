"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { PillBadge } from "@/components/common/pill-badge";
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
import { cn, formatDateTime } from "@/lib/utils";
import { deleteData, fetchData } from "@/utils/api-utils";
import type { PaymentMethod } from "@/utils/types";
import {
  CheckCircle2,
  CreditCard,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
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
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchPaymentMethods}
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
              placeholder="Search by name, code or description..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="md:w-35 md:shrink-0">
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) =>
                  setStatusFilter(value === "all" ? "" : value)
                }
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
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table className="report-table min-w-170">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-4">Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="w-full">Description</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="pr-4 text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleMethods.map((method) => (
                          <TableRow key={method.id}>
                            <TableCell className="py-2.5 pl-4">
                              <Link
                                href={`/admin/settings/payment-method/${method.id}/edit`}
                                className="font-medium leading-tight hover:text-primaryColor hover:underline"
                              >
                                {method.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <PillBadge tone="blue" className="font-mono">
                                {method.code}
                              </PillBadge>
                            </TableCell>
                            <TableCell className="w-full">
                              <p
                                className="line-clamp-2 text-sm text-muted-foreground"
                                title={method.description || undefined}
                              >
                                {method.description || "—"}
                              </p>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatDateTime(method.createdAt)}
                            </TableCell>
                            <TableCell>
                              <ActiveStatusToggle
                                isActive={method.isActive}
                                disabled={togglingId === method.id}
                                onToggle={() => toggleActive(method)}
                                label={method.name}
                              />
                            </TableCell>
                            <TableCell className="pr-4 text-right">
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
