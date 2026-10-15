"use client";

import { UnitForm } from "@/components/admin/products/units/unit-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddUnitPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Unit created successfully");
    router.back();
  };

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <FormPageHeader
        title="Unit Information"
        description="Enter the details for the new measurement unit."
        backHref="/admin/products/units"
        backLabel="Back to Units"
      />

      <UnitForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
