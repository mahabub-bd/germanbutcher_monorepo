"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { SupplierForm } from "@/components/admin/supplier/supplier-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchProtectedData } from "@/utils/api-utils";
import { Supplier } from "@/utils/types";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditSupplierPage() {
  const params = useParams();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSupplier = async () => {
    try {
      const response = await fetchProtectedData<Supplier>(
        `suppliers/${supplierId}`
      );
      setSupplier(response);
    } catch (error) {
      console.error("Error fetching supplier:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Supplier" />;
  }
  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Supplier not found</p>
      </div>
    );
  }

  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Edit Supplier</CardTitle>
            <CardDescription>Update the supplier information.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/supplier/supplier-list">Back to Suppliers</Link>
          </Button>
        </div>
      </div>

      <SupplierForm mode="edit" supplier={supplier} />
    </div>
  );
}
