import { BreadcrumbBar } from "@/components/common/breadcrumb-bar";
import { HeadingPrimary } from "@/components/common/heading-primary";
import ProductList from "@/components/products/product-list";

export default async function RecipeDetilsPage({
  params,
}: {
  params: Promise<{ search: string }>;
}) {
  const { search } = await params;

  return (
    <div>
      <div className="container mx-auto px-4">
        <BreadcrumbBar
          items={[
            { label: "Products", href: "/products" },
            { label: `Search: "${search}"` },
          ]}
        />
      </div>
      <section className="md:py-10 py-5">
        <div className="container mx-auto px-4">
          <ProductList endpoint={`products?search=${search}&isActive=true`}>
            <HeadingPrimary
              title={search ? `Results for "${search}"` : "OUR BRANDS"}
              subtitle="Shop from trusted brands you love"
              className="my-10"
            />
          </ProductList>
        </div>
      </section>
    </div>
  );
}
