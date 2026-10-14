import ProductDetail from "@/components/admin/products/product-detail";
import { fetchData } from "@/utils/api-utils";
import { Product } from "@/utils/types";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const productData = await fetchData<Product>(`products/${id}`);

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <ProductDetail product={productData} />
    </div>
  );
}
