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
    <div>
      <ProductDetail product={productData} />
    </div>
  );
}
