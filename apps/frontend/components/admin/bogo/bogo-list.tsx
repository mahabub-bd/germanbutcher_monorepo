"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";
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
import { deleteData, fetchProtectedData } from "@/utils/api-utils";
import { BogoCampaign } from "@/utils/types";
import {
  CheckCircle2,
  Clock,
  Eye,
  Gift,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import {
  CAMPAIGN_STATUS_META,
  CAMPAIGN_STATUS_OPTIONS,
  campaignStatus,
  scopeLabel,
  usagePercent,
  type CampaignStatus,
} from "../marketing/campaign-status";

const dealLabel = (campaign: BogoCampaign) =>
  `Buy ${campaign.buyQuantity}, get ${campaign.getQuantity} free`;

/** "Up to 2 free groups per order" / "No per-order limit". */
const groupLimitLabel = (campaign: BogoCampaign) =>
  campaign.maxGroupsPerOrder > 0
    ? `Up to ${campaign.maxGroupsPerOrder} free group${
        campaign.maxGroupsPerOrder === 1 ? "" : "s"
      } per order`
    : "No per-order limit";

export function BogoList() {
  const MENU_URL = "/admin/marketing/bogo/bogo-list";
  const { can } = usePermissions();
  const [campaigns, setCampaigns] = useState<BogoCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<BogoCampaign | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "">("");

  const { togglingId, toggleActive } = useActiveStatusToggle<BogoCampaign>({
    getId: (campaign) => campaign.id,
    getName: (campaign) => campaign.name,
    buildEndpoint: (id) => `bogo-campaigns/${id}`,
    errorLabel: "deal status",
    setStatusLocally: (id, isActive) =>
      setCampaigns((prev) =>
        prev.map((campaign) =>
          campaign.id === id ? { ...campaign, isActive } : campaign
        )
      ),
  });

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchProtectedData("bogo-campaigns");
      setCampaigns(response as BogoCampaign[]);
    } catch (error) {
      console.error("Error fetching BOGO campaigns:", error);
      toast.error("Failed to load BOGO deals. Please try again.");
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDeleteClick = (campaign: BogoCampaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;

    try {
      await deleteData("bogo-campaigns", selectedCampaign.id);
      fetchCampaigns();
      toast.success("BOGO deal deleted successfully");
    } catch (error) {
      console.error("Error deleting BOGO campaign:", error);
      toast.error("Failed to delete BOGO deal. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const counts = useMemo(() => {
    const statuses = campaigns.map((campaign) => campaignStatus(campaign));
    return {
      active: campaigns.filter(
        (campaign, index) =>
          statuses[index] !== "expired" && campaign.isActive
      ).length,
      expiringSoon: statuses.filter((status) => status === "expiring").length,
      expired: statuses.filter((status) => status === "expired").length,
    };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      if (statusFilter && campaignStatus(campaign) !== statusFilter) return false;
      if (!query) return true;
      return campaign.name.toLowerCase().includes(query);
    });
  }, [campaigns, searchQuery, statusFilter]);

  const hasFilters = Boolean(searchQuery.trim() || statusFilter);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  const renderActions = (campaign: BogoCampaign) => (
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
            <Link href={`/admin/marketing/bogo/${campaign.id}/edit`}>
              <Pencil className="mr-2 size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(campaign)}
          >
            <Trash2 className="mr-2 size-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="BOGO Deals"
          description="Buy X, get Y free. The discount lands automatically at checkout while the deal is live."
        >
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/marketing/bogo-usage-logs">
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">Usage Logs</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchCampaigns}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" asChild>
              <Link href="/admin/marketing/bogo/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add BOGO Deal</span>
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
              placeholder="Search by deal name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2.5 md:flex md:items-center md:gap-3">
              <div className="md:w-40 md:shrink-0">
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) =>
                    setStatusFilter(
                      value === "all" ? "" : (value as CampaignStatus)
                    )
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasFilters && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  {[
                    searchQuery.trim() && `Search: ${searchQuery.trim()}`,
                    statusFilter &&
                      `Status: ${CAMPAIGN_STATUS_META[statusFilter].label}`,
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
            <LoadingIndicator message="Loading BOGO deals..." />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Gift className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No BOGO deals yet</p>
              <p className="text-xs text-muted-foreground">
                Get started by creating your first buy-one-get-one deal.
              </p>
            </div>
            {can(MENU_URL, "canCreate") && (
              <Button size="sm" asChild>
                <Link href="/admin/marketing/bogo/add">
                  <Plus className="size-4" /> Add BOGO Deal
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <StatsCard
                icon={Gift}
                title="Total deals"
                value={campaigns.length.toLocaleString("en-US")}
                description="Every deal on record"
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle2}
                title="Active"
                value={counts.active.toLocaleString("en-US")}
                description="Enabled and not expired"
                bgColor="green"
              />
              <StatsCard
                icon={Clock}
                title="Expiring soon"
                value={counts.expiringSoon.toLocaleString("en-US")}
                description="Ends within 7 days"
                bgColor="amber"
              />
              <StatsCard
                icon={XCircle}
                title="Expired"
                value={counts.expired.toLocaleString("en-US")}
                description="Already finished"
                bgColor="red"
              />
            </div>

            {/* Deals */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/15 dark:text-rose-400">
                    <Gift className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">All BOGO deals</h3>
                    <p className="text-[13px] text-foreground/70">
                      The cheapest units in every full group are free; the rest
                      stay paid.
                    </p>
                  </div>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {filteredCampaigns.length.toLocaleString("en-US")} of{" "}
                  {campaigns.length.toLocaleString("en-US")}
                </PillBadge>
              </div>

              {filteredCampaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Gift className="size-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">No deals found</p>
                    <p className="text-xs text-muted-foreground">
                      No deals match these filters. Try a different name or
                      status.
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
                    <Table className="report-table min-w-260">
                      <TableHeader className="[&_th]:font-semibold">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-72 pl-4">Campaign</TableHead>
                          <TableHead>Offer</TableHead>
                          <TableHead>Applies to</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Valid period</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Enabled</TableHead>
                          <TableHead className="pr-4 text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCampaigns.map((campaign) => {
                          const status = campaignStatus(campaign);
                          const percent = usagePercent(
                            campaign.timesUsed,
                            campaign.maxUsage
                          );

                          return (
                            <TableRow key={campaign.id}>
                              <TableCell className="py-2.5 pl-4">
                                <div className="flex items-center gap-2.5">
                                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/15 dark:text-rose-400">
                                    <Gift className="size-4" />
                                  </span>
                                  <p
                                    className="truncate text-sm font-medium leading-tight"
                                    title={campaign.name}
                                  >
                                    {campaign.name}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell>
                                <PillBadge tone="emerald" className="gap-1">
                                  <Gift className="size-3" />
                                  {dealLabel(campaign)}
                                </PillBadge>
                                <p className="mt-1 text-[13px] text-foreground/70">
                                  {groupLimitLabel(campaign)}
                                </p>
                              </TableCell>

                              <TableCell className="text-sm text-foreground/80">
                                {scopeLabel(
                                  campaign.products?.length ?? 0,
                                  campaign.categories?.length ?? 0
                                )}
                              </TableCell>

                              <TableCell>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-sm font-semibold tabular-nums">
                                    {campaign.timesUsed}
                                  </span>
                                  <span className="text-[13px] text-foreground/70">
                                    of{" "}
                                    {campaign.maxUsage > 0
                                      ? campaign.maxUsage.toLocaleString("en-US")
                                      : "unlimited"}
                                  </span>
                                </div>
                                {campaign.maxUsage > 0 && (
                                  <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={cn(
                                        "h-full rounded-full",
                                        percent >= 100
                                          ? "bg-red-500"
                                          : "bg-emerald-500"
                                      )}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                )}
                              </TableCell>

                              <TableCell>
                                <div className="space-y-0.5">
                                  <p className="flex items-baseline gap-1.5 text-sm tabular-nums">
                                    <span className="w-8 shrink-0 text-[13px] font-medium text-foreground/60">
                                      From
                                    </span>
                                    <span>
                                      {campaign.validFrom
                                        ? formatDateTime(campaign.validFrom)
                                        : "Any time"}
                                    </span>
                                  </p>
                                  <p className="flex items-baseline gap-1.5 text-sm tabular-nums">
                                    <span className="w-8 shrink-0 text-[13px] font-medium text-foreground/60">
                                      To
                                    </span>
                                    <span>
                                      {campaign.validUntil
                                        ? formatDateTime(campaign.validUntil)
                                        : "No end date"}
                                    </span>
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell>
                                <PillBadge
                                  tone={CAMPAIGN_STATUS_META[status].tone}
                                >
                                  {CAMPAIGN_STATUS_META[status].label}
                                </PillBadge>
                              </TableCell>

                              <TableCell>
                                <ActiveStatusToggle
                                  isActive={campaign.isActive}
                                  disabled={togglingId === campaign.id}
                                  onToggle={() => toggleActive(campaign)}
                                  label={campaign.name}
                                />
                              </TableCell>

                              <TableCell className="pr-4 text-right">
                                {renderActions(campaign)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="divide-y md:hidden">
                    {filteredCampaigns.map((campaign) => {
                      const status = campaignStatus(campaign);
                      return (
                        <article key={campaign.id} className="space-y-3 p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/15 dark:text-rose-400">
                                <Gift className="size-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {campaign.name}
                                </p>
                                <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                                  {dealLabel(campaign)}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <PillBadge
                                tone={CAMPAIGN_STATUS_META[status].tone}
                              >
                                {CAMPAIGN_STATUS_META[status].label}
                              </PillBadge>
                              {renderActions(campaign)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/40 p-2.5">
                            <div>
                              <p className="text-[13px] font-medium text-foreground/60">
                                Times used
                              </p>
                              <p className="text-sm font-semibold tabular-nums">
                                {campaign.timesUsed} of{" "}
                                {campaign.maxUsage > 0
                                  ? campaign.maxUsage.toLocaleString("en-US")
                                  : "unlimited"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-foreground/60">
                                Applies to
                              </p>
                              <p className="text-sm">
                                {scopeLabel(
                                  campaign.products?.length ?? 0,
                                  campaign.categories?.length ?? 0
                                )}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[13px] font-medium text-foreground/60">
                                Max per order
                              </p>
                              <p className="text-sm">
                                {groupLimitLabel(campaign)}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[13px] font-medium text-foreground/60">
                                Valid period
                              </p>
                              <p className="text-sm tabular-nums">
                                {campaign.validFrom
                                  ? formatDateTime(campaign.validFrom)
                                  : "Any time"}{" "}
                                <span className="text-foreground/60">to</span>{" "}
                                {campaign.validUntil
                                  ? formatDateTime(campaign.validUntil)
                                  : "No end date"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-medium text-foreground/60">
                              Enabled
                            </span>
                            <ActiveStatusToggle
                              isActive={campaign.isActive}
                              disabled={togglingId === campaign.id}
                              onToggle={() => toggleActive(campaign)}
                              label={campaign.name}
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="border-t px-4 py-3">
                    <p className="text-[13px] text-foreground/70">
                      Showing{" "}
                      {filteredCampaigns.length.toLocaleString("en-US")} of{" "}
                      {campaigns.length.toLocaleString("en-US")} deal
                      {campaigns.length === 1 ? "" : "s"}
                      {hasFilters && " matching the current filters"}
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
