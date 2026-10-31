"use client";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { PageHeader } from "@/components/admin/page-header";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PillBadge, type PillTone } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import {
  getAreaPricing,
  getCityPricing,
  normalizeLocationName,
  type AreaPricing,
} from "@/lib/delivery-coverage";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { cn, formatDateTime } from "@/lib/utils";
import { fetchData } from "@/utils/api-utils";
import type { ShippingMethod } from "@/utils/types";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

const MENU_URL = "/admin/settings/shipping-method";

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

/** "৳60 · min ৳500 · 24-48 hours" line under a service-area pill — hidden
 *  when the location has none of the three configured. */
function PricingLine({ pricing }: { pricing: AreaPricing | null }) {
  if (!pricing) return null;
  const parts: string[] = [];
  if (pricing.deliveryCharge != null)
    parts.push(`Fee ৳${pricing.deliveryCharge}`);
  if (pricing.minOrderAmount != null)
    parts.push(`Min ৳${pricing.minOrderAmount}`);
  if (pricing.deliveryTime) parts.push(pricing.deliveryTime);
  if (parts.length === 0) return null;
  return (
    <span className="text-[10px] tabular-nums text-muted-foreground">
      {parts.join(" · ")}
    </span>
  );
}

/** A bordered card with a consistent header used across the detail page. */
function SectionCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
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
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** Label-above-value detail cell. */
function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">
        {children}
      </div>
    </div>
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

  /** Resolved fee/min/delivery-time for a service-area name. Area names
   *  repeat across cities, so the area's own coverage entry supplies the
   *  city context. */
  const areaPricingFor = (areaName: string): AreaPricing | null => {
    if (!coverage) return null;
    const areaKey = normalizeLocationName(areaName);
    const entry = coverage.areas.find(
      (a) => a.enabled && normalizeLocationName(a.name) === areaKey
    );
    return getAreaPricing(coverage, areaName, entry?.city);
  };

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
  const cities = method.serviceAreas?.cities ?? [];
  const areas = method.serviceAreas?.areas ?? [];
  const mode = method.serviceAreas?.mode ?? "include";
  const hasAreaLimit = cities.length > 0 || areas.length > 0;

  return (
    <AdminPageContainer>
      <PageHeader
        title={method.name}
        description="Shipping method details and checkout behaviour."
        titleIcon={<Truck className="h-5 w-5 text-primaryColor" />}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Overview */}
          <SectionCard
            title="Overview"
            subtitle="Core settings offered at checkout."
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <DetailItem label="Cost">
                <span className="tabular-nums">৳{money(method.cost)}</span>
                {isFree && (
                  <PillBadge tone="emerald" className="ml-2">
                    Free
                  </PillBadge>
                )}
              </DetailItem>
              <DetailItem label="Delivery time">
                {method.deliveryTime || "—"}
              </DetailItem>
              <DetailItem label="Display order">
                <span className="tabular-nums">{method.displayOrder}</span>
              </DetailItem>
              <DetailItem label="Status">
                {method.isActive ? (
                  <PillBadge tone="emerald">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                  </PillBadge>
                ) : (
                  <PillBadge tone="red">
                    <XCircle className="mr-1 h-3 w-3" /> Inactive
                  </PillBadge>
                )}
              </DetailItem>
              <div className="col-span-2">
                <DetailItem label="Flags">
                  {flags.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1">
                      {flags.map((flag) => (
                        <PillBadge key={flag.label} tone={flag.tone}>
                          {flag.label}
                        </PillBadge>
                      ))}
                    </div>
                  )}
                </DetailItem>
              </div>
            </div>
          </SectionCard>

          {/* Service areas */}
          <SectionCard
            title="Service areas"
            subtitle="Where this method is offered."
          >
            {!hasAreaLimit ? (
              <p className="text-sm text-muted-foreground">
                Offered everywhere — no area limit is set.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">Availability:</span>{" "}
                  <span className="font-medium">
                    {mode === "exclude"
                      ? "Everywhere except the areas below"
                      : "Only the areas below"}
                  </span>
                </p>
                {cities.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      Cities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cities.map((city) => (
                        <div key={city} className="flex flex-col items-start gap-0.5">
                          <PillBadge tone="blue">{city}</PillBadge>
                          <PricingLine
                            pricing={getCityPricing(coverage, city)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {areas.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      Areas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {areas.map((area) => (
                        <div key={area} className="flex flex-col items-start gap-0.5">
                          <PillBadge tone="neutral">{area}</PillBadge>
                          <PricingLine pricing={areaPricingFor(area)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Description */}
          <SectionCard title="Description">
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
          {/* Snapshot */}
          <SectionCard title="Summary">
            <div className="space-y-4">
              <DetailItem label="Name">{method.name}</DetailItem>
              <DetailItem label="Code / ID">
                <span className="font-mono text-xs">#{method.id}</span>
              </DetailItem>
              <DetailItem label="Checkout cost">
                {isFree ? (
                  <PillBadge tone="emerald">Free delivery</PillBadge>
                ) : (
                  <span className="tabular-nums">৳{money(method.cost)}</span>
                )}
              </DetailItem>
            </div>
          </SectionCard>

          {/* Audit */}
          <SectionCard title="Record" subtitle="Created and last updated.">
            <div className="space-y-4">
              <DetailItem label="Created by">
                {method.createdBy?.name || "—"}
              </DetailItem>
              <DetailItem label="Created on">
                <span className="font-normal text-muted-foreground">
                  {formatDateTime(method.createdAt)}
                </span>
              </DetailItem>
              <div className="border-t pt-4">
                <DetailItem label="Updated by">
                  {method.updatedBy?.name || "—"}
                </DetailItem>
              </div>
              <DetailItem label="Updated on">
                <span className="font-normal text-muted-foreground">
                  {formatDateTime(method.updatedAt)}
                </span>
              </DetailItem>
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminPageContainer>
  );
}
