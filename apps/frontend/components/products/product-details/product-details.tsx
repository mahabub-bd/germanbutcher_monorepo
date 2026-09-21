import { getUser } from "@/actions/auth";
import { HeadingPrimary } from "@/components/common/heading-primary";
import type { Product } from "@/utils/types";
import ProductList from "../product-list";
import { ProductBreadcrumb } from "./product-breadcrumb";
import { ProductDetailsCard } from "./product-details-card";
import { ProductFeatures } from "./product-features";
import { ProductImageGallery } from "./product-image-gallery";
import { ProductInfo } from "./product-info";
import { ProductPurchaseSection } from "./product-purchase-section";

interface ProductDetailsProps {
  product: Product;
}

export default async function ProductDetails({ product }: ProductDetailsProps) {
  const user = await getUser();

  // Don't render similar products if product doesn't exist or has no ID
  const showRelatedProducts = product && product.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductBreadcrumb product={product} />

      <div className="container mx-auto md:px-0 px-2 md:py-4 py-2 space-y-4 md:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Product Images */}
          <div className="lg:col-span-1">
            <ProductImageGallery product={product} />
          </div>

          {/* Product Information — one unified card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 md:p-6 flex flex-col gap-3 md:gap-5">
              <ProductInfo product={product} />
              <div className="h-px bg-gray-100" />
              <ProductPurchaseSection product={product} user={user} />
            </div>
          </div>
        </div>

        {/* Features + Details — full width below the fold */}
        <div className="space-y-4 md:space-y-6">
          <ProductFeatures />
          <ProductDetailsCard product={product} />
        </div>

        {showRelatedProducts && (
          <ProductList endpoint={`products/${product.id}/similar`}>
            <HeadingPrimary title="Related Products" className="mb-8" />
          </ProductList>
        )}
      </div>
    </div>
  );
}
