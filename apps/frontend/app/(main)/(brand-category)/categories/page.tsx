import { HeadingPrimary } from "@/components/common/heading-primary";
import CategoryList from "@/components/homepage/Category/category-list";
export default function CategoryPage() {
  return (
    <section className="bg-gray-50">
      <div className="container mx-auto ">
        <CategoryList endpoint="categories?isMainCategory=true">
          <HeadingPrimary
            title="FEATURED CATEGORIES"
            subtitle="Get your desired product from featured category"
          />
        </CategoryList>
      </div>
    </section>
  );
}
