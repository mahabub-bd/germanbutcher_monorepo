"use client";

import { BrandForm } from "@/components/admin/brand/brand-form";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { Brand } from "@/utils/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditBrandPage() {
  const params = useParams();
  const brandId = params.id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBrand = async () => {
    try {
      const response = await fetchData<Brand>(`brands/${brandId}`);
      setBrand(response);
    } catch (error) {
      console.error("Error fetching brand:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, [brandId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Brand" />;
  }

  if (!brand) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Brand not found</p>
      </div>
    );
  }

  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Edit Brand</CardTitle>
            <CardDescription>Update the brand information.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/brand/brand-list">Back to Brands</Link>
          </Button>
        </div>
      </div>

      <BrandForm mode="edit" brand={brand} />
    </div>
  );
}
