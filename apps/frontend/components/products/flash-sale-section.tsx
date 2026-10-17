import { CountdownTimer } from "@/components/common/countdown-timer";
import { HeadingPrimary } from "@/components/common/heading-primary";
import ViewAllButton from "../homepage/Category/view-all-button";
import ProductGrid from "./product-homepage-grid";
import { fetchData } from "@/utils/api-utils";
import type { Product } from "@/utils/types";

/**
 * Server component: homepage FLASH SALE strip. Fetches the flash-sale
 * listing first and renders nothing (no section, no heading) when no
 * campaign is active — no dead section between campaigns.
 */
export default async function FlashSaleSection() {
  let products: Product[] = [];
  try {
    products = await fetchData(
      "products/flash-sale?page=1&limit=10&isActive=true"
    );
  } catch {
    return null;
  }
  if (!products?.length) return null;

  // Soonest ending campaign drives the section countdown
  const endsAt =
    products
      .map((p) => p.flashSale?.endsAt)
      .filter((e): e is string => Boolean(e))
      .sort()[0] ?? null;

  return (
    <section className="lg:py-10 py-5 bg-gray-50">
      <div className="container mx-auto">
        <div className="space-y-3 mb-6">
          <HeadingPrimary title="FLASH SALE" className="mb-0" />
          {endsAt && (
            <CountdownTimer
              variant="banner"
              endsAt={endsAt}
              className="mx-auto w-fit"
            />
          )}
        </div>
        <ProductGrid
          endpoint="products/flash-sale?page=1&limit=10&isActive=true"
          products={products}
          isHomePage
        />
        <div className="pt-6">
          <ViewAllButton href="products/flash-sale" />
        </div>
      </div>
    </section>
  );
}
