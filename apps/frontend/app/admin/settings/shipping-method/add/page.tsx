"use client";

import { ShippingMethodForm } from "@/components/admin/shipping-method/shipping-method-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddShippingMethodPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Shipping method created successfully");
    router.back();
  };

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <FormPageHeader
        title="Shipping Method Information"
        description="Enter the details for the new shipping method."
        backHref="/admin/settings/shipping-method"
        backLabel="Back to Shipping Methods"
      />

      <ShippingMethodForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
