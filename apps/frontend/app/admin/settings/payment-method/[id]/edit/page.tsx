"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PaymentMethodForm } from "@/components/admin/payment-method/payment-method-form";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
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
    toast.success("Payment method updated successfully");
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Payment Method Information</CardTitle>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/settings/payment-method">
              Back to Payment Methods
            </Link>
          </Button>
        </div>

      <PaymentMethodForm
        mode="edit"
        paymentMethod={paymentMethod}
        onSuccess={handleSuccess}
      />
    </AdminPageContainer>
  );
}
