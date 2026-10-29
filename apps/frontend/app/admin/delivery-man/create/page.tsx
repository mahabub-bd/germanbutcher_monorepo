"use client";

import { DeliveryManForm } from "@/components/admin/delivery-man/delivery-man-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { useRouter } from "next/navigation";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function CreateDeliveryManPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/delivery-man");
  };

  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Create New Delivery Man"
        description="Add a new delivery person to the system."
        backHref="/admin/delivery-man"
        backLabel="Back to Delivery Man"
      />

      <DeliveryManForm mode="create" onSuccess={handleSuccess} />
    </AdminPageContainer>
  );
}
