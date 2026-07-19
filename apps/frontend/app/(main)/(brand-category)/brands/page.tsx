import { HeadingPrimary } from "@/components/common/heading-primary";
import BrandList from "@/components/homepage/brands/brand-list";

export default async function BrandPage() {
  return (
    <section className="bg-gray-50">
      <div className="container mx-auto px-4">
        <BrandList endpoint="brands">
          <HeadingPrimary
            title="OUR BRANDS"
            subtitle="Shop from trusted brands you love"
            className="my-10"
          />
        </BrandList>
      </div>
    </section>
  );
}
