"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { OrderForm } from "@/components/admin/orders/order-form";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { fetchProtectedData } from "@/utils/api-utils";
import type { Order } from "@/utils/types";
import { List } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

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
    <AdminPageContainer>
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Update Order</CardTitle>
          </div>
          <Button className="bg-primaryColor text-white hover:bg-primaryColor/90" asChild>
            <Link href={`/admin/orders`}>
              <List className="h-4 w-4" />
              <span className="sr-only">Back</span>
              Back To Orders
            </Link>
          </Button>
        </div>

      <OrderForm order={order} />
    </AdminPageContainer>
  );
}
