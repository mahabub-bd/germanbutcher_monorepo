"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { ShopForm } from "@/components/admin/sales-point-shop/shop-form";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { Shop } from "@/utils/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditShopPage() {
  const params = useParams();
  const shopId = params.id as string;
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShop = async () => {
    try {
      const response = await fetchData<Shop>(`sales-point-shops/${shopId}`);
      setShop(response);
    } catch (error) {
      console.error("Error fetching shop:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, [shopId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Shop" />;
  }

  if (!shop) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Shop not found</p>
      </div>
    );
  }

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <div className="flex justify-between items-center">
        <div>
          <CardTitle>Edit Shop</CardTitle>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/sales-point-shop/sales-point-shop-list">
            Back to Shops
          </Link>
        </Button>
      </div>
      <ShopForm mode="edit" shop={shop} />
    </div>
  );
}
