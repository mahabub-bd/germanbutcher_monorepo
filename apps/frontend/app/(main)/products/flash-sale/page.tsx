import { HeadingPrimary } from "@/components/common/heading-primary";
import ProductList from "@/components/products/product-list";

export default async function FlashSalePage() {
  return (
    <div className="container mx-auto pt-6 md:pt-10">
      <HeadingPrimary
        title="Flash Sale"
        subtitle="Limited-time deals just for you"
        align="center"
        className="mb-6"
      />
      <ProductList endpoint="products/flash-sale?page=1&limit=20&isActive=true">
        <span className="hidden" aria-hidden />
      </ProductList>
    </div>
  );
}
