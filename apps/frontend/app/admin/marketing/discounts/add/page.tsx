"use client";

import { DiscountForm } from "@/components/admin/discount/discount-from";
import { fetchData, fetchDataPagination } from "@/utils/api-utils";
import type { Category, MinimalProduct } from "@/utils/types";
import { useEffect, useState } from "react";

export default function AddDiscountPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [products, setProducts] = useState<MinimalProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchDataPagination<{
          data: Category[];
        }>("categories");
        if (Array.isArray(response.data)) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) return;

    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const fetched = await fetchData<MinimalProduct[]>(
          `products/all?category=${selectedCategoryId}&isActive=true`
        );
        if (Array.isArray(fetched)) {
          // Merge by id so selections survive switching between categories
          setProducts((prev) => {
            const byId = new Map(prev.map((p) => [p.id, p]));
            fetched.forEach((p) => byId.set(p.id, p));
            return [...byId.values()].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
          });
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedCategoryId]);

  return (
    <div className="md:p-6 p:2 space-y-6">
      <DiscountForm
        mode="create"
        initialProducts={products}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        isLoadingProducts={isLoadingProducts}
      />
    </div>
  );
}
