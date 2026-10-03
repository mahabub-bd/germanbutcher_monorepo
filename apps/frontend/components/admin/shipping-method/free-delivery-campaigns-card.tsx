"use client";
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
import { ProductSelector } from "@/components/admin/discount/product-selector";
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import {
  fetchData,
  fetchProtectedData,
  patchData,
  postData,
} from "@/utils/api-utils";
import type { FreeDeliveryCampaign, MinimalProduct } from "@/utils/types";
import {
  Banknote,
  Calendar,
  CalendarDays,
  Clock,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Tags,
  Truck,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { LoadingIndicator } from "../loading-indicator";

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
  const [isLoadingPickerProducts, setIsLoadingPickerProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    const load = async () => {
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
    };
    load();
  }, []);

  // Load the chosen category's products via the minimal products/all endpoint
  useEffect(() => {
    if (!pickerCategoryId) return;

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

  /** Small icon chips summarizing a campaign's schedule + conditions. */
  const buildChips = (campaign: FreeDeliveryCampaign) => {
    const chips: { icon: React.ElementType; text: string }[] = [];
    if (campaign.validFrom || campaign.validUntil) {
      const from = campaign.validFrom
        ? new Date(campaign.validFrom).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        : "…";
      const until = campaign.validUntil
        ? new Date(campaign.validUntil).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        : "…";
      chips.push({ icon: Calendar, text: `${from} – ${until}` });
    }
    chips.push({ icon: CalendarDays, text: formatDays(campaign.daysOfWeek) });
    chips.push({
      icon: Clock,
      text:
        campaign.startTime && campaign.endTime
          ? `${campaign.startTime}–${campaign.endTime}`
          : "All day",
    });
    if (Number(campaign.minOrderAmount) > 0)
      chips.push({
        icon: Banknote,
        text: `Min ${formatCurrencyEnglish(Number(campaign.minOrderAmount))}`,
      });
    if (campaign.minQuantity)
      chips.push({ icon: ShoppingCart, text: `Min qty ${campaign.minQuantity}` });
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
    if (campaign.newCustomersOnly)
      chips.push({ icon: UserPlus, text: "New customers" });
    return chips;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">

        {can(MENU_URL, "canCreate") && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingIndicator message="Loading campaigns..." />
      ) : campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-muted-foreground dark:border-gray-700">
          No campaigns yet — create one to schedule free delivery.
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const chips = buildChips(campaign);
            return (
              <div
                key={campaign.id}
                className={`rounded-xl border p-5 transition-colors ${campaign.isActive
                  ? "border-gray-100 bg-white shadow-sm hover:border-primaryColor/30 dark:border-gray-800 dark:bg-gray-900"
                  : "border-dashed border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/40"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${campaign.isActive
                        ? "bg-red-50 text-primaryColor dark:bg-red-950/40 dark:text-red-400"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                        }`}
                    >
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`truncate text-base font-semibold ${campaign.isActive
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
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Free delivery when all conditions match
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

                {/* Condition chips — single line, scroll horizontally */}
                <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto border-t border-gray-100 pt-4 dark:border-gray-800">
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

            {/* Schedule */}
            <section className="space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Schedule
              </h4>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                      setForm((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                  />
                  {errors.endTime && (
                    <p className="text-xs text-red-600">{errors.endTime}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Times follow Asia/Dhaka. Leave both empty to run all day —
                windows may cross midnight.
              </p>
            </section>

            {/* Conditions */}
            <section className="space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Conditions
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="space-y-2 sm:col-span-2">
                  <Label>Included Categories</Label>
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
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Products</Label>
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
                    products={pickerProducts}
                    selectedProductIds={form.productIds}
                    onChange={(selected) =>
                      setForm((prev) => ({ ...prev, productIds: selected }))
                    }
                    searchQuery={productSearch}
                    isLoading={isLoadingPickerProducts}
                    disabled={!pickerCategoryId}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to allow any product
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                With products/categories selected, the order qualifies when it
                contains at least one matching item.
              </p>
            </section>

            {/* Audience */}
            <section className="space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Audience
              </h4>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label
                    htmlFor="campaign-new-customers"
                    className="font-medium"
                  >
                    New Customers Only
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only customers with zero previous orders qualify (guests
                    never match).
                  </p>
                </div>
                <Switch
                  id="campaign-new-customers"
                  checked={form.newCustomersOnly}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, newCustomersOnly: checked }))
                  }
                />
              </div>
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
