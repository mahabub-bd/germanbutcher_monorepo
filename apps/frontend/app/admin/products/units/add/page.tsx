"use client";

import { UnitForm } from "@/components/admin/products/units/unit-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddUnitPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Unit created successfully");
    router.back();
  };

  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Unit Information</CardTitle>
            <CardDescription>
              Enter the details for the new measurement unit.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/products/units">Back to Units</Link>
          </Button>
        </div>
      </div>

      <UnitForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
