"use client";

import { DeliveryManForm } from "@/components/admin/delivery-man/delivery-man-form";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { fetchProtectedData } from "@/utils/api-utils";
import type { DeliveryMan } from "@/utils/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function EditDeliveryManPage() {
  const router = useRouter();
  const params = useParams();
  const deliveryManId = params.id as string;

  const [deliveryMan, setDeliveryMan] = useState<DeliveryMan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveryManData = async () => {
      try {
        const deliveryManData = await fetchProtectedData<DeliveryMan>(
          `delivery-man/${deliveryManId}`
        );
        setDeliveryMan(deliveryManData);
      } catch (error) {
        console.error("Error fetching delivery man:", error);
        toast.error("Failed to load delivery man data");
        router.push("/admin/delivery-man");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveryManData();
  }, [deliveryManId, router]);

  const handleSuccess = () => {
    toast.success("Delivery man updated successfully");
    router.push("/admin/delivery-man");
  };

  if (isLoading) {
    return (
      <AdminPageContainer className="md:p-4 p-2 space-y-6 rounded-sm flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading delivery man data...</p>
        </div>
      </AdminPageContainer>
    );
  }

  if (!deliveryMan) {
    return (
      <AdminPageContainer>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Delivery man not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested delivery man could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/delivery-man">Back to Delivery Men</Link>
          </Button>
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Delivery Man Information</CardTitle>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/delivery-man">Back to Delivery Men</Link>
          </Button>
        </div>

      <DeliveryManForm
        mode="edit"
        deliveryMan={deliveryMan}
        onSuccess={handleSuccess}
      />
    </AdminPageContainer>
  );
}
