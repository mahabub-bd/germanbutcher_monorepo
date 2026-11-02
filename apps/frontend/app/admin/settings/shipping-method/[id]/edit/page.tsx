"use client";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { ShippingMethodForm } from "@/components/admin/shipping-method/shipping-method-form";
import { PillBadge, type PillTone } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import { fetchData } from "@/utils/api-utils";
import type { ShippingMethod } from "@/utils/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/** Backend sends semantic flag keys; the admin UI owns the colour. */
const SHIPPING_FLAG_TONE: Record<string, PillTone> = {
  pickup: "violet",
  online_payment: "sky",
  no_free_delivery: "amber",
  area_limited: "blue",
};

/** Amounts keep their decimals when present (60.5 is not 60). */
const money = (value: number | string) =>
  Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export default function EditShippingMethodPage() {
  const router = useRouter();
  const params = useParams();
  const methodId = params.id as string;

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShippingMethodData = async () => {
      try {
        const methodData = await fetchData<ShippingMethod>(
          `shipping-methods/${methodId}`
        );
        setShippingMethod(methodData);
      } catch (error) {
        console.error("Error fetching shipping method:", error);
        toast.error("Failed to load shipping method data");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchShippingMethodData();
  }, [methodId, router]);

  const handleSuccess = () => {
    toast.success("Shipping method updated successfully");
    router.push("/admin/settings/shipping-method");
  };

  const handleCancel = () => {
    router.push("/admin/settings/shipping-method");
  };

  if (isLoading) {
    return (
      <AdminPageContainer className="md:p-4 p-2 space-y-6 rounded-sm flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading shipping method data...
          </p>
        </div>
      </AdminPageContainer>
    );
  }

  if (!shippingMethod) {
    return (
      <AdminPageContainer>
        <div className="rounded-xl border bg-card p-10 text-center">
          <h2 className="text-xl font-semibold">Shipping method not found</h2>
          <p className="mt-2 text-muted-foreground">
            The requested shipping method could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/settings/shipping-method">
              Back to Shipping Methods
            </Link>
          </Button>
        </div>
      </AdminPageContainer>
    );
  }

  const flags = (shippingMethod.flags ?? []).map((flag) => ({
    label: flag.label,
    tone: SHIPPING_FLAG_TONE[flag.key] ?? ("neutral" as PillTone),
  }));
  const isFree = Number(shippingMethod.cost) === 0;
  const minimumOrder =
    shippingMethod.minOrderAmount != null &&
      Number(shippingMethod.minOrderAmount) > 0
      ? Number(shippingMethod.minOrderAmount)
      : null;

  return (
    <AdminPageContainer>
      <FormPageHeader
        title={`Edit — ${shippingMethod.name}`}
        backHref="/admin/settings/shipping-method"
        backLabel="Back to Shipping Methods"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <PillBadge tone={shippingMethod.isActive ? "emerald" : "red"}>
            {shippingMethod.isActive ? "Active" : "Inactive"}
          </PillBadge>
          <PillBadge tone={isFree ? "emerald" : "neutral"}>
            {isFree ? "Free" : `৳${money(shippingMethod.cost)}`}
          </PillBadge>
          <PillBadge tone={minimumOrder === null ? "neutral" : "amber"}>
            {minimumOrder === null
              ? "No minimum"
              : `Min ৳${money(minimumOrder)}`}
          </PillBadge>
          {shippingMethod.deliveryTime && (
            <PillBadge tone="neutral">{shippingMethod.deliveryTime}</PillBadge>
          )}
          {flags.map((flag) => (
            <PillBadge key={flag.label} tone={flag.tone}>
              {flag.label}
            </PillBadge>
          ))}
        </div>
      </FormPageHeader>

      <ShippingMethodForm
        mode="edit"
        shippingMethod={shippingMethod}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </AdminPageContainer>
  );
}
