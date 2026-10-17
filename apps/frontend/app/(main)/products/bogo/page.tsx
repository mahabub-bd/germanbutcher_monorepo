import { HeadingPrimary } from "@/components/common/heading-primary";
import ProductList from "@/components/products/product-list";

export const metadata = {
  title: "BOGO Deals",
};

export default function BogoPage() {
  return (
    <div className="container mx-auto pt-6 md:pt-10">
      <HeadingPrimary
        title="BOGO Deals"
        subtitle="Buy X get Y free — auto-applied at checkout"
        align="center"
        className="mb-6"
      />
      <ProductList endpoint="products/bogo?page=1&limit=20&isActive=true">
        <span className="hidden" aria-hidden />
      </ProductList>
    </div>
  );
}
