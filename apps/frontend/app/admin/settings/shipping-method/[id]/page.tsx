"use client";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PillBadge, type PillTone } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import {
  normalizeLocationName,
  type DeliveryCoverage,
} from "@/lib/delivery-coverage";
import { cn, formatDateTime } from "@/lib/utils";
import { fetchData } from "@/utils/api-utils";
import type { ShippingMethod } from "@/utils/types";
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Landmark,
  Loader2,
  MapPin,
  MapPinOff,
  MessageSquareText,
  PackageCheck,
  Pencil,
  Tag,
  Truck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

const MENU_URL = "/admin/settings/shipping-method";
const COVERAGE_MENU_URL = "/admin/settings/delivery-coverage";

/** Backend sends semantic flag keys; the admin UI owns the colour. */
const SHIPPING_FLAG_TONE: Record<string, PillTone> = {
  pickup: "violet",
  online_payment: "sky",
  no_free_delivery: "amber",
  area_limited: "blue",
};

/** Shipping cost keeps its decimals when present (60.5 is not 60). */
const money = (value: number | string) =>
  Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

/** A bordered card with a consistent header used across the detail page. */
function SectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-xs",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** Label-left / value-right row for the sidebar facts list. */
function FactRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 text-right text-sm font-medium wrap-break-word">
        {children}
      </span>
    </div>
  );
}

/** Read-only twin of the form's SwitchRow: state pill instead of a switch. */
function BehaviourRow({
  icon,
  label,
  hint,
  on,
  onLabel,
  offLabel,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  on: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
        on ? "border-primaryColor/25 bg-primaryColor/4" : "bg-background"
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
            on
              ? "bg-primaryColor/10 text-primaryColor"
              : "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
        </div>
      </div>
      <PillBadge tone={on ? "emerald" : "neutral"} className="shrink-0">
        {on ? <CheckCircle2 className="mr-1 size-3" /> : <XCircle className="mr-1 size-3" />}
        {on ? onLabel : offLabel}
      </PillBadge>
    </div>
  );
}

type CityRow = { name: string; full: boolean; areas: string[] };

/** Group the stored service areas by division → city so the read-only list
 *  mirrors the Delivery Coverage hierarchy instead of two flat pill rows. */
function groupServiceAreas(
  method: ShippingMethod,
  coverage: DeliveryCoverage | null
): { division: string; cities: CityRow[] }[] {
  const cities = method.serviceAreas?.cities ?? [];
  const areas = method.serviceAreas?.areas ?? [];

  const divisionOfCity = (name: string) => {
    if (!coverage) return "Unassigned";
    const key = normalizeLocationName(name);
    const entry = coverage.cities.find(
      (city) => normalizeLocationName(city.name) === key
    );
    return entry?.division || "Unassigned";
  };
  const cityOfArea = (name: string) => {
    if (!coverage) return null;
    const key = normalizeLocationName(name);
    const entry = coverage.areas.find(
      (area) => normalizeLocationName(area.name) === key
    );
    return entry?.city || null;
  };

  const rows = new Map<string, CityRow>();
  for (const name of cities) {
    rows.set(name, { name, full: true, areas: [] });
  }
  for (const area of areas) {
    const cityName = cityOfArea(area) || "Unassigned";
    const row = rows.get(cityName);
    if (row) {
      // Areas narrow the city down, so it is no longer served fully.
      row.full = false;
      row.areas.push(area);
    } else {
      rows.set(cityName, {
        name: cityName,
        full: false,
        areas: [area],
      });
    }
  }

  const groups = new Map<string, CityRow[]>();
  for (const row of rows.values()) {
    const division = divisionOfCity(row.name);
    const list = groups.get(division) ?? [];
    list.push(row);
    groups.set(division, list);
  }

  return [...groups.entries()]
    .map(([division, list]) => ({
      division,
      cities: [...list].sort(
        (a, b) =>
          Number(b.full) - Number(a.full) || a.name.localeCompare(b.name)
      ),
    }))
    .sort((a, b) =>
      a.division === "Unassigned"
        ? 1
        : b.division === "Unassigned"
          ? -1
          : a.division.localeCompare(b.division)
    );
}

