"use client";

import { Button } from "@/components/ui/button";
import { fetchData } from "@/utils/api-utils";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";
import { Payment, Purchase } from "@/utils/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentsTable } from "./payment-table";

export default function PaymentsListPage() {
  const params = useParams();
  const purchaseId = params.id as string;
  const [purchase, setPurchase] = useState<
    (Purchase & { payments: Payment[] }) | null
  >(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataSequentially = async () => {
      try {
        setLoading(true);

        const purchaseData = await fetchData<
          Purchase & { payments: Payment[] }
        >(`purchases/${purchaseId}`);
        setPurchase(purchaseData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataSequentially();
  }, [purchaseId]);

  if (loading) {
    return <LoadingIndicator message="Loading Paymet" />;
  }

  if (!purchase) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Purchase not found</p>
      </div>
    );
  }

  const remainingAmount =
    parseFloat(purchase.totalValue) - parseFloat(purchase.amountPaid);

  return (
    <div className="w-full md:p-6 p-2 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <PageHeader
            title={`Payments for Purchase # ${purchase.purchaseNumber}`}
            description={` Total: ${purchase.totalValue} | Paid: ${
              purchase.amountPaid
            } |
              Remaining: ${remainingAmount.toFixed(2)}`}
          />

          {remainingAmount > 0 && (
            <Button asChild>
              <Link href={`/admin/purchase/${purchaseId}/payment`}>
                <Plus className="mr-2 h-4 w-4" /> Add Payment
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="md:p-6 p-2">
        <PaymentsTable payments={purchase?.payments} />
      </div>
    </div>
  );
}
