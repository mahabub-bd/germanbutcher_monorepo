"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
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
import { cn, formatDateTime } from "@/lib/utils";
import { deleteData, fetchProtectedData } from "@/utils/api-utils";
import { BogoCampaign } from "@/utils/types";
import {
  AlertTriangle,
  Calendar,
  CalendarCheck2,
  CheckCircle,
  Clock,
  Eye,
  Gift,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export function BogoList() {
  const MENU_URL = "/admin/marketing/bogo/bogo-list";
  const { can } = usePermissions();
  const [campaigns, setCampaigns] = useState<BogoCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] =
    useState<BogoCampaign | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCampaigns = async () => {
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
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

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

  // null validUntil = runs forever
  const isCampaignExpired = (campaign: BogoCampaign): boolean => {
    if (!campaign.validUntil) return false;
    return new Date(campaign.validUntil) < new Date();
  };

  const isCampaignExpiringSoon = (campaign: BogoCampaign): boolean => {
    if (!campaign.validUntil) return false;
    const validUntil = new Date(campaign.validUntil);
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return validUntil > now && validUntil <= sevenDaysFromNow;
  };

  const getCampaignStatus = (campaign: BogoCampaign) => {
    if (isCampaignExpired(campaign)) {
      return {
        variant: "destructive" as const,
        label: "Expired",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      };
    }

    if (isCampaignExpiringSoon(campaign)) {
      return {
        variant: "secondary" as const,
        label: "Expiring Soon",
        icon: <Clock className="h-3 w-3 mr-1" />,
      };
    }

    if (!campaign.isActive) {
      return {
        variant: "secondary" as const,
        label: "Inactive",
        icon: null,
      };
    }

    return {
      variant: "default" as const,
      label: "Active",
      icon: null,
    };
  };

  const activeCount = campaigns.filter(
    (c) => !isCampaignExpired(c) && c.isActive
  ).length;
  const expiringSoonCount = campaigns.filter(isCampaignExpiringSoon).length;
  const expiredCount = campaigns.filter(isCampaignExpired).length;

  const filteredCampaigns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return campaigns;
    return campaigns.filter((campaign) =>
      campaign.name.toLowerCase().includes(query)
    );
  }, [campaigns, searchQuery]);

  const summaryTiles = [
    {
      title: "Total Deals",
      value: campaigns.length,
      icon: Gift,
      bgColor: "blue" as const,
    },
    {
      title: "Active",
      value: activeCount,
      icon: CheckCircle,
      bgColor: "green" as const,
    },
    {
      title: "Expiring Soon",
      value: expiringSoonCount,
      icon: Clock,
      bgColor: "orange" as const,
    },
    {
      title: "Expired",
      value: expiredCount,
      icon: XCircle,
      bgColor: "red" as const,
    },
  ];

  const renderScope = (campaign: BogoCampaign) => {
    const productCount = campaign.products?.length ?? 0;
    const categoryCount = campaign.categories?.length ?? 0;
    if (productCount === 0 && categoryCount === 0) return "Whole store";
    const parts = [];
    if (productCount > 0)
      parts.push(`${productCount} product${productCount !== 1 ? "s" : ""}`);
    if (categoryCount > 0)
      parts.push(`${categoryCount} categor${categoryCount !== 1 ? "ies" : "y"}`);
    return parts.join(" + ");
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 text-center">
      <Gift className="h-10 w-10 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold">No BOGO deals found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery
          ? "No deals match your search."
          : "Get started by creating your first BOGO deal."}
      </p>
    </div>
  );

  return (
    <>
      <div className="w-full space-y-6">
        {/* Page header */}
        <PageHeader
          title="BOGO Deals"
          description="Buy X get Y free — auto-applied at checkout"
          actionIcon={<Plus className="mr-2 h-4 w-4" />}
          {...(can(MENU_URL, "canCreate")
            ? {
              actionLabel: "Add BOGO Deal",
              actionHref: "/admin/marketing/bogo/add",
            }
            : {})}
        >
          <Button variant="outline" asChild>
            <Link href="/admin/marketing/bogo-usage-logs">
              <Eye className="h-4 w-4 mr-1" />
              Usage Logs
            </Link>
          </Button>
        </PageHeader>

        {/* Summary tiles */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryTiles.map((tile) => (
              <StatsCard
                key={tile.title}
                icon={tile.icon}
                title={tile.title}
                value={tile.value}
                bgColor={tile.bgColor}
              />
            ))}
          </div>
        )}

        {/* Campaign table */}
        <div className="rounded-sm border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Gift className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">All BOGO Deals</h3>
                <p className="text-sm text-muted-foreground">
                  {filteredCampaigns.length} of {campaigns.length} deal
                  {campaigns.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingIndicator message="Loading BOGO deals..." />
          ) : filteredCampaigns.length === 0 ? (
            renderEmptyState()
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead className="hidden md:table-cell">Scope</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Valid Period
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => {
                  const status = getCampaignStatus(campaign);
                  const isExpired = isCampaignExpired(campaign);
                  const usagePercent =
                    campaign.maxUsage > 0
                      ? Math.min(
                        100,
                        (campaign.timesUsed / campaign.maxUsage) * 100
                      )
                      : 0;

                  return (
                    <TableRow
                      key={campaign.id}
                      className={isExpired ? "opacity-60" : ""}
                    >
                      <TableCell className="font-medium">
                        {campaign.name}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-red-600">
                          Buy {campaign.buyQuantity} → {campaign.getQuantity}{" "}
                          Free
                        </div>
                        {campaign.maxGroupsPerOrder > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Limit {campaign.maxGroupsPerOrder} group
                            {campaign.maxGroupsPerOrder !== 1 ? "s" : ""} / order
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {renderScope(campaign)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          {campaign.timesUsed} / {campaign.maxUsage || "∞"}
                        </div>
                        {campaign.maxUsage > 0 && (
                          <div className="mt-1.5 h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                usagePercent >= 100
                                  ? "bg-red-500"
                                  : "bg-green-500"
                              )}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="whitespace-nowrap">
                              {campaign.validFrom
                                ? formatDateTime(campaign.validFrom)
                                : "No start"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarCheck2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="whitespace-nowrap">
                              {campaign.validUntil
                                ? formatDateTime(campaign.validUntil)
                                : "No end"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status.variant}
                          className="flex items-center w-fit"
                        >
                          {status.icon}
                          {status.label}
                        </Badge>
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
                                <Link
                                  href={`/admin/marketing/bogo/${campaign?.id}/edit`}
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {can(MENU_URL, "canDelete") && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteClick(campaign)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
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