export default function ShippingMethodDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const methodId = params.id as string;
  const { can } = usePermissions();

  const [method, setMethod] = useState<ShippingMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const settings = useBusinessSettings();
  const coverage = settings?.deliveryCoverage ?? null;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchData<ShippingMethod>(
          `shipping-methods/${methodId}`,
        );
        setMethod(data);
      } catch (error) {
        console.error("Error fetching shipping method:", error);
        toast.error("Failed to load shipping method data");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [methodId, router]);

  if (isLoading) {
    return (
      <AdminPageContainer className="flex min-h-[60vh] items-center justify-center rounded-sm p-2 md:p-4">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading shipping method data...
          </p>
        </div>
      </AdminPageContainer>
    );
  }

  if (!method) {
    return (
      <AdminPageContainer>
        <div className="rounded-xl border bg-card p-10 text-center">
          <h2 className="text-xl font-semibold">Shipping method not found</h2>
          <p className="mt-2 text-muted-foreground">
            The requested shipping method could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/settings/shipping-method">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shipping Methods
            </Link>
          </Button>
        </div>
      </AdminPageContainer>
    );
  }

  const flags = (method.flags ?? []).map((flag) => ({
    label: flag.label,
    tone: SHIPPING_FLAG_TONE[flag.key] ?? ("neutral" as PillTone),
  }));

  const isFree = Number(method.cost) === 0;
  /** Minimum order subtotal required to use this method; null = none set. */
  const minimumOrder =
    method.minOrderAmount != null && Number(method.minOrderAmount) > 0
      ? Number(method.minOrderAmount)
      : null;
  const serviceCities = method.serviceAreas?.cities ?? [];
  const serviceAreas = method.serviceAreas?.areas ?? [];
  const mode = method.serviceAreas?.mode ?? "include";
  const isInclude = mode !== "exclude";
  const hasAreaLimit = serviceCities.length > 0 || serviceAreas.length > 0;
  const groups = hasAreaLimit ? groupServiceAreas(method, coverage) : [];
  const hasUnassigned = groups.some((group) => group.division === "Unassigned");

  const coveredCityCount = groups.reduce(
    (sum, group) => sum + group.cities.length,
    0
  );
  const flatCities = groups.flatMap((group) => group.cities);
  const fullyCityCount = flatCities.filter((city) => city.full).length;
  const areaOnlyCityCount = flatCities.filter((city) => !city.full).length;
  const divisionCount = groups.filter(
    (group) => group.division !== "Unassigned"
  ).length;
  const coverageValue = `${coveredCityCount} ${coveredCityCount === 1 ? "city" : "cities"} · ${serviceAreas.length} ${serviceAreas.length === 1 ? "area" : "areas"}`;

  const availabilityNote = !hasAreaLimit
    ? "No area limit is set — customers in every city and area of Delivery Coverage see this method."
    : isInclude
      ? `Offered only in the ${coveredCityCount} ${coveredCityCount === 1 ? "city" : "cities"} and ${serviceAreas.length} ${serviceAreas.length === 1 ? "area" : "areas"} below. Customers elsewhere will not see this method at checkout.`
      : `Hidden in the ${coveredCityCount} ${coveredCityCount === 1 ? "city" : "cities"} and ${serviceAreas.length} ${serviceAreas.length === 1 ? "area" : "areas"} below. Everywhere else this method stays available.`;

  return (
    <AdminPageContainer>
      <PageHeader
        title={method.name}
        description="Shipping method details, checkout behaviour and delivery coverage."
        className="mb-3"
        titleIcon={
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
            <Truck className="size-5" />
          </span>
        }
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/settings/shipping-method">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </Button>
        {can(MENU_URL, "canEdit") && (
          <Button size="sm" asChild>
            <Link href={`/admin/settings/shipping-method/${method.id}/edit`}>
              <Pencil className="size-4" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          </Button>
        )}
      </PageHeader>

      {/* Status + behaviour pills keep the method's identity visible */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <PillBadge tone={method.isActive ? "emerald" : "red"}>
          {method.isActive ? (
            <CheckCircle2 className="mr-1 size-3" />
          ) : (
            <XCircle className="mr-1 size-3" />
          )}
          {method.isActive ? "Active" : "Inactive"}
        </PillBadge>
        <PillBadge tone={isInclude ? "blue" : "amber"}>
          <MapPin className="mr-1 size-3" />
          {isInclude ? "Whitelist coverage" : "Blacklist coverage"}
        </PillBadge>
        {flags.map((flag) => (
          <PillBadge key={flag.label} tone={flag.tone}>
            {flag.label}
          </PillBadge>
        ))}
      </div>

      {/* Headline metrics */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard
          icon={Tag}
          title="Cost"
          value={isFree ? "Free" : `৳${money(method.cost)}`}
          description={isFree ? "No charge at checkout" : "Added to the order total"}
          bgColor={isFree ? "green" : "blue"}
        />
        <StatsCard
          icon={Clock}
          title="Delivery time"
          value={method.deliveryTime || "—"}
          description="Shown beside the method at checkout"
          bgColor="violet"
        />
        <StatsCard
          icon={Wallet}
          title="Minimum order"
          value={minimumOrder === null ? "None" : `৳${money(minimumOrder)}`}
          description={
            minimumOrder === null
              ? "Any cart total can use it"
              : "Cart subtotal required"
          }
          bgColor={minimumOrder === null ? "teal" : "amber"}
        />
        <StatsCard
          icon={MapPin}
          title="Coverage"
          value={
            !hasAreaLimit
              ? "Everywhere"
              : isInclude
                ? "Area limited"
                : "Except areas"
          }
          description={
            hasAreaLimit
              ? `${coverageValue}${isInclude ? " allowed" : " hidden"}`
              : "All Delivery Coverage areas"
          }
          bgColor={hasAreaLimit ? (isInclude ? "amber" : "red") : "green"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Service areas get the full page width — the coverage list needs the room */}
        <div className="lg:col-span-3">
          {/* Delivery area */}
          <SectionCard
            title="Delivery area"
            subtitle="Read from Delivery Coverage — grouped by division and city."
            icon={<MapPin className="size-4.5" />}
            action={
              can(COVERAGE_MENU_URL, "canView") ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/settings/delivery-coverage">
                    <ExternalLink className="size-4" />
                    <span className="hidden sm:inline">Delivery Coverage</span>
                  </Link>
                </Button>
              ) : null
            }
          >
            <div className="space-y-4">
              {/* Mode banner — what customers actually experience */}
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border p-3",
                  !hasAreaLimit
                    ? "border-emerald-600/20 bg-emerald-50 dark:bg-emerald-500/10"
                    : isInclude
                      ? "border-blue-600/20 bg-blue-50 dark:bg-blue-500/10"
                      : "border-amber-600/20 bg-amber-50 dark:bg-amber-500/10"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                    !hasAreaLimit
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : isInclude
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  )}
                >
                  {!hasAreaLimit ? (
                    <CheckCircle2 className="size-4" />
                  ) : isInclude ? (
                    <MapPin className="size-4" />
                  ) : (
                    <MapPinOff className="size-4" />
                  )}
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold">
                    {!hasAreaLimit
                      ? "Offered everywhere"
                      : isInclude
                        ? "Offered only in the selected areas"
                        : "Hidden in the selected areas"}
                  </p>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {availabilityNote}
                  </p>
                </div>
              </div>

              {hasUnassigned && (
                <p className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  <Ban className="size-3.5 shrink-0" />
                  Some saved names no longer exist in Delivery Coverage — they
                  are listed under “Unassigned”.
                </p>
              )}

              {!hasAreaLimit ? (
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-3 py-8 text-center">
                  <MapPin className="size-5 text-muted-foreground" />
                  <p className="text-sm font-medium">No area limit stored</p>
                  <p className="text-xs text-muted-foreground">
                    Tick cities or areas in the editor to narrow this method
                    down.
                  </p>
                </div>
              ) : (
                (() => {
                  const allCities = groups.flatMap((group) =>
                    group.cities.map((city) => ({
                      key: `${group.division}-${city.name}`,
                      city,
                    }))
                  );
                  return (
                    <Accordion
                      type="multiple"
                      defaultValue={allCities.slice(0, 1).map((c) => c.key)}
                    >
                      {allCities.map(({ key, city }) => (
                        <AccordionItem key={key} value={key}>
                          <AccordionTrigger className="px-0.5 py-3 hover:no-underline">
                            <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <Building2 className="size-4 text-muted-foreground" />
                              {city.name}
                            </span>
                            {city.full ? (
                              <PillBadge tone={isInclude ? "emerald" : "amber"}>
                                {isInclude
                                  ? "Fully served"
                                  : "Excluded"}
                              </PillBadge>
                            ) : (
                              <PillBadge tone={isInclude ? "blue" : "amber"}>
                                {isInclude
                                  ? `Only ${city.areas.length} ${
                                      city.areas.length === 1
                                        ? "area"
                                        : "areas"
                                    }`
                                  : `${city.areas.length} ${
                                      city.areas.length === 1
                                        ? "area"
                                        : "areas"
                                    } hidden`}
                              </PillBadge>
                            )}
                          </AccordionTrigger>
                          <AccordionContent className="pt-1">
                            {city.full || city.areas.length === 0 ? (
                              <p className="px-0.5 text-xs text-muted-foreground">
                                {city.full
                                  ? "Every area in this city is served."
                                  : "No specific areas stored."}
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {city.areas.map((area) => (
                                  <span
                                    key={area}
                                    className={cn(
                                      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-xs",
                                      isInclude
                                        ? "border-primaryColor/30 bg-primaryColor/6"
                                        : "border-amber-600/25 bg-amber-50 dark:bg-amber-500/10"
                                    )}
                                  >
                                    <MapPin className="size-3 shrink-0 text-muted-foreground" />
                                    <span className="truncate" title={area}>
                                      {area}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  );
                })()
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Checkout behaviour */}
          <SectionCard
            title="Checkout behaviour"
            subtitle="How this method is offered, paid for and discounted."
            icon={<CreditCard className="size-4.5" />}
          >
            <div className="grid gap-2.5 md:grid-cols-2">
              <BehaviourRow
                icon={<Truck className="size-4" />}
                label="Active"
                hint="Offered to customers at checkout"
                on={method.isActive}
                onLabel="Live"
                offLabel="Hidden"
              />
              <BehaviourRow
                icon={<CreditCard className="size-4" />}
                label="Online payment only"
                hint="Cash on delivery is rejected for this method"
                on={method.requiresOnlinePayment}
                onLabel="Required"
                offLabel="Allowed"
              />
              <BehaviourRow
                icon={<Ban className="size-4" />}
                label="Excluded from free delivery"
                hint="Campaigns never waive this method's cost"
                on={method.isExcludedFromFreeDelivery}
                onLabel="Excluded"
                offLabel="Included"
              />
              <BehaviourRow
                icon={<PackageCheck className="size-4" />}
                label="Store pickup"
                hint="Customer collects the order — no shipping involved"
                on={method.isPickup}
                onLabel="Pickup"
                offLabel="Delivered"
              />
            </div>
          </SectionCard>

          {/* Description */}
          <SectionCard
            title="Description"
            subtitle="The note shoppers read beside the method at checkout."
            icon={<MessageSquareText className="size-4.5" />}
          >
            {method.description ? (
              <p className="text-sm leading-relaxed wrap-break-word text-foreground/90">
                {method.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No description was added for this method.
              </p>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          {/* Identity + audit trail — the headline cards already carry the numbers */}
          <SectionCard
            title="Method record"
            subtitle="Name, code and who last changed it."
            icon={<Tag className="size-4.5" />}
          >
            <div className="space-y-0">
              <FactRow label="Name">{method.name}</FactRow>
              <FactRow label="Code">
                <span className="font-mono text-xs">#{method.id}</span>
              </FactRow>
              <FactRow label="Status">
                <PillBadge tone={method.isActive ? "emerald" : "red"}>
                  {method.isActive ? "Active" : "Inactive"}
                </PillBadge>
              </FactRow>
              <FactRow label="Display order">
                <span className="tabular-nums">{method.displayOrder}</span>
              </FactRow>
              <FactRow label="Flags">
                {flags.length > 0 ? (
                  <span className="inline-flex flex-wrap justify-end gap-1">
                    {flags.map((flag) => (
                      <PillBadge key={flag.label} tone={flag.tone}>
                        {flag.label}
                      </PillBadge>
                    ))}
                  </span>
                ) : (
                  "—"
                )}
              </FactRow>
            </div>

            <div className="mt-3 space-y-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <User className="size-3.5" />
                  Created
                </p>
                <p className="text-sm font-medium">
                  {method.createdBy?.name || "—"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateTime(method.createdAt)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <User className="size-3.5" />
                  Last updated
                </p>
                <p className="text-sm font-medium">
                  {method.updatedBy?.name || "—"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateTime(method.updatedAt)}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Coverage breakdown — the numbers behind the area list */}
          <SectionCard
            title="Coverage breakdown"
            subtitle={
              hasAreaLimit
                ? isInclude
                  ? "Whitelist — counted from the saved selection."
                  : "Blacklist — counted from the saved exclusions."
                : "No limit is stored for this method."
            }
            icon={<Landmark className="size-4.5" />}
          >
            {hasAreaLimit ? (
              <div className="space-y-0">
                <FactRow label="Divisions">
                  <span className="tabular-nums">{divisionCount}</span>
                </FactRow>
                <FactRow
                  label={isInclude ? "Fully served cities" : "Fully hidden cities"}
                >
                  <span className="tabular-nums">{fullyCityCount}</span>
                </FactRow>
                <FactRow
                  label={isInclude ? "Area-only cities" : "Partly hidden cities"}
                >
                  <span className="tabular-nums">{areaOnlyCityCount}</span>
                </FactRow>
                <FactRow label={isInclude ? "Areas allowed" : "Areas hidden"}>
                  <span className="tabular-nums">{serviceAreas.length}</span>
                </FactRow>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Offered everywhere — tick cities or areas in the editor to
                narrow this method down.
              </p>
            )}
          </SectionCard>
        </div>
      </div>
    </AdminPageContainer>
  );
}
