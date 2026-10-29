"use client";

import { PaymentForm } from "@/components/admin/payment/payment-form";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { Purchase } from "@/utils/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddPaymentPage() {
  const params = useParams();
  const purchaseId = params.id as string;
  const [purchase, setPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const data = await fetchData<Purchase>(`purchases/${purchaseId}`);
        setPurchase(data);
      } catch (error) {
        console.error("Error fetching purchase:", error);
      }
    };

    fetchPurchase();
  }, [purchaseId]);

  if (!purchase) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  const maxAmount =
    parseFloat(purchase.totalValue) - parseFloat(purchase.amountPaid);

  return (
    <AdminPageContainer>
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Payment</CardTitle>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/procurement/purchases/${purchaseId}/payments`}>
              Back to Payments
            </Link>
          </Button>
        </div>
      <div>
        <PaymentForm purchaseId={parseInt(purchaseId)} maxAmount={maxAmount} />
      </div>
    </AdminPageContainer>
  );
}
