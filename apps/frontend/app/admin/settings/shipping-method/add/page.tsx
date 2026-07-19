"use client";

import { ShippingMethodForm } from "@/components/admin/shipping-method/shipping-method-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddShippingMethodPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Shipping method created successfully");
    router.back();
  };

  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Shipping Method Information</CardTitle>
            <CardDescription>
              Enter the details for the new shipping method.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/settings/shipping-method">
              Back to Shipping Methods
            </Link>
          </Button>
        </div>
      </div>

      <ShippingMethodForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
