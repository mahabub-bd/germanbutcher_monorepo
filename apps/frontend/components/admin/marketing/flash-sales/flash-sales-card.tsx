"use client";
import { revalidateProducts } from "@/actions/revalidate";
import { ProductSelector } from "@/components/admin/discount/product-selector";
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
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import {
  fetchData,
  fetchProtectedData,
  patchData,
  postData,
} from "@/utils/api-utils";
import { applyTime, toTimeInputValue } from "@/utils/datetime";
import type { FlashSaleCampaign, MinimalProduct } from "@/utils/types";
import { DiscountType } from "@/utils/types";
import {
  Calendar,
  CalendarClock,
  Clock,
  Gauge,
  Package,
  Pencil,
  Percent,
  Plus,
  Search,
  Tags,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { LoadingIndicator } from "../../loading-indicator";

const emptyForm = {
  name: "",
  isActive: true,
  validFrom: null as Date | null,
  validFromTime: "00:00",
  validUntil: null as Date | null,
  validUntilTime: "23:59",
  discountType: DiscountType.PERCENTAGE,
  discountValue: "",
  maxUsage: "",
  productIds: [] as number[],
  categoryIds: [] as number[],
};

/** Ticking timestamp so remaining-time badges stay current. */
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Compact remaining-time text: "2d 4h", "3h 12m", "45m". */
const formatRemaining = (ms: number): string => {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Remaining-time badge for a campaign window: "Starts in …" before it
 * opens, "… left" while running (amber inside the last 24h), "Expired"
 * once past. Renders nothing without a window. */
function CampaignTimeBadge({
  campaign,
  now,
}: {
  campaign: FlashSaleCampaign;
  now: number;
}) {
  const from = campaign.validFrom
    ? new Date(campaign.validFrom).getTime()
    : null;
  const until = campaign.validUntil
    ? new Date(campaign.validUntil).getTime()
    : null;

  let label: string;
  let className: string;
  if (from && now < from) {
    label = `Starts in ${formatRemaining(from - now)}`;
    className =
      "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400";
  } else if (until && now >= until) {
    label = "Expired";
    className = "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400";
  } else if (until) {
    const remaining = until - now;
    label = `${formatRemaining(remaining)} left`;
    className =
      remaining < DAY_MS
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
        : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400";
  } else {
    return null;
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}

type CampaignForm = typeof emptyForm;

interface FormErrors {
  name?: string;
  discountValue?: string;
}

export function FlashSalesCard() {
  const MENU_URL = "/admin/marketing/flash-sales";
  const { can } = usePermissions();
  const [campaigns, setCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const now = useNow();
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

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [campaignsData, categoriesData] = await Promise.all([
          fetchProtectedData<FlashSaleCampaign[]>("flash-sale-campaigns"),
          fetchData<{ id: number; name: string }[]>("categories"),
        ]);
        setCampaigns(campaignsData ?? []);
        setCategories(
          (categoriesData ?? []).map((c) => ({ value: c.id, label: c.name }))
        );
      } catch (error) {
        console.error("Error loading flash sale campaigns:", error);
        toast.error("Failed to load flash sale campaigns");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

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

  const openEdit = (campaign: FlashSaleCampaign) => {
    setForm({
      name: campaign.name,
      isActive: campaign.isActive,
      validFrom: campaign.validFrom ? new Date(campaign.validFrom) : null,
      validFromTime: campaign.validFrom
        ? toTimeInputValue(new Date(campaign.validFrom))
        : "00:00",
      validUntil: campaign.validUntil ? new Date(campaign.validUntil) : null,
      validUntilTime: campaign.validUntil
        ? toTimeInputValue(new Date(campaign.validUntil))
        : "23:59",
      discountType: campaign.discountType,
      discountValue: String(campaign.discountValue ?? ""),
      maxUsage: campaign.maxUsage ? String(campaign.maxUsage) : "",
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

  const toggleCategory = (id: number) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Campaign name is required";
    const value = Number(form.discountValue);
    if (!form.discountValue || Number.isNaN(value) || value <= 0) {
      next.discountValue = "Discount value must be greater than 0";
    } else if (form.discountType === DiscountType.PERCENTAGE && value > 100) {
      next.discountValue = "Percentage cannot be greater than 100";
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
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxUsage: form.maxUsage ? Number(form.maxUsage) : 0,
        productIds: form.productIds,
        categoryIds: form.categoryIds,
      };
      if (form.validFrom) {
        payload.validFrom = applyTime(
          form.validFrom,
          form.validFromTime,
          false
        ).toISOString();
      }
      if (form.validUntil) {
        payload.validUntil = applyTime(
          form.validUntil,
          form.validUntilTime,
          true
        ).toISOString();
      }

      if (editingId) {
        await patchData(`flash-sale-campaigns/${editingId}`, payload);
        toast.success("Flash sale campaign updated");
      } else {
        await postData("flash-sale-campaigns", payload);
        toast.success("Flash sale campaign created");
      }
      setIsEditOpen(false);
      resetForm();
      // Bust the "products" tag so the storefront flash-sale strip (cached
      // up to 300s) shows the campaign change on the next render.
      await revalidateProducts();
      const data = await fetchProtectedData<FlashSaleCampaign[]>(
        "flash-sale-campaigns"
      );
      setCampaigns(data ?? []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving flash sale campaign:", error);
      toast.error("Failed to save flash sale campaign");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (
    campaign: FlashSaleCampaign,
    isActive: boolean
  ) => {
    setTogglingId(campaign.id);
    try {
      await patchData(`flash-sale-campaigns/${campaign.id}`, { isActive });

      await revalidateProducts();
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

  /** Small icon chips summarizing a campaign window, discount and usage. */
  const buildChips = (campaign: FlashSaleCampaign) => {
    const chips: { icon: React.ElementType; text: string }[] = [];
    if (campaign.validFrom || campaign.validUntil) {
      const formatDateTime = (date: string | Date) =>
        new Date(date).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      const from = campaign.validFrom ? formatDateTime(campaign.validFrom) : "…";
      const until = campaign.validUntil
        ? formatDateTime(campaign.validUntil)
        : "…";
      chips.push({ icon: Calendar, text: `${from} – ${until}` });
    }
    chips.push({
      icon: Zap,
      text:
        campaign.discountType === DiscountType.PERCENTAGE
          ? `${Number(campaign.discountValue)}% OFF`
          : `${formatCurrencyEnglish(Number(campaign.discountValue))} OFF`,
    });
    chips.push({
      icon: Package,
      text:
        campaign.maxUsage > 0
          ? `${campaign.timesUsed}/${campaign.maxUsage} used`
          : `${campaign.timesUsed} used`,
    });
    if (campaign.products?.length)
      chips.push({
        icon: Package,
        text: `${campaign.products.length} product${campaign.products.length > 1 ? "s" : ""}`,
      });
    if (campaign.categories?.length)
      chips.push({
        icon: Tags,
        text: campaign.categories.map((c) => c.name).join(", "),
      });
    return chips;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex justify-end">
        {can(MENU_URL, "canCreate") && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Flash Sale
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingIndicator message="Loading flash sale campaigns..." />
      ) : campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-muted-foreground dark:border-gray-700">
          No flash sale campaigns yet — create one to discount selected products.
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const chips = buildChips(campaign);
            return (
              <div
                key={campaign.id}
                className={`rounded-sm border p-5 transition-colors ${campaign.isActive
                  ? "border-gray-100 bg-white shadow-sm hover:border-primaryColor/30 dark:border-gray-800 dark:bg-gray-900"
                  : "border-dashed border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/40"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${campaign.isActive
                        ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                        }`}
                    >
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h4
                          className={`text-base font-semibold leading-snug ${campaign.isActive
                            ? "text-gray-900 dark:text-gray-50"
                            : "text-gray-500 dark:text-gray-400"
                            }`}
                        >
                          {campaign.name}
                        </h4>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${campaign.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                        >
                          {campaign.isActive ? "Active" : "Inactive"}
                        </span>
                        <CampaignTimeBadge campaign={campaign} now={now} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Flash prices override each product&apos;s own discount while active
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
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
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => openEdit(campaign)}
                        aria-label={`Edit ${campaign.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Condition chips — wrap on mobile, single scrollable line from sm up */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 sm:flex-nowrap sm:overflow-x-auto dark:border-gray-800">
                  {chips.map((chip, index) => (
                    <span
                      key={index}
                      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <chip.icon className="h-3.5 w-3.5" />
                      {chip.text}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Flash Sale" : "New Flash Sale Campaign"}
            </DialogTitle>
            <DialogDescription>
              While active, the flash price overrides each selected product&apos;s
              own discount (never stacked). When several campaigns overlap, the
              oldest wins.
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
                  <Label htmlFor="flash-name">Campaign Name *</Label>
                  <Input
                    id="flash-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. Eid Flash Sale"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flash-active">Status</Label>
                  <div className="flex h-9 items-center gap-2 rounded-md border px-3 dark:border-gray-700">
                    <Switch
                      id="flash-active"
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

            {/* Discount & Schedule */}
            <section className="space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Discount &amp; Schedule
              </h4>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Discount card */}
                <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                      <Percent className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        Discount
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Applied to each selected product
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={form.discountType}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            discountType: value as DiscountType,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={DiscountType.PERCENTAGE}>
                            Percentage (%)
                          </SelectItem>
                          <SelectItem value={DiscountType.FIXED}>
                            Fixed (৳)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flash-discount-value">Value *</Label>
                      <div className="relative">
                        <Input
                          id="flash-discount-value"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.discountValue}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              discountValue: e.target.value,
                            }))
                          }
                          placeholder={
                            form.discountType === DiscountType.PERCENTAGE
                              ? "e.g. 20"
                              : "e.g. 100"
                          }
                          className="pr-8"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                          {form.discountType === DiscountType.PERCENTAGE
                            ? "%"
                            : "৳"}
                        </span>
                      </div>
                      {errors.discountValue && (
                        <p className="text-xs text-red-600">
                          {errors.discountValue}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="flash-max-usage"
                      className="flex items-center gap-1.5"
                    >
                      <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                      Max Usage
                    </Label>
                    <Input
                      id="flash-max-usage"
                      type="number"
                      min="0"
                      value={form.maxUsage}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          maxUsage: e.target.value,
                        }))
                      }
                      placeholder="0 = unlimited"
                    />
                    <p className="text-xs text-muted-foreground">
                      Campaign stops applying after this many orders
                    </p>
                  </div>
                </div>

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
                      <p className="text-xs text-muted-foreground">
                        Exact start and end, down to the minute
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Starts</Label>
                      <DatePicker
                        value={form.validFrom ?? undefined}
                        onChange={(date) =>
                          setForm((prev) => ({ ...prev, validFrom: date }))
                        }
                        placeholder="Immediately"
                      />
                      <Input
                        type="time"
                        value={form.validFromTime}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            validFromTime: e.target.value,
                          }))
                        }
                        aria-label="Start time"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ends</Label>
                      <DatePicker
                        value={form.validUntil ?? undefined}
                        onChange={(date) =>
                          setForm((prev) => ({ ...prev, validUntil: date }))
                        }
                        placeholder="No end date"
                      />
                      <Input
                        type="time"
                        value={form.validUntilTime}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            validUntilTime: e.target.value,
                          }))
                        }
                        aria-label="End time"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground sm:col-span-2">
                      Leave a date empty for no limit — e.g. start immediately
                      or run until you stop it.
                    </p>
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
                      Every product in these categories gets the flash price.
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
                      A product qualifies if selected here or if its category
                      is selected above.
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
