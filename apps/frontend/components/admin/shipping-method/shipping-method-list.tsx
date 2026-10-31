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
import type { ShippingMethod } from "@/utils/types";
import {
  CheckCircle2,
  Gift,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

/** Shipping cost keeps its decimals when present (60.5 is not 60). */
const money = (value: number | string) =>
  Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export function ShippingMethodList() {
  const MENU_URL = "/admin/settings/shipping-method";
  const { can } = usePermissions();
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] =
    useState<ShippingMethod | null>(null);

  const { togglingId, toggleActive } = useActiveStatusToggle<ShippingMethod>({
    getId: (method) => method.id,
    getName: (method) => method.name,
    buildEndpoint: (id) => `shipping-methods/${id}`,
    errorLabel: "shipping method status",
    setStatusLocally: (id, isActive) =>
      setShippingMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isActive } : m))
      ),
  });

  const fetchShippingMethods = async () => {
    setIsLoading(true);
    try {
      const response = await fetchData("shipping-methods");
      setShippingMethods(response as ShippingMethod[]);
    } catch (error) {
      console.error("Error fetching shipping methods:", error);
      toast.error("Failed to load shipping methods. Please try again.");
      setShippingMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const handleDeleteClick = (shippingMethod: ShippingMethod) => {
    setSelectedShippingMethod(shippingMethod);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedShippingMethod) return;

    try {
      await deleteData("shipping-methods", selectedShippingMethod.id);
      fetchShippingMethods();
      toast.success("Shipping method deleted successfully");
    } catch (error) {
      console.error("Error deleting shipping method:", error);
      toast.error("Failed to delete shipping method. Please try again.");
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
  const visibleMethods = shippingMethods.filter((method) => {
    if (statusFilter === "active" && !method.isActive) return false;
    if (statusFilter === "inactive" && method.isActive) return false;
    if (!query) return true;
    return (
      method.name?.toLowerCase().includes(query) ||
      method.description?.toLowerCase().includes(query) ||
      method.deliveryTime?.toLowerCase().includes(query)
    );
  });

  const activeCount = shippingMethods.filter((m) => m.isActive).length;
  const freeCount = shippingMethods.filter((m) => Number(m.cost) === 0).length;
  const hasFilters = Boolean(
    searchQuery || (statusFilter && statusFilter !== "all")
  );

  const flagsOf = (method: ShippingMethod) =>
    [
      method.isPickup && { label: "Pickup", tone: "violet" as const },
      method.requiresOnlinePayment && {
        label: "Online pay",
        tone: "sky" as const,
      },
      method.isExcludedFromFreeDelivery && {
        label: "No free delivery",
        tone: "amber" as const,
      },
    ].filter(Boolean) as {
      label: string;
      tone: "violet" | "sky" | "amber";
    }[];

  const renderFlags = (method: ShippingMethod) => {
    const flags = flagsOf(method);

    if (flags.length === 0) {
      return <span className="text-muted-foreground">—</span>;
    }

    return (
      <div className="flex flex-wrap items-center gap-1">
        {flags.map((flag) => (
          <PillBadge key={flag.label} tone={flag.tone}>
            {flag.label}
          </PillBadge>
        ))}
      </div>
    );
  };

  const renderActions = (method: ShippingMethod) => (
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
            <Link href={`/admin/settings/shipping-method/${method.id}/edit`}>
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
          title="Shipping Methods"
          description="Delivery options, their cost and the flags that control checkout behaviour."
        >
          {can(MENU_URL, "canCreate") && (
            <Button asChild size="sm">
              <Link href="/admin/settings/shipping-method/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Shipping Method</span>
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchShippingMethods}
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
              placeholder="Search by name, time or description..."
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
                      (statusFilter === "active" ? "Status: Active" : "Status: Inactive"),
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
            <LoadingIndicator message="Loading shipping methods..." />
          </div>
        ) : shippingMethods.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Truck className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No shipping methods found</p>
              <p className="text-xs text-muted-foreground">
                Get started by creating your first shipping method.
              </p>
            </div>
            {can(MENU_URL, "canCreate") && (
              <Button size="sm" asChild>
                <Link href="/admin/settings/shipping-method/add">
                  <Plus className="size-4" /> Add Shipping Method
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <StatsCard
                icon={Truck}
                title="Total methods"
                value={shippingMethods.length.toLocaleString("en-US")}
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
                value={(shippingMethods.length - activeCount).toLocaleString(
                  "en-US"
                )}
                description="Hidden from checkout"
                bgColor="red"
              />
              <StatsCard
                icon={Gift}
                title="Free methods"
                value={freeCount.toLocaleString("en-US")}
                description="Cost is ৳0"
                bgColor="purple"
              />
            </div>

            {/* Shipping methods */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Shipping methods</h3>
                  <p className="text-xs text-muted-foreground">
                    Sorted by display order · amounts in ৳
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {visibleMethods.length.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {visibleMethods.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Truck className="size-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      No methods match these filters
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try a different name or status.
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
                    <Table className="report-table min-w-230">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-4">Name</TableHead>
                          <TableHead className="text-right">Cost (৳)</TableHead>
                          <TableHead>Delivery time</TableHead>
                          <TableHead className="w-full">Description</TableHead>
                          <TableHead>Flags</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Order</TableHead>
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
                                href={`/admin/settings/shipping-method/${method.id}/edit`}
                                className="font-medium leading-tight hover:text-primaryColor hover:underline"
                              >
                                {method.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {money(method.cost)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {method.deliveryTime || "—"}
                            </TableCell>
                            <TableCell className="w-full">
                              <p
                                className="line-clamp-2 text-sm text-muted-foreground"
                                title={method.description || undefined}
                              >
                                {method.description || "—"}
                              </p>
                            </TableCell>
                            <TableCell>{renderFlags(method)}</TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatDateTime(method.createdAt)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {method.displayOrder}
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
                            href={`/admin/settings/shipping-method/${method.id}/edit`}
                            className="min-w-0 hover:text-primaryColor"
                          >
                            <p className="truncate text-sm font-semibold">
                              {method.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {method.deliveryTime || "No delivery time set"}
                            </p>
                          </Link>
                          {renderActions(method)}
                        </div>

                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Cost
                            </p>
                            <p className="text-sm font-semibold tabular-nums">
                              ৳{money(method.cost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Order
                            </p>
                            <p className="text-sm font-semibold tabular-nums">
                              {method.displayOrder}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Created
                            </p>
                            <p className="text-sm">
                              {formatDateTime(method.createdAt)}
                            </p>
                          </div>
                        </div>

                        {flagsOf(method).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            {renderFlags(method)}
                          </div>
                        )}

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
                      of {shippingMethods.length.toLocaleString("en-US")}{" "}
                      shipping method
                      {shippingMethods.length === 1 ? "" : "s"}
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
