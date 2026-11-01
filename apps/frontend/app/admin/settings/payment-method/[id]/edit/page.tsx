"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PaymentMethodForm } from "@/components/admin/payment-method/payment-method-form";
import { Button } from "@/components/ui/button";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { fetchData } from "@/utils/api-utils";
import type { PaymentMethod } from "@/utils/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function EditPaymentMethodPage() {
  const router = useRouter();
  const params = useParams();
  const methodId = params.id as string;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentMethodData = async () => {
      try {
        const methodData = await fetchData<PaymentMethod>(
          `order-payment-methods/${methodId}`
        );
        setPaymentMethod(methodData);
      } catch (error) {
        console.error("Error fetching payment method:", error);
        toast.error("Failed to load payment method data");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethodData();
  }, [methodId, router]);

  const handleSuccess = () => {
    router.back();
  };

  if (isLoading) {
    return <LoadingIndicator message=" Loading payment method data..." />;
  }

  if (!paymentMethod) {
    return (
      <AdminPageContainer>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Payment method not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested payment method could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/payment/method/list">
              Back to Payment Methods
            </Link>
          </Button>
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Payment method information"
        description="Update the details for this payment method."
        backHref="/admin/settings/payment-method"
        backLabel="Back to Payment Methods"
      />

      <PaymentMethodForm
        mode="edit"
        paymentMethod={paymentMethod}
        onSuccess={handleSuccess}
      />
    </AdminPageContainer>
  );
}
