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
import type { SalesPartner } from "@/utils/types";
import {
  CheckCircle2,
  ExternalLink,
  Globe,
  Handshake,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

/** "04 Jul 2025, 04:11 PM" → date and time on separate lines. */
function splitDateTime(value?: string) {
  const formatted = formatDateTime(value ?? "");
  const splitAt = formatted.lastIndexOf(", ");
  if (splitAt === -1) return { date: formatted, time: "—" };
  return {
    date: formatted.slice(0, splitAt),
    time: formatted.slice(splitAt + 2),
  };
}

export function SalesPartnerList() {
  const MENU_URL = "/admin/sales-partner/sales-partner-list";
  const { can } = usePermissions();
  const [salesPartners, setSalesPartners] = useState<SalesPartner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSalesPartner, setSelectedSalesPartner] =
    useState<SalesPartner | null>(null);

  const { togglingId, toggleActive } = useActiveStatusToggle<SalesPartner>({
    getId: (salesPartner) => salesPartner.Id,
    getName: (salesPartner) => salesPartner.name,
    // Dedicated endpoint flips the flag server-side and returns the
    // updated entity.
    buildEndpoint: (id) => `sales-partners/${id}/toggle-status`,
    includeBody: false,
    setStatusLocally: (id, isActive) =>
      setSalesPartners((prev) =>
        prev.map((sp) => (sp.Id === id ? { ...sp, isActive } : sp))
      ),
    errorLabel: "sales partner status",
  });

  const fetchSalesPartners = async () => {
    setIsLoading(true);
    try {
      const response = await fetchData("sales-partners");
      setSalesPartners(response as SalesPartner[]);
    } catch (error) {
      console.error("Error fetching sales partners:", error);
      toast.error("Failed to load sales partners. Please try again.");
      setSalesPartners([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesPartners();
  }, []);

  const handleDeleteClick = (salesPartner: SalesPartner) => {
    setSelectedSalesPartner(salesPartner);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSalesPartner) return;

    try {
      await deleteData("sales-partners", selectedSalesPartner.Id);
      fetchSalesPartners();
      toast.success("Sales Partner deleted successfully");
    } catch (error) {
      console.error("Error deleting sales partner:", error);
      toast.error("Failed to delete sales partner. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => setSearchQuery("");

  // The endpoint returns the full list (no pagination), so filtering and
  // counting happen over the loaded rows.
  const query = searchQuery.trim().toLowerCase();
  const visiblePartners = query
    ? salesPartners.filter(
        (partner) =>
          partner.name?.toLowerCase().includes(query) ||
          partner.description?.toLowerCase().includes(query) ||
          partner.website?.toLowerCase().includes(query)
      )
    : salesPartners;

  const activeCount = salesPartners.filter((p) => p.isActive).length;
  const withWebsiteCount = salesPartners.filter((p) => p.website).length;

  const renderActions = (salesPartner: SalesPartner) => (
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
            <Link href={`/admin/sales-partner/${salesPartner.Id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(salesPartner)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderLogo = (partner: SalesPartner, className?: string) => (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted p-1",
        className
      )}
    >
      <Image
        src={partner?.Image?.url || "/placeholder.svg"}
        alt={partner.name}
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
          title="Sales Partners"
          description="Partner brands displayed on the website, with their description and link."
        >
          {can(MENU_URL, "canCreate") && (
            <Button asChild size="sm">
              <Link href="/admin/sales-partner/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Sales Partner</span>
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchSalesPartners}
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
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
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
            <LoadingIndicator message="Loading sales partners..." />
          </div>
        ) : salesPartners.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Handshake className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No sales partners found</p>
              <p className="text-xs text-muted-foreground">
                Get started by adding your first sales partner.
              </p>
            </div>
            {can(MENU_URL, "canCreate") && (
              <Button size="sm" asChild>
                <Link href="/admin/sales-partner/add">
                  <Plus className="size-4" /> Add Sales Partner
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <StatsCard
                icon={Handshake}
                title="Total partners"
                value={salesPartners.length.toLocaleString("en-US")}
                description="All registered"
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle2}
                title="Active"
                value={activeCount.toLocaleString("en-US")}
                description="Shown on the website"
                bgColor="green"
              />
              <StatsCard
                icon={XCircle}
                title="Inactive"
                value={(salesPartners.length - activeCount).toLocaleString(
                  "en-US"
                )}
                description="Hidden from the website"
                bgColor="red"
              />
              <StatsCard
                icon={Globe}
                title="With website"
                value={withWebsiteCount.toLocaleString("en-US")}
                description="Have a link"
                bgColor="purple"
              />
            </div>

            {/* Sales partners */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Sales partners</h3>
                  <p className="text-xs text-muted-foreground">
                    Display order · newest logos at the end
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {visiblePartners.length.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {visiblePartners.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Handshake className="size-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      No partners match your search
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try a different name, description or website.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearSearch}>
                    Clear search
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table className="report-table table-fixed">
                      <TableHeader className="[&_th]:font-semibold">
                        <TableRow className="hover:bg-transparent">
                          {/* Logo lives inside the name cell so the partner has a
                              single identity column, and Description / Website /
                              Order / Created / Status are left unsized so they
                              split what's left equally. Website only joins at xl
                              and Order / Created only at lg; below lg Status
                              keeps a floor so the toggle never wraps. */}
                          <TableHead className="pl-4 lg:w-72 2xl:w-80">
                            Sales partner
                          </TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="hidden xl:table-cell">
                            Website
                          </TableHead>
                          <TableHead className="hidden lg:table-cell">
                            Order
                          </TableHead>
                          <TableHead className="hidden lg:table-cell">
                            Created
                          </TableHead>
                          <TableHead className="w-28 lg:w-auto">
                            Status
                          </TableHead>
                          <TableHead className="w-14 pr-4 text-right">
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visiblePartners.map((salesPartner) => {
                          const createdAt = splitDateTime(salesPartner.createdAt);
                          return (
                            <TableRow key={salesPartner.Id}>
                              <TableCell className="py-2.5 pl-4">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  {renderLogo(salesPartner, "size-11")}
                                  <Link
                                    href={`/admin/sales-partner/${salesPartner.Id}/edit`}
                                    className="block truncate font-medium leading-tight hover:text-primaryColor hover:underline"
                                    title={salesPartner.name}
                                  >
                                    {salesPartner.name}
                                  </Link>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p
                                  className="line-clamp-2 text-muted-foreground"
                                  title={salesPartner.description || undefined}
                                >
                                  {salesPartner.description || "—"}
                                </p>
                              </TableCell>
                              <TableCell className="hidden xl:table-cell">
                                {salesPartner.website ? (
                                  <Link
                                    href={salesPartner.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                                  >
                                    <ExternalLink className="size-3" />
                                    Visit
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="hidden tabular-nums text-muted-foreground lg:table-cell">
                                {salesPartner.order}
                              </TableCell>
                              <TableCell className="hidden text-muted-foreground lg:table-cell">
                                <p className="truncate">{createdAt.date}</p>
                                <p className="truncate text-[13px] text-foreground/60">
                                  {createdAt.time}
                                </p>
                              </TableCell>
                              <TableCell>
                                <ActiveStatusToggle
                                  isActive={salesPartner.isActive}
                                  disabled={togglingId === salesPartner.Id}
                                  onToggle={() => toggleActive(salesPartner)}
                                  label={salesPartner.name}
                                />
                              </TableCell>
                              <TableCell className="pr-4 text-right">
                                {renderActions(salesPartner)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="divide-y md:hidden">
                    {visiblePartners.map((salesPartner) => (
                      <article key={salesPartner.Id} className="space-y-3 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/admin/sales-partner/${salesPartner.Id}/edit`}
                            className="flex min-w-0 items-center gap-2.5 hover:text-primaryColor"
                          >
                            {renderLogo(salesPartner, "aspect-3/2 h-10 w-15")}
                            <p className="truncate text-sm font-semibold">
                              {salesPartner.name}
                            </p>
                          </Link>
                          {renderActions(salesPartner)}
                        </div>

                        {salesPartner.description && (
                          <p className="line-clamp-3 text-xs leading-snug wrap-break-word text-muted-foreground">
                            {salesPartner.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Order
                            </p>
                            <p className="text-sm font-semibold tabular-nums">
                              {salesPartner.order}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Website
                            </p>
                            {salesPartner.website ? (
                              <Link
                                href={salesPartner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                              >
                                Visit
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <p className="text-sm text-muted-foreground">—</p>
                            )}
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Created
                            </p>
                            <p className="text-sm">
                              {formatDateTime(salesPartner.createdAt ?? "")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Status
                          </span>
                          <ActiveStatusToggle
                            isActive={salesPartner.isActive}
                            disabled={togglingId === salesPartner.Id}
                            onToggle={() => toggleActive(salesPartner)}
                            label={salesPartner.name}
                          />
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Footer: what the list covers */}
                  <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                    <p className="text-xs text-muted-foreground">
                      Showing {visiblePartners.length.toLocaleString("en-US")}{" "}
                      of {salesPartners.length.toLocaleString("en-US")} sales
                      partner
                      {salesPartners.length === 1 ? "" : "s"}
                      {query && ` matching “${searchQuery}”`}
                    </p>
                  </div>
                </>
              )}
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
