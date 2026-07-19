"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import OrderView from "@/components/admin/orders/order-view";
import { fetchProtectedData } from "@/utils/api-utils";
import { Order } from "@/utils/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrderPage() {
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
    return <LoadingIndicator message="Laoding Order..." />;
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Order Not Found</h2>
        </div>
      </div>
    );
  }

  return <OrderView order={order} />;
}
