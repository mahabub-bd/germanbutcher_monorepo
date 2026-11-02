"use client";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { ShippingMethodForm } from "@/components/admin/shipping-method/shipping-method-form";
import { PillBadge } from "@/components/common/pill-badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddShippingMethodPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Shipping method created successfully");
    router.push("/admin/settings/shipping-method");
  };

  const handleCancel = () => {
    router.push("/admin/settings/shipping-method");
  };

  return (
    <AdminPageContainer>
      <FormPageHeader
        title="New shipping method"
        description="Enter the details for the new shipping method."
        backHref="/admin/settings/shipping-method"
        backLabel="Back to Shipping Methods"
      >
        {/* The defaults the form below starts from */}
        <PillBadge tone="emerald">Active by default</PillBadge>
        <PillBadge tone="blue">Offered everywhere</PillBadge>
      </FormPageHeader>

      <ShippingMethodForm
        mode="create"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </AdminPageContainer>
  );
}
