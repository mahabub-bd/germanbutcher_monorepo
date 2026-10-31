"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { PaginationComponent } from "@/components/common/pagination";
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
import { cn } from "@/lib/utils";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { Supplier } from "@/utils/types";
import {
  Ban,
  CheckCircle,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../../delete-confirmation-dialog";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";

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

interface SupplierListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function SupplierList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: SupplierListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/procurement/suppliers";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  // Applied 400ms after typing stops — the input stays instant, the API call
  // doesn't fire per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("isActive") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
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
      params.set("isActive", statusFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, debouncedSearch, statusFilter]);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all")
        params.append("isActive", statusFilter);

      const response = await fetchDataPagination<{
        data: Supplier[];
        total: number;
        totalPages: number;
      }>(`suppliers?${params.toString()}`);
      setSuppliers(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers. Please try again.");
      setSuppliers([]);
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
    fetchSuppliers();
  }, [currentPage, limit, debouncedSearch, statusFilter]);

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

  const handleDeleteClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;

    try {
      await deleteData("suppliers", selectedSupplier.id);
      fetchSuppliers();
      toast.success("Supplier deleted successfully");
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error("Failed to delete supplier. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const { togglingId, toggleActive } = useActiveStatusToggle<Supplier>({
    getId: (supplier) => supplier.id,
    getName: (supplier) => supplier.name,
    buildEndpoint: (id) => `suppliers/${id}`,
    setStatusLocally: (id, isActive) =>
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive } : s))
      ),
    errorLabel: "supplier status",
  });

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasActiveFilters = () =>
    Boolean(
      searchQuery.trim() || (statusFilter && statusFilter !== "all")
    );

  const activeCount = suppliers.filter((s) => s.isActive).length;
  const inactiveCount = suppliers.length - activeCount;

  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (supplier: Supplier) => (
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
            <Link href={`/admin/procurement/suppliers/${supplier.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => handleDeleteClick(supplier)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderToggle = (supplier: Supplier, className?: string) => (
    <ActiveStatusToggle
      isActive={supplier.isActive}
      disabled={togglingId === supplier.id}
      onToggle={() => toggleActive(supplier)}
      label={supplier.name}
      className={className}
    />
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Suppliers"
          description="Who you buy stock from, how to reach them and whether they are active."
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchSuppliers}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" asChild>
              <Link href="/admin/procurement/suppliers/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Supplier</span>
              </Link>
            </Button>
          )}
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-nowrap md:items-center md:gap-3">
            <TableSearch
              wrapperClassName="w-full md:max-w-xs"
              className="h-9"
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="md:w-40 md:shrink-0">
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
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters() && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  {[
                    searchQuery.trim() && `Search: ${searchQuery.trim()}`,
                    statusFilter &&
                      statusFilter !== "all" &&
                      `Status: ${statusFilter === "true" ? "Active" : "Inactive"}`,
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
            <LoadingIndicator message="Loading suppliers..." />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Truck className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No suppliers found</p>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters()
                  ? "No supplier matches these filters. Try another name, email or status."
                  : "Add your first supplier to start recording purchases."}
              </p>
            </div>
            {hasActiveFilters() ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : can(MENU_URL, "canCreate") ? (
              <Button size="sm" asChild>
                <Link href="/admin/procurement/suppliers/add">
                  <Plus className="size-4" /> Add supplier
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Page totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatsCard
                icon={Truck}
                title="Total suppliers"
                value={totalItems.toLocaleString("en-US")}
                description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle}
                title="Active"
                value={activeCount.toLocaleString("en-US")}
                description="Available for new purchases"
                bgColor="green"
              />
              <StatsCard
                icon={Ban}
                title="Inactive"
                value={inactiveCount.toLocaleString("en-US")}
                description="Hidden from new purchases"
                bgColor="orange"
              />
            </div>

            {/* Suppliers */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/15 dark:text-teal-400">
                    <Truck className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">All suppliers</h3>
                    <p className="text-[13px] text-foreground/70">
                      Contact details and the products each supplier provides.
                    </p>
                  </div>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {totalItems.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table min-w-190">
                  <TableHeader className="[&_th]:font-semibold">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-72 pl-4">Supplier</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => {
                      const productCount = supplier.products?.length || 0;

                      return (
                        <TableRow key={supplier.id}>
                          <TableCell className="py-2.5 pl-4">
                            <div className="flex items-center gap-2.5">
                              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                <Image
                                  src={
                                    supplier.attachment?.url ||
                                    "/placeholder.svg"
                                  }
                                  alt={supplier.name}
                                  width={36}
                                  height={36}
                                  className="size-full object-contain p-0.5"
                                />
                              </span>
                              <div className="min-w-0">
                                <p
                                  className="truncate text-sm font-medium leading-tight"
                                  title={supplier.name}
                                >
                                  {supplier.name}
                                </p>
                                <p className="mt-0.5 text-[13px] text-foreground/70">
                                  {productCount} product
                                  {productCount === 1 ? "" : "s"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <a
                                href={
                                  supplier.email
                                    ? `mailto:${supplier.email}`
                                    : undefined
                                }
                                className="flex items-center gap-1.5 text-[13px] text-foreground/80 hover:underline"
                              >
                                <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">
                                  {supplier.email || "No email"}
                                </span>
                              </a>
                              <a
                                href={
                                  supplier.phone
                                    ? `tel:${supplier.phone}`
                                    : undefined
                                }
                                className="flex items-center gap-1.5 text-[13px] tabular-nums text-foreground/70 hover:underline"
                              >
                                <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">
                                  {supplier.phone || "No phone"}
                                </span>
                              </a>
                            </div>
                          </TableCell>

                          <TableCell className="max-w-xs">
                            <p
                              className="line-clamp-2 text-[13px] text-foreground/70"
                              title={supplier.address || undefined}
                            >
                              {supplier.address || "No address"}
                            </p>
                          </TableCell>

                          <TableCell>
                            {renderToggle(supplier, "justify-start")}
                          </TableCell>

                          <TableCell className="pr-4 text-right">
                            {renderActions(supplier)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {suppliers.map((supplier) => {
                  const productCount = supplier.products?.length || 0;

                  return (
                    <article key={supplier.id} className="space-y-3 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                            <Image
                              src={
                                supplier.attachment?.url || "/placeholder.svg"
                              }
                              alt={supplier.name}
                              width={40}
                              height={40}
                              className="size-full object-contain p-0.5"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {supplier.name}
                            </p>
                            <p className="mt-0.5 text-[13px] text-foreground/70">
                              {productCount} product
                              {productCount === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        {renderActions(supplier)}
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/40 p-2.5">
                        <DetailField label="Email">
                          <p className="truncate text-sm">
                            {supplier.email || "—"}
                          </p>
                        </DetailField>
                        <DetailField label="Phone">
                          <p className="truncate text-sm tabular-nums">
                            {supplier.phone || "—"}
                          </p>
                        </DetailField>
                        <div className="col-span-2">
                          <DetailField label="Address">
                            <p className="text-[13px] text-foreground/80">
                              {supplier.address || "No address"}
                            </p>
                          </DetailField>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-foreground/60">
                          Status
                        </span>
                        {renderToggle(supplier)}
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
                  {totalItems.toLocaleString("en-US")} supplier
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
