"use client";

import { ShippingMethodForm } from "@/components/admin/shipping-method/shipping-method-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { ShippingMethod } from "@/utils/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditShippingMethodPage() {
  const router = useRouter();
  const params = useParams();
  const methodId = params.id as string;

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShippingMethodData = async () => {
      try {
        const methodData = await fetchData<ShippingMethod>(
          `shipping-methods/${methodId}`
        );
        setShippingMethod(methodData);
      } catch (error) {
        console.error("Error fetching shipping method:", error);
        toast.error("Failed to load shipping method data");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchShippingMethodData();
  }, [methodId, router]);

  const handleSuccess = () => {
    toast.success("Shipping method updated successfully");
    router.back();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading shipping method data...
          </p>
        </div>
      </div>
    );
  }

  if (!shippingMethod) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Shipping method not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested shipping method could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/shipping/method/list">
              Back to Shipping Methods
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Shipping Method Information</CardTitle>
            <CardDescription>
              Update the shipping method details.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/settings/shipping-method">
              Back to Shipping Methods
            </Link>
          </Button>
        </div>
      </div>

      <ShippingMethodForm
        mode="edit"
        shippingMethod={shippingMethod}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
