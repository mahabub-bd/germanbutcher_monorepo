import { HeadingPrimary } from "@/components/common/heading-primary";
import ProductList from "@/components/products/product-list";

export default function PopularPage() {
  return (
    <div className="container mx-auto ">
      <ProductList endpoint="products/bestsellers?limit=50&isActive=true">
        <HeadingPrimary
          title="POPULAR PRODUCTS"
          subtitle="Discover amazing deals on top products"
          className="mb-10"
          titleClassName="text-green-600"
        />
      </ProductList>
    </div>
  );
}
