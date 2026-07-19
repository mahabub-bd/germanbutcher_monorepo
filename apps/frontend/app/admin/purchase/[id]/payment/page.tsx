"use client";

import { PaymentForm } from "@/components/admin/payment/payment-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { Purchase } from "@/utils/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Payment</CardTitle>
            <CardDescription>
              Record a payment for purchase #{purchase.purchaseNumber}
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/purchase/${purchaseId}/payments`}>
              Back to Payments
            </Link>
          </Button>
        </div>
      </div>
      <div>
        <PaymentForm purchaseId={parseInt(purchaseId)} maxAmount={maxAmount} />
      </div>
    </div>
  );
}
