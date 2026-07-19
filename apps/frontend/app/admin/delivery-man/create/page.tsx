"use client";

import { DeliveryManForm } from "@/components/admin/delivery-man/delivery-man-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateDeliveryManPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/delivery-man");
  };

  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Create New Delivery Man</CardTitle>
            <CardDescription>Add a new delivery person to the system.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/delivery-man")}>
            Cancel
          </Button>
        </div>
      </div>

      <DeliveryManForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
