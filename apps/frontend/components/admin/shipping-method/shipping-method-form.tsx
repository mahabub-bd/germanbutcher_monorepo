"use client";

import { CoverageTree } from "@/components/admin/shipping-method/coverage-tree";
import { PillBadge } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { normalizeLocationName } from "@/lib/delivery-coverage";
import { cn } from "@/lib/utils";
import { patchData, postData } from "@/utils/api-utils";
import type { ShippingMethod } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const shippingMethodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  cost: z.string().min(1, "Cost is required"),
  isActive: z.boolean(),
  requiresOnlinePayment: z.boolean(),
  isExcludedFromFreeDelivery: z.boolean(),
  isPickup: z.boolean(),
  displayOrder: z.string().min(1, "Display order is required"),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  description: z.string().min(1, "Description is required"),
  /** Where the method is offered — picked on the coverage tree
   *  (division → city → area). */
  serviceCities: z.array(z.string()),
  serviceAreasList: z.array(z.string()),
  serviceAreasMode: z.enum(["include", "exclude"]),
});

interface ShippingMethodFormProps {
  shippingMethod?: ShippingMethod;
  mode: "create" | "edit";
  onSuccess: () => void;
  /** Leave without saving. Falls back to onSuccess when omitted. */
  onCancel?: () => void;
}

/** A bordered card that groups related fields under a titled header, so the
 *  form reads as distinct sections instead of one long grid. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Toggle rendered as a full-width row: label + hint on the left, switch on
 *  the right. Clicking anywhere on the row flips the switch. */
function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background p-3.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        onClick={(event) => event.stopPropagation()}
        className="shrink-0"
      />
    </div>
  );
}

