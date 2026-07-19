"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { OrderForm } from "@/components/admin/orders/order-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchProtectedData } from "@/utils/api-utils";
import type { Order } from "@/utils/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditOrderPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const response = await fetchProtectedData<Order>(`orders/${orderId}`);
      setOrder(response);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Order Details..." />;
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Edit Order</CardTitle>
            <CardDescription>Update the order information.</CardDescription>
          </div>
          <Button variant="default" asChild>
            <Link href={`/admin/orders`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
              Back To Orders
            </Link>
          </Button>
        </div>
      </div>

      <OrderForm order={order} />
    </div>
  );
}
