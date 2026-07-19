import { HeadingPrimary } from "@/components/common/heading-primary";
import ProductList from "@/components/products/product-list";

export default function SpecialOfferPage() {
  return (
    <div className="container mx-auto ">
      <ProductList endpoint="products/discounted?page=1&limit=100&isActive=true">
        <HeadingPrimary
          title="SPECIAL OFFERS"
          subtitle="Limited-time deals just for you"
          className="mb-10"
        />
      </ProductList>
    </div>
  );
}
