import { HeadingPrimary } from "@/components/common/heading-primary";
import ProductList from "@/components/products/product-list";

export default function FeaturesProductPage() {
  const endpoint = "products?page=1&limit=100&featured=true&isActive=true";

  return (
    <div className="container mx-auto">
      <ProductList endpoint={endpoint}>
        <HeadingPrimary
          title="FEATURED PRODUCTS"
          subtitle="Discover amazing deals on top products"
          className="mb-10"
          titleClassName="text-green-600"
        />
      </ProductList>
    </div>
  );
}
