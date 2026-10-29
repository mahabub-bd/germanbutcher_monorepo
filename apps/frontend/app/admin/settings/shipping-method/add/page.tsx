"use client";

import { ShippingMethodForm } from "@/components/admin/shipping-method/shipping-method-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddShippingMethodPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Shipping method created successfully");
    router.back();
  };

  return (
    <AdminPageContainer>
        <FormPageHeader
        title="Shipping Method Information"
        description="Enter the details for the new shipping method."
        backHref="/admin/settings/shipping-method"
        backLabel="Back to Shipping Methods"
      />

      <ShippingMethodForm mode="create" onSuccess={handleSuccess} />
    </AdminPageContainer>
  );
}
