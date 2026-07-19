"use client";

import { PaymentMethodForm } from "@/components/admin/payment-method/payment-method-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddPaymentMethodPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Payment method created successfully");
    router.back();
  };

  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Payment Method Information</CardTitle>
            <CardDescription>
              Enter the details for the new payment method.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/settings/payment-method">
              Back to Payment Methods
            </Link>
          </Button>
        </div>
      </div>

      <PaymentMethodForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
