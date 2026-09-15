"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import OrderView from "@/components/admin/orders/order-view";
import { fetchProtectedData } from "@/utils/api-utils";
import { listSlugToRoute } from "@/utils/order-list-routes";
import { Order } from "@/utils/types";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface OrderNeighbors {
  prevId: number | null;
  nextId: number | null;
}

function OrderPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [neighbors, setNeighbors] = useState<OrderNeighbors | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // The list page (order-list.tsx) appends its route/page/filters to detail
  // links. "Back to Order List" rebuilds that URL so the user returns to the
  // exact page they left, instead of always landing on page 1.
  const buildListUrl = () => {
    const listSlug = searchParams.get("from");
    const from = listSlug ? listSlugToRoute(listSlug) : "/admin/orders";
    const restore = new URLSearchParams();
    const page = searchParams.get("page");
    const search = searchParams.get("search");
    const status = searchParams.get("orderStatus");
    if (page) restore.set("page", page);
    if (search) restore.set("search", search);
    if (status && status !== "all") restore.set("orderStatus", status);
    const qs = restore.toString();
    return qs ? `${from}?${qs}` : from;
  };

  // Prev/next navigation keeps the list context so Back still works
  // after stepping through orders.
  const buildOrderUrl = (id: number) => {
    const qs = searchParams.toString();
    return qs ? `/admin/order/${id}/view?${qs}` : `/admin/order/${id}/view`;
  };

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const [response, neighborData] = await Promise.all([
        fetchProtectedData<Order>(`orders/${orderId}`),
        fetchProtectedData<OrderNeighbors>(
          `orders/${orderId}/neighbors`
        ).catch((error) => {
          console.error("Error fetching neighbor orders:", error);
          return null;
        }),
      ]);
      setOrder(response);
      setNeighbors(neighborData);
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
    return <LoadingIndicator message="Loading Order..." />;
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

  const prevId = neighbors?.prevId;
  const nextId = neighbors?.nextId;

  return (
    <OrderView
      order={order}
      onBack={() => router.push(buildListUrl())}
      onPrevOrder={
        prevId ? () => router.push(buildOrderUrl(prevId)) : undefined
      }
      onNextOrder={
        nextId ? () => router.push(buildOrderUrl(nextId)) : undefined
      }
    />
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<LoadingIndicator message="Loading Order..." />}>
      <OrderPageContent />
    </Suspense>
  );
}