/** Two-way segmented control — clearer than a dropdown for a binary choice. */
function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 rounded-lg border bg-muted/30 p-1.5 sm:grid-cols-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-2 text-left text-sm transition-colors",
              active
                ? "bg-card font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ShippingMethodForm({
  shippingMethod,
  mode,
  onSuccess,
  onCancel,
}: ShippingMethodFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof shippingMethodSchema>>({
    resolver: zodResolver(shippingMethodSchema),
    defaultValues: {
      name: shippingMethod?.name || "",
      cost: shippingMethod?.cost || "",
      isActive: shippingMethod?.isActive ?? true,
      requiresOnlinePayment: shippingMethod?.requiresOnlinePayment ?? false,
      isExcludedFromFreeDelivery:
        shippingMethod?.isExcludedFromFreeDelivery ?? false,
      isPickup: shippingMethod?.isPickup ?? false,
      serviceCities: shippingMethod?.serviceAreas?.cities ?? [],
      serviceAreasList: shippingMethod?.serviceAreas?.areas ?? [],
      serviceAreasMode: shippingMethod?.serviceAreas?.mode ?? "include",
      displayOrder: String(shippingMethod?.displayOrder ?? 0),
      deliveryTime: shippingMethod?.deliveryTime || "",
      description: shippingMethod?.description || "",
    },
  });

  // Coverage tree (enabled entries only) rendered like the Delivery Coverage
  // page: division → city → area checkboxes. A checked city = served fully;
  // checking individual areas under a city limits that city to those areas.
  const settings = useBusinessSettings();
  const coverage = settings?.deliveryCoverage ?? null;
  const selectedCities = form.watch("serviceCities");
  const selectedAreas = form.watch("serviceAreasList");

  const coverageTree = useMemo(() => {
    if (!coverage) return [];
    type TreeCity = { name: string; areas: string[] };
    const divisionByName = new Map(
      coverage.divisions
        .filter((division) => division.enabled)
        .map((division) => [division.name, division])
    );
    const nodes = new Map<string, TreeCity[]>();
    for (const city of coverage.cities) {
      if (!city.enabled || !divisionByName.has(city.division)) continue;
      const areas = coverage.areas
        .filter((area) => area.enabled && area.city === city.name)
        .map((area) => area.name);
      const list = nodes.get(city.division) ?? [];
      list.push({ name: city.name, areas });
      nodes.set(city.division, list);
    }
    return [...divisionByName.keys()].sort((a, b) => a.localeCompare(b)).map(
      (name) => ({
        name,
        cities: (nodes.get(name) ?? []).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      })
    );
  }, [coverage]);

  // Tree interactions (checkboxes keep the invariant: a city with selected
  // areas is partial — kept out of cities[] — and its areas carry the limit).
  const setCityFull = (cityName: string, cityAreas: string[], full: boolean) => {
    const cities = form
      .getValues("serviceCities")
      .filter((city) => city !== cityName);
    const areas = form
      .getValues("serviceAreasList")
      .filter((area) => !cityAreas.includes(area));
    form.setValue("serviceCities", full ? [...cities, cityName] : cities);
    form.setValue("serviceAreasList", areas);
  };

  const setAreaSelected = (
    cityName: string,
    areaName: string,
    selected: boolean
  ) => {
    if (selected) {
      const areas = form.getValues("serviceAreasList");
      if (!areas.includes(areaName)) {
        form.setValue("serviceAreasList", [...areas, areaName]);
      }
      // The city becomes area-limited — remove it from the fully-served list.
      form.setValue(
        "serviceCities",
        form.getValues("serviceCities").filter((city) => city !== cityName)
      );
    } else {
      form.setValue(
        "serviceAreasList",
        form.getValues("serviceAreasList").filter((area) => area !== areaName)
      );
    }
  };

  const setDivisionServed = (
    divisionCities: { name: string; areas: string[] }[],
    full: boolean
  ) => {
    const cityNames = divisionCities.map((city) => city.name);
    const areaNames = divisionCities.flatMap((city) => city.areas);
    const cities = form
      .getValues("serviceCities")
      .filter((city) => !cityNames.includes(city));
    const areas = form
      .getValues("serviceAreasList")
      .filter((area) => !areaNames.includes(area));
    form.setValue(
      "serviceCities",
      full ? [...cities, ...cityNames] : cities
    );
    form.setValue("serviceAreasList", areas);
  };

  /** Tick every area of one city (the city becomes area-limited instead of
   *  fully served). */
  const selectAllCityAreas = (
    cityName: string,
    cityAreas: string[]
  ) => {
    const existing = form.getValues("serviceAreasList");
    const additions = cityAreas.filter((area) => !existing.includes(area));
    form.setValue("serviceAreasList", [...existing, ...additions]);
    form.setValue(
      "serviceCities",
      form.getValues("serviceCities").filter((city) => city !== cityName)
    );
  };

  /** One-line recap of the ticked coverage, shown beside the section header
   *  controls so the selection is readable without scrolling divisions. */
  const coverageSummary =
    selectedCities.length === 0 && selectedAreas.length === 0
      ? "Nothing ticked yet — this method will be offered everywhere."
      : `${selectedCities.length} cit${selectedCities.length === 1 ? "y" : "ies"} fully served · ${selectedAreas.length} area${selectedAreas.length === 1 ? "" : "s"} ticked`;
  const modeIsInclude = form.watch("serviceAreasMode") === "include";

  const onSubmit = async (values: z.infer<typeof shippingMethodSchema>) => {
    setIsSubmitting(true);
    try {
      // Cities with no selected areas are served fully; selecting an area
      // under a city limits that city to those areas.
      const cities = values.serviceCities;
      const areas = values.serviceAreasList;
      const serviceAreasConfig: ShippingMethod["serviceAreas"] =
        cities.length === 0 && areas.length === 0
          ? null
          : (() => {
            const areaCitySet = new Set(
              (coverage?.areas ?? [])
                .filter((area) =>
                  areas.some(
                    (name) =>
                      normalizeLocationName(name) ===
                      normalizeLocationName(area.name)
                  )
                )
                .map((area) => normalizeLocationName(area.city))
            );
            return {
              mode: values.serviceAreasMode,
              cities: cities.filter(
                (city) => !areaCitySet.has(normalizeLocationName(city))
              ),
              areas,
            };
          })();

      const payload = {
        name: values.name,
        cost: values.cost,
        isActive: values.isActive,
        requiresOnlinePayment: values.requiresOnlinePayment,
        isExcludedFromFreeDelivery: values.isExcludedFromFreeDelivery,
        isPickup: values.isPickup,
        displayOrder: values.displayOrder,
        deliveryTime: values.deliveryTime,
        description: values.description,
        serviceAreas: serviceAreasConfig,
      };
      if (mode === "create") {
        await postData("shipping-methods", payload);
      } else if (mode === "edit" && shippingMethod) {
        await patchData(`shipping-methods/${shippingMethod.id}`, payload);
      }
      // Success toast is shown by the wrapping page (handleSuccess).
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? "Failed to create shipping method. Please try again."
          : "Failed to update shipping method. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basics */}
        <FormSection
          title="Method details"
          description="Name, pricing and the note customers see at checkout."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2 lg:col-span-2">
                  <FormLabel>Method name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Standard Shipping"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Display order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="1"
                      {...field}
                      className="w-full tabular-nums"
                    />
                  </FormControl>
                  <FormDescription>Lower numbers show first.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Cost</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                        ৳
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        className="w-full pl-7 tabular-nums"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Enter 0 to offer it free.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryTime"
              render={({ field }) => (
                <FormItem className="space-y-2 sm:col-span-2">
                  <FormLabel>Delivery time</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 3-5 business days"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Shown beside the method at checkout.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2 sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What customers get with this method"
                      {...field}
                      className="w-full min-h-20 resize-y"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Checkout behaviour */}
        <FormSection
          title="Checkout behaviour"
          description="Toggles change how this method is offered, priced and paid for."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <SwitchRow
                  label="Active"
                  hint="Offer this method to customers at checkout"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <FormField
              control={form.control}
              name="requiresOnlinePayment"
              render={({ field }) => (
                <SwitchRow
                  label="Online payment only"
                  hint="Cash on delivery is rejected for this method"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <FormField
              control={form.control}
              name="isExcludedFromFreeDelivery"
              render={({ field }) => (
                <SwitchRow
                  label="Exclude from free delivery"
                  hint="Campaigns never waive this method's cost"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <FormField
              control={form.control}
              name="isPickup"
              render={({ field }) => (
                <SwitchRow
                  label="Store pickup"
                  hint="Customer collects the order — no shipping involved"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </FormSection>

        {/* Delivery area */}
        <FormSection
          title="Delivery area"
          description="Data comes from Delivery Coverage. A ticked city is served fully; ticking areas limits that city to those areas."
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="serviceAreasMode"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Availability</FormLabel>
                  <SegmentedControl
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      {
                        value: "include",
                        label: "Only where I tick below",
                      },
                      {
                        value: "exclude",
                        label: "Everywhere except where I tick",
                      },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/30 px-3.5 py-2.5">
              <p className="text-xs text-muted-foreground">
                {coverageSummary}
              </p>
              <PillBadge tone={modeIsInclude ? "blue" : "amber"}>
                {modeIsInclude ? "Whitelist" : "Blacklist"}
              </PillBadge>
            </div>

            <CoverageTree
              tree={coverageTree}
              cities={selectedCities}
              areas={selectedAreas}
              coverage={coverage}
              onToggleCity={setCityFull}
              onToggleArea={setAreaSelected}
              onToggleDivision={setDivisionServed}
              onSelectAllAreas={selectAllCityAreas}
              onSelectVisible={(cityNames) => {
                // Select all = tick every visible city as fully served
                // (any area-level limits under them are cleared).
                form.setValue("serviceCities", cityNames);
                form.setValue("serviceAreasList", []);
              }}
              onClearVisible={(cityNames, areaNames) => {
                const citySet = new Set(cityNames);
                const areaSet = new Set(areaNames);
                form.setValue(
                  "serviceCities",
                  form
                    .getValues("serviceCities")
                    .filter((city) => !citySet.has(city))
                );
                form.setValue(
                  "serviceAreasList",
                  form
                    .getValues("serviceAreasList")
                    .filter((area) => !areaSet.has(area))
                );
              }}
            />
          </div>
        </FormSection>

        <div className="sticky bottom-2 flex flex-col-reverse items-stretch gap-3 rounded-xl border bg-card/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <p className="mr-auto hidden text-xs text-muted-foreground lg:block">
            Changes go live on the storefront immediately after saving.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel ?? onSuccess}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create method" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
