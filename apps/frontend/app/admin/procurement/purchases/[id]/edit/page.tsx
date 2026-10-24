"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PurchaseForm } from "@/components/admin/procurement/purchases/purchase-form";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { fetchProtectedData } from "@/utils/api-utils";

import type { Purchase } from "@/utils/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditPurchasePage() {
  const params = useParams();
  const purchaseId = params.id as string;

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPurchase = async () => {
    try {
      const response = await fetchProtectedData<Purchase>(
        `purchases/${purchaseId}`
      );
      setPurchase(response);
    } catch (error) {
      console.error("Error fetching purchase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchase();
  }, [purchaseId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Purchase" />;
  }

  if (!purchase) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Purchase not found</p>
      </div>
    );
  }

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Edit Purchase</CardTitle>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/procurement/purchases/purchases-list">Back to Purchases</Link>
          </Button>
        </div>

      <PurchaseForm mode="edit" purchase={purchase} />
    </div>
  );
}
