"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { UnitForm } from "@/components/admin/products/units/unit-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import { Unit } from "@/utils/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditUnitPage() {
  const router = useRouter();
  const params = useParams();
  const unitId = params.id as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        const unitData = await fetchData<Unit>(`units/${unitId}`);
        setUnit(unitData);
      } catch (error) {
        console.error("Error fetching unit:", error);
        toast.error("Failed to load unit data");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnitData();
  }, [unitId, router]);

  const handleSuccess = () => {
    toast.success("Unit updated successfully");
    router.back();
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading unit data..." />;
  }

  if (!unit) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Unit not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested unit could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/products/units">Back to Units</Link>
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
            <CardTitle>Unit Information</CardTitle>
            <CardDescription>Update the unit details.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/products/units">Back to Units</Link>
          </Button>
        </div>
      </div>

      <UnitForm mode="edit" unit={unit} onSuccess={handleSuccess} />
    </div>
  );
}
