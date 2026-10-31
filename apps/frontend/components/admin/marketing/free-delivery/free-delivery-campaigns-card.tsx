"use client";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { ProductSelector } from "@/components/admin/discount/product-selector";
import { PillBadge } from "@/components/common/pill-badge";
import { TableSearch } from "@/components/common/table-search";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Option } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import {
  fetchData,
  fetchProtectedData,
  patchData,
  postData,
} from "@/utils/api-utils";
import type { FreeDeliveryCampaign, MinimalProduct } from "@/utils/types";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  CAMPAIGN_STATUS_META,
  CAMPAIGN_STATUS_OPTIONS,
  campaignStatus,
  scopeLabel,
  type CampaignStatus,
} from "@/components/admin/marketing/campaign-status";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyForm = {
  name: "",
  isActive: true,
  validFrom: null as Date | null,
  validUntil: null as Date | null,
  daysOfWeek: [] as number[],
  startTime: "",
  endTime: "",
  minOrderAmount: "",
  minQuantity: "",
  newCustomersOnly: false,
  productIds: [] as number[],
  categoryIds: [] as number[],
};

type CampaignForm = typeof emptyForm;

interface FormErrors {
  name?: string;
  startTime?: string;
  endTime?: string;
}

export function FreeDeliveryCampaignsCard() {
  const MENU_URL = "/admin/marketing/free-delivery";
  const { can } = usePermissions();
  const [campaigns, setCampaigns] = useState<FreeDeliveryCampaign[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  // Category-first product picker (products/all endpoint)
  const [pickerProducts, setPickerProducts] = useState<MinimalProduct[]>([]);
  const [pickerCategoryId, setPickerCategoryId] = useState("");

  /** Pseudo-category showing only the products picked for this campaign. */
  const SELECTED_KEY = "selected";
  const displayProducts =
    pickerCategoryId === SELECTED_KEY
      ? pickerProducts.filter((p) => form.productIds.includes(p.id))
      : pickerCategoryId
        ? pickerProducts.filter(
          (p) => p.categoryId === Number(pickerCategoryId)
        )
        : [];
  const [isLoadingPickerProducts, setIsLoadingPickerProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "">("");

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const [campaignsData, categoriesData] = await Promise.all([
        fetchProtectedData<FreeDeliveryCampaign[]>("free-delivery-campaigns"),
        fetchData<{ id: number; name: string }[]>("categories"),
      ]);
      setCampaigns(campaignsData ?? []);
      setCategories(
        (categoriesData ?? []).map((c) => ({ value: c.id, label: c.name }))
      );
    } catch (error) {
      console.error("Error loading campaigns data:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Load the chosen category's products via the minimal products/all endpoint
  useEffect(() => {
    if (!pickerCategoryId || pickerCategoryId === SELECTED_KEY) return;

    const fetchProducts = async () => {
      setIsLoadingPickerProducts(true);
      try {
        const fetched = await fetchData<MinimalProduct[]>(
          `products/all?category=${pickerCategoryId}&isActive=true`
        );
        if (Array.isArray(fetched)) {
          // Merge by id so selections survive switching between categories
          setPickerProducts((prev) => {
            const byId = new Map(prev.map((p) => [p.id, p]));
            fetched.forEach((p) => byId.set(p.id, p));
            return [...byId.values()].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
          });
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setIsLoadingPickerProducts(false);
      }
    };
    fetchProducts();

  }, [pickerCategoryId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    setPickerCategoryId("");
    setProductSearch("");
  };

  const openCreate = () => {
    resetForm();
    setIsEditOpen(true);
  };

  const openEdit = (campaign: FreeDeliveryCampaign) => {
    setForm({
      name: campaign.name,
      isActive: campaign.isActive,
      validFrom: campaign.validFrom ? new Date(campaign.validFrom) : null,
      validUntil: campaign.validUntil ? new Date(campaign.validUntil) : null,
      daysOfWeek: campaign.daysOfWeek ?? [],
      startTime: campaign.startTime ?? "",
      endTime: campaign.endTime ?? "",
      minOrderAmount:
        campaign.minOrderAmount !== null &&
          campaign.minOrderAmount !== undefined
          ? String(campaign.minOrderAmount)
          : "",
      minQuantity: campaign.minQuantity ? String(campaign.minQuantity) : "",
      newCustomersOnly: campaign.newCustomersOnly,
      productIds: campaign.products?.map((p) => p.id) ?? [],
      categoryIds: campaign.categories?.map((c) => c.id) ?? [],
    });
    setEditingId(campaign.id);
    setErrors({});
    setProductSearch("");
    // Open on the selected-products view so existing picks are visible
    setPickerCategoryId(SELECTED_KEY);
    // Seed already-selected products so their selections render in the grid
    if (campaign.products?.length) {
      setPickerProducts((prev) => {
        const byId = new Map(prev.map((p) => [p.id, p]));
        campaign.products?.forEach((p) =>
          byId.set(p.id, {
            id: p.id,
            name: p.name,
            sellingPrice: p.sellingPrice ?? 0,
            discountType: p.discountType ?? null,
            categoryId: p.category?.id ?? 0,
            categoryName: p.category?.name ?? "",
            attachmentUrl: p.attachment?.url ?? null,
          })
        );
        return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
      });
    }
    setIsEditOpen(true);
  };

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  }

  const toggleCategory = (id: number) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  }

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Campaign name is required";
    if (
      form.startTime &&
      form.endTime &&
      form.startTime === form.endTime
    ) {
      next.endTime = "Start and end time cannot be identical";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        isActive: form.isActive,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        newCustomersOnly: form.newCustomersOnly,
        productIds: form.productIds,
        categoryIds: form.categoryIds,
      };
      if (form.validFrom) payload.validFrom = form.validFrom.toISOString();
      if (form.validUntil) payload.validUntil = form.validUntil.toISOString();
      if (form.daysOfWeek.length) payload.daysOfWeek = form.daysOfWeek;
      if (form.startTime) payload.startTime = form.startTime;
      if (form.endTime) payload.endTime = form.endTime;
      if (form.minQuantity) payload.minQuantity = Number(form.minQuantity);

      if (editingId) {
        await patchData(`free-delivery-campaigns/${editingId}`, payload);
        toast.success("Campaign updated");
      } else {
        await postData("free-delivery-campaigns", payload);
        toast.success("Campaign created");
      }
      setIsEditOpen(false);
      resetForm();
      const data = await fetchProtectedData<FreeDeliveryCampaign[]>(
        "free-delivery-campaigns"
      );
      setCampaigns(data ?? []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast.error("Failed to save campaign");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (
    campaign: FreeDeliveryCampaign,
    isActive: boolean
  ) => {
    setTogglingId(campaign.id);
    try {
      await patchData(`free-delivery-campaigns/${campaign.id}`, { isActive });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, isActive } : c))
      );
      toast.success(
        `${campaign.name} ${isActive ? "activated" : "deactivated"}`
      );
    } catch (error) {
      console.error("Error toggling campaign:", error);
      toast.error("Failed to update campaign status");
    } finally {
      setTogglingId(null);
    }
  };

  const formatDays = (days: number[] | null) =>
    !days || days.length === 0 || days.length === 7
      ? "Every day"
      : days.map((d) => DAY_LABELS[d]).join(", ");

  /** Conditions rendered one per line; an empty list means every order qualifies. */
  const conditionsList = (campaign: FreeDeliveryCampaign): string[] => {
    const parts: string[] = [];
    if (Number(campaign.minOrderAmount) > 0)
      parts.push(
        `Min order ৳${formatCurrencyEnglish(
          Number(campaign.minOrderAmount)
        )}`
      );
    if (campaign.minQuantity)
      parts.push(
        `At least ${campaign.minQuantity} item${
          campaign.minQuantity === 1 ? "" : "s"
        }`
      );
    if (campaign.newCustomersOnly) parts.push("New customers only");
    return parts;
  };

  const counts = useMemo(() => {
    const statuses = campaigns.map((campaign) => campaignStatus(campaign));
    return {
      active: campaigns.filter(
        (campaign, index) => campaign.isActive && statuses[index] !== "expired"
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

  return (
    <div>
      <PageHeader
        title="Free Delivery Campaigns"
        description="Waive the shipping fee when an order meets the campaign's threshold, schedule and customer rules."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/marketing/free-delivery-usage-logs">
            <Eye className="size-3.5" />
            <span className="hidden sm:inline">Usage Logs</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={loadCampaigns}
        >
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
        {can(MENU_URL, "canCreate") && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Campaign</span>
          </Button>
        )}
      </PageHeader>

      {/* Toolbar */}
      <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex flex-col gap-2.5 md:flex-row md:flex-nowrap md:items-center md:gap-3">
          <TableSearch
            wrapperClassName="w-full md:max-w-xs"
            className="h-9"
            placeholder="Search by campaign name..."
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
          <LoadingIndicator message="Loading campaigns..." />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Truck className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No free delivery campaigns yet</p>
            <p className="text-xs text-muted-foreground">
              Create a campaign to waive shipping when an order meets your
              conditions.
            </p>
          </div>
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" /> New Campaign
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <StatsCard
              icon={Truck}
              title="Total campaigns"
              value={campaigns.length.toLocaleString("en-US")}
              description="Every offer on record"
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

          {/* Campaigns */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400">
                  <Truck className="size-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">All campaigns</h3>
                  <p className="text-[13px] text-foreground/70">
                    Shipping is waived only when every condition on the campaign
                    matches
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
                  <Truck className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">No campaigns found</p>
                  <p className="text-xs text-muted-foreground">
                    No campaigns match these filters. Try a different name or
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
                  <Table className="report-table min-w-250">
                    <TableHeader className="[&_th]:font-semibold">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-72 pl-4">Campaign</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Conditions</TableHead>
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
                        const conditions = conditionsList(campaign);

                        return (
                          <TableRow key={campaign.id}>
                            <TableCell className="py-2.5 pl-4">
                              <div className="flex items-center gap-2.5">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400">
                                  <Truck className="size-4" />
                                </span>
                                <div className="min-w-0">
                                  <p
                                    className="truncate text-sm font-medium leading-tight"
                                    title={campaign.name}
                                  >
                                    {campaign.name}
                                  </p>
                                  <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                                    {`Used ${(campaign.usageCount ?? 0).toLocaleString(
                                      "en-US"
                                    )} time${
                                      (campaign.usageCount ?? 0) === 1 ? "" : "s"
                                    } · ${scopeLabel(
                                      campaign.products?.length ?? 0,
                                      campaign.categories?.length ?? 0,
                                      "Any product"
                                    )}`}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <p className="text-sm font-medium">
                                {formatDays(campaign.daysOfWeek)}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-[13px] tabular-nums text-foreground/70">
                                <Clock className="size-3 shrink-0" />
                                {campaign.startTime && campaign.endTime
                                  ? `${campaign.startTime} – ${campaign.endTime}`
                                  : "All day"}
                              </p>
                            </TableCell>

                            <TableCell>
                              {conditions.length > 0 ? (
                                <ul className="space-y-0.5 text-[13px] text-foreground/80">
                                  {conditions.map((condition) => (
                                    <li key={condition}>{condition}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-[13px] text-foreground/80">
                                  Any order qualifies
                                </span>
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
                              <PillBadge tone={CAMPAIGN_STATUS_META[status].tone}>
                                {CAMPAIGN_STATUS_META[status].label}
                              </PillBadge>
                            </TableCell>

                            <TableCell>
                              <ActiveStatusToggle
                                isActive={campaign.isActive}
                                disabled={togglingId === campaign.id}
                                onToggle={() =>
                                  handleToggleActive(
                                    campaign,
                                    !campaign.isActive
                                  )
                                }
                                label={campaign.name}
                              />
                            </TableCell>

                            <TableCell className="pr-4 text-right">
                              {can(MENU_URL, "canEdit") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => openEdit(campaign)}
                                  aria-label={`Edit ${campaign.name}`}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              )}
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
                    const conditions = conditionsList(campaign);
                    return (
                      <article key={campaign.id} className="space-y-3 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400">
                              <Truck className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {campaign.name}
                              </p>
                              <p className="mt-0.5 truncate text-[13px] text-foreground/70">
                                {scopeLabel(
                                  campaign.products?.length ?? 0,
                                  campaign.categories?.length ?? 0,
                                  "Any product"
                                )}
                              </p>
                            </div>
                          </div>
                          <PillBadge tone={CAMPAIGN_STATUS_META[status].tone}>
                            {CAMPAIGN_STATUS_META[status].label}
                          </PillBadge>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/40 p-2.5">
                          <div>
                            <p className="text-[13px] font-medium text-foreground/60">Used</p>
                            <p className="text-sm font-semibold tabular-nums">
                              {(campaign.usageCount ?? 0).toLocaleString("en-US")}{" "}
                              time{(campaign.usageCount ?? 0) === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-foreground/60">Days</p>
                            <p className="text-sm font-medium">
                              {formatDays(campaign.daysOfWeek)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[13px] font-medium text-foreground/60">Time</p>
                            <p className="flex items-center gap-1 text-sm tabular-nums">
                              <Clock className="size-3.5 shrink-0 text-foreground/60" />
                              {campaign.startTime && campaign.endTime
                                ? `${campaign.startTime} – ${campaign.endTime}`
                                : "All day"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[13px] font-medium text-foreground/60">
                              Conditions
                            </p>
                            {conditions.length > 0 ? (
                              <ul className="space-y-0.5 text-sm">
                                {conditions.map((condition) => (
                                  <li key={condition}>{condition}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm">Any order qualifies</p>
                            )}
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
                          <ActiveStatusToggle
                            isActive={campaign.isActive}
                            disabled={togglingId === campaign.id}
                            onToggle={() =>
                              handleToggleActive(campaign, !campaign.isActive)
                            }
                            label={campaign.name}
                          />
                          {can(MENU_URL, "canEdit") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(campaign)}
                            >
                              <Pencil className="size-3.5" /> Edit
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="border-t px-4 py-3">
                  <p className="text-[13px] text-foreground/70">
                    Showing {filteredCampaigns.length.toLocaleString("en-US")}{" "}
                    of {campaigns.length.toLocaleString("en-US")} campaign
                    {campaigns.length === 1 ? "" : "s"}
                    {hasFilters && " matching the current filters"}
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Create / edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Campaign" : "New Free Delivery Campaign"}
            </DialogTitle>
            <DialogDescription>
              Conditions are evaluated in Asia/Dhaka time. The first matching
              campaign grants free delivery (shipping = ৳0).
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[62vh] space-y-6 overflow-y-auto -mx-1 px-1 py-1">
            {/* General */}
            <section className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                General
              </h4>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name *</Label>
                  <Input
                    id="campaign-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. Meat Friday Night"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-active">Status</Label>
                  <div className="flex h-9 items-center gap-2 rounded-md border px-3 dark:border-gray-700">
                    <Switch
                      id="campaign-active"
                      checked={form.isActive}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, isActive: checked }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {form.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Schedule & Conditions */}
            <section className="space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Schedule &amp; Conditions
              </h4>
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Schedule card */}
                <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        Schedule
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Asia/Dhaka time
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAY_LABELS.map((label, day) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${form.daysOfWeek.includes(day)
                            ? "border-primaryColor bg-primaryColor text-white"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave all unchecked for every day.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <DatePicker
                        value={form.validFrom ?? undefined}
                        onChange={(date) =>
                          setForm((prev) => ({ ...prev, validFrom: date }))
                        }
                        placeholder="Always active"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <DatePicker
                        value={form.validUntil ?? undefined}
                        onChange={(date) =>
                          setForm((prev) => ({ ...prev, validUntil: date }))
                        }
                        placeholder="No end date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="campaign-start-time">Start Time</Label>
                      <Input
                        id="campaign-start-time"
                        type="time"
                        value={form.startTime}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="campaign-end-time">End Time</Label>
                      <Input
                        id="campaign-end-time"
                        type="time"
                        value={form.endTime}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                      />
                      {errors.endTime && (
                        <p className="text-xs text-red-600">{errors.endTime}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground sm:col-span-2">
                      Leave both times empty to run all day — windows may cross
                      midnight.
                    </p>
                  </div>
                </div>

                {/* Conditions card */}
                <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                      <Banknote className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        Conditions
                      </p>
                      <p className="text-xs text-muted-foreground">
                        All conditions must match for free delivery
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="campaign-min-amount">
                        Minimum Order Amount (৳)
                      </Label>
                      <Input
                        id="campaign-min-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.minOrderAmount}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            minOrderAmount: e.target.value,
                          }))
                        }
                        placeholder="0 = no minimum"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="campaign-min-qty">Minimum Quantity</Label>
                      <Input
                        id="campaign-min-qty"
                        type="number"
                        min="1"
                        value={form.minQuantity}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            minQuantity: e.target.value,
                          }))
                        }
                        placeholder="No minimum"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                    <div>
                      <Label
                        htmlFor="campaign-new-customers"
                        className="font-medium"
                      >
                        New Customers Only
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Only customers with zero previous orders qualify
                        (guests never match).
                      </p>
                    </div>
                    <Switch
                      id="campaign-new-customers"
                      checked={form.newCustomersOnly}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          newCustomersOnly: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Scope */}
            <section className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Scope
              </h4>
              <Accordion
                type="multiple"
                defaultValue={editingId ? ["products"] : []}
              >
                <AccordionItem value="categories" className="border-none">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Tags className="h-4 w-4 text-muted-foreground" />
                      Included Categories
                      {form.categoryIds.length > 0 && (
                        <span className="rounded-full bg-primaryColor/10 px-2 py-0.5 text-xs font-semibold text-primaryColor">
                          {form.categoryIds.length}
                        </span>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => {
                        const checked = form.categoryIds.includes(
                          category.value
                        );
                        return (
                          <label
                            key={category.value}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                              checked
                                ? "border-primaryColor bg-primaryColor/10 font-medium text-primaryColor"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() =>
                                toggleCategory(category.value)
                              }
                            />
                            {category.label}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Orders containing items from these categories qualify for
                      the campaign. Leave empty for any category.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="products" className="border-none">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Products
                      {form.productIds.length > 0 && (
                        <span className="rounded-full bg-primaryColor/10 px-2 py-0.5 text-xs font-semibold text-primaryColor">
                          {form.productIds.length}
                        </span>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Select
                          value={pickerCategoryId}
                          onValueChange={setPickerCategoryId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Product category..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SELECTED_KEY}>
                              {`Selected (${form.productIds.length})`}
                            </SelectItem>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.value}
                                value={String(category.value)}
                              >
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Only filters the product list — selecting here does
                          not include the category in the campaign
                        </p>
                      </div>
                      <div className="relative self-start">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products..."
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <ProductSelector
                      products={displayProducts}
                      selectedProductIds={form.productIds}
                      onChange={(selected) =>
                        setForm((prev) => ({ ...prev, productIds: selected }))
                      }
                      searchQuery={productSearch}
                      isLoading={isLoadingPickerProducts}
                      disabled={!pickerCategoryId}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to allow any product. With products or
                      categories selected, the order qualifies when it contains
                      at least one matching item.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              aria-busy={isSaving}
              className="w-full bg-primaryColor hover:bg-primaryColor/90 sm:w-auto dark:bg-red-700 dark:hover:bg-red-600"
            >
              {isSaving ? "Saving..." : "Save Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
