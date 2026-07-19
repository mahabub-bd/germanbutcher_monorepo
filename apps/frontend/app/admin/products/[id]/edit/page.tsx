"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { ProductForm } from "@/components/admin/products/product-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { Brand, Category, Product } from "@/utils/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBrands = async () => {
    try {
      const response = await fetchData<Brand[]>("brands");
      if (Array.isArray(response)) {
        setBrands(response);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetchData<Category[]>("categories");
      if (Array.isArray(response)) {
        setCategories(response);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await fetchData<Product>(`products/${productId}`);
      setProduct(response);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchBrands(), fetchCategories(), fetchProduct()]);
      setIsLoading(false);
    };
    loadData();
  }, [productId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Product" />;
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Product not found</p>
      </div>
    );
  }

  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mt-6">
          <div>
            <CardTitle>Edit Product</CardTitle>
            <CardDescription>Update the product information.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/products/products-list">Back to Products</Link>
          </Button>
        </div>
      </div>

      <ProductForm
        mode="edit"
        product={product}
        brands={brands}
        categories={categories}
      />
    </div>
  );
}
