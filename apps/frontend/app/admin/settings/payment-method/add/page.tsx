"use client";

import { PaymentMethodForm } from "@/components/admin/payment-method/payment-method-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddPaymentMethodPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Payment method created successfully");
    router.back();
  };

  return (
    <AdminPageContainer>
        <FormPageHeader
        title="Payment Method Information"
        description="Enter the details for the new payment method."
        backHref="/admin/settings/payment-method"
        backLabel="Back to Payment Methods"
      />

      <PaymentMethodForm mode="create" onSuccess={handleSuccess} />
    </AdminPageContainer>
  );
}
