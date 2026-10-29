"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
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
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";

import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import { Supplier } from "@/utils/types";
import {
  Ban,
  Boxes,
  CheckCircle,
  Filter,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../../delete-confirmation-dialog";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";

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

  const hasActiveFilters = () => Boolean(searchQuery || statusFilter);

  const renderEmptyState = () => (
    <div className="p-4 pb-6">
      <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 text-center">
        <Truck className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No suppliers found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          {hasActiveFilters()
            ? "No suppliers match your search criteria. Try different filters."
            : "Get started by adding your first supplier."}
        </p>
        {!hasActiveFilters() && can(MENU_URL, "canCreate") && (
          <Button asChild className="mt-4">
            <Link href="/admin/procurement/suppliers/add">
              <Plus className="mr-2 h-4 w-4" /> Add Supplier
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
            Status: {statusFilter === "true" ? "Active" : "Inactive"}
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

  const renderFiltersMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-3 shrink-0">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {statusFilter && statusFilter !== "all" && (
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
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {statusFilter && statusFilter !== "all" && (
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
      <Table className="min-w-160">
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-center">
              Products
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex  h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    <Image
                      src={supplier?.attachment?.url || "/placeholder.svg"}
                      alt={supplier.name}
                      width={96}
                      height={96}
                      className="object-contain p-1"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">{supplier.name}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center text-sm">
                    <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground/70" />
                    {supplier.email}
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground/70" />
                    {supplier.phone}
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <span className="line-clamp-2 text-sm text-muted-foreground">
                  {supplier.address || "No address provided"}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted">
                  <Boxes className="h-3 w-3" />
                  {supplier.products?.length || 0}
                </span>
              </TableCell>
              <TableCell>
                <ActiveStatusToggle
                  isActive={supplier.isActive}
                  disabled={togglingId === supplier.id}
                  onToggle={() => toggleActive(supplier)}
                  label={supplier.name}
                />
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
                        <Link href={`/admin/procurement/suppliers/${supplier.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {can(MENU_URL, "canDelete") && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(supplier)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    )}
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
      <div className="w-full space-y-4">
        <PageHeader
          title="Suppliers"
          description="Manage your product suppliers"
          {...(can(MENU_URL, "canCreate")
            ? {
              actionLabel: "Add Supplier",
              actionHref: "/admin/procurement/suppliers/add",
            }
            : {})}
        />

        {/* Summary tiles */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
          <StatsCard
            icon={Truck}
            title="Total Suppliers"
            value={totalItems}
            bgColor="blue"
          />
          <StatsCard
            icon={CheckCircle}
            title="Active"
            value={suppliers.filter((s) => s.isActive).length}
            bgColor="green"
          />
          <StatsCard
            icon={Ban}
            title="Inactive"
            value={suppliers.filter((s) => !s.isActive).length}
            bgColor="orange"
          />
        </div>

        {/* List card: toolbar + table */}
        <div className="rounded-sm border bg-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Truck className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">All Suppliers</h3>
                <p className="text-sm text-muted-foreground">
                  {totalItems} supplier{totalItems === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-2 w-full lg:w-auto">
              <TableSearch
                wrapperClassName="w-full sm:w-64 min-w-0"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {renderFiltersMenu()}
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Suppliers..." />
          ) : suppliers.length === 0 ? (
            renderEmptyState()
          ) : (
            renderTableView()
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${suppliers.length} of ${totalItems} suppliers`}
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
