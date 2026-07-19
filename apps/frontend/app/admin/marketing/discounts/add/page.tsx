"use client";

import { DiscountForm } from "@/components/admin/discount/discount-from";
import { fetchData } from "@/utils/api-utils";
import type { Product } from "@/utils/types";
import { useEffect, useState } from "react";

export default function AddDiscountPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = async () => {
    try {
      const response = await fetchData<Product[]>("products?limit=100");
      if (Array.isArray(response)) {
        setProducts(response);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="md:p-6 p:2 space-y-6">
      <DiscountForm mode="create" initialProducts={products} />
    </div>
  );
}
