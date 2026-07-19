import { HeadingPrimary } from "@/components/common/heading-primary";
import ProductList from "@/components/products/product-list";

export default function FlashSalePage() {
  return (
    <div className="container mx-auto ">
      <ProductList endpoint="products/discounted?page=1&limit=20&isActive=true">
        <HeadingPrimary
          title="Flash Sale"
          subtitle="Limited-time deals just for you"
          className="mb-10"
        />
      </ProductList>
    </div>
  );
}
