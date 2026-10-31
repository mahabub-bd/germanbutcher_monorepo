"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { PillBadge } from "@/components/common/pill-badge";
import { PaginationComponent } from "@/components/common/pagination";
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
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { Client, PaginatedResponse } from "@/utils/types";
import {
  Building2,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
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

interface ClientListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

/** "09 Nov 2025, 01:03 AM" → date and time on separate lines. */
function splitDateTime(value?: string) {
  const formatted = formatDateTime(value ?? "");
  const splitAt = formatted.lastIndexOf(", ");
  if (splitAt === -1) return { date: formatted, time: "—" };
  return {
    date: formatted.slice(0, splitAt),
    time: formatted.slice(splitAt + 2),
  };
}

export function ClientList({
  initialPage = 1,
  initialLimit = 10,
  initialSearchParams = {},
}: ClientListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/client/client-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());
    if (searchQuery) params.set("search", searchQuery);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery]);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetchDataPagination<PaginatedResponse<Client>>(
        `clients?${params.toString()}`
      );

      setClients(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients. Please try again.");
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Update URL when state changes
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const { togglingId, toggleActive } = useActiveStatusToggle<Client>({
    getId: (client) => client.Id,
    getName: (client) => client.name,
    buildEndpoint: (id) => `clients/${id}`,
    setStatusLocally: (id, isActive) =>
      setClients((prev) =>
        prev.map((c) => (c.Id === id ? { ...c, isActive } : c))
      ),
    errorLabel: "client status",
  });

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedClient) return;

    try {
      await deleteData("clients", selectedClient.Id);
      fetchClients();
      toast.success("Client deleted successfully");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const activeCount = clients.filter((client) => client.isActive).length;
  const inactiveCount = clients.length - activeCount;
  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (client: Client) => (
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
            <Link href={`/admin/client/${client.Id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(client)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderLogo = (client: Client, className?: string) => (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted p-1",
        className
      )}
    >
      <Image
        src={client?.Image?.url || "/placeholder.svg"}
        alt={client.name}
        width={96}
        height={64}
        className="h-full w-full object-contain"
      />
    </span>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Clients"
          description="Client logos shown across the website, in their display order."
        >
          {can(MENU_URL, "canCreate") && (
            <Button asChild size="sm">
              <Link href="/admin/client/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Client</span>
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchClients}
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
              placeholder="Search clients by name..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="md:w-35 md:shrink-0">
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {searchQuery && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  Search: {searchQuery}
                </PillBadge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={clearSearch}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingIndicator message="Loading clients..." />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Building2 className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No clients found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? "No clients match your search. Try a different name."
                  : "Get started by adding your first client."}
              </p>
            </div>
            {searchQuery ? (
              <Button variant="outline" size="sm" onClick={clearSearch}>
                Clear search
              </Button>
            ) : (
              can(MENU_URL, "canCreate") && (
                <Button size="sm" asChild>
                  <Link href="/admin/client/add">
                    <Plus className="size-4" /> Add Client
                  </Link>
                </Button>
              )
            )}
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <StatsCard
                icon={Building2}
                title="Total clients"
                value={totalItems.toLocaleString("en-US")}
                description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle2}
                title="Active"
                value={activeCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="green"
              />
              <StatsCard
                icon={XCircle}
                title="Inactive"
                value={inactiveCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="red"
              />
              <StatsCard
                icon={Building2}
                title="Showing"
                value={clients.length.toLocaleString("en-US")}
                description={`Of ${totalItems.toLocaleString("en-US")} clients`}
                bgColor="purple"
              />
            </div>

            {/* Clients */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Clients</h3>
                  <p className="text-xs text-muted-foreground">
                    Display order · {limit} per page
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {totalItems.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table table-fixed">
                  <TableHeader className="[&_th]:font-semibold">
                    <TableRow className="hover:bg-transparent">
                      {/* Logo and Actions are pinned, Name is pinned from lg and
                          Order / Created / Status stay unsized so they split
                          whatever is left equally. Below lg the two narrow
                          columns hide so the name keeps its room. */}
                      <TableHead className="w-24 pl-4">Logo</TableHead>
                      <TableHead className="lg:w-72 2xl:w-80">Name</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Order
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Created
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-14 pr-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => {
                      const createdAt = splitDateTime(client.createdAt);
                      return (
                        <TableRow key={client.Id}>
                          <TableCell className="py-2.5 pl-4">
                            {renderLogo(client, "h-11 w-16")}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/client/${client.Id}/edit`}
                              className="block truncate font-medium leading-tight hover:text-primaryColor hover:underline"
                              title={client.name}
                            >
                              {client.name}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">
                            {client.order}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground lg:table-cell">
                            <p className="truncate">{createdAt.date}</p>
                            <p className="truncate text-[13px] text-foreground/60">
                              {createdAt.time}
                            </p>
                          </TableCell>
                          <TableCell>
                            <ActiveStatusToggle
                              isActive={client.isActive}
                              disabled={togglingId === client.Id}
                              onToggle={() => toggleActive(client)}
                              label={client.name}
                            />
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            {renderActions(client)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {clients.map((client) => (
                  <article key={client.Id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/client/${client.Id}/edit`}
                        className="flex min-w-0 items-center gap-2.5 hover:text-primaryColor"
                      >
                        {renderLogo(client, "aspect-3/2 h-10 w-15")}
                        <p className="truncate text-sm font-semibold">
                          {client.name}
                        </p>
                      </Link>
                      {renderActions(client)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Order
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {client.order}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Created
                        </p>
                        <p className="text-sm">
                          {formatDateTime(client.createdAt ?? "")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Status
                      </span>
                      <ActiveStatusToggle
                        isActive={client.isActive}
                        disabled={togglingId === client.Id}
                        onToggle={() => toggleActive(client)}
                        label={client.name}
                      />
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer: what the list covers */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-xs text-muted-foreground">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} client
                  {totalItems === 1 ? "" : "s"}
                  {searchQuery && ` matching “${searchQuery}”`}
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
