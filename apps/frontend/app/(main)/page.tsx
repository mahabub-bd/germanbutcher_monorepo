import { Section, SectionTitle } from "@/components/common/section";
import { PromotionalCarousel } from "@/components/homepage/banner/hero/add/promotional-banner-server";
import { CarouselBanner } from "@/components/homepage/banner/hero/carousel-banner-server";
import BrandList from "@/components/homepage/brands/brand-list";
import CategoryList from "@/components/homepage/Category/category-list";

import Client from "@/components/homepage/clients/Clients";
import CustomerLoveSection from "@/components/homepage/customer-love/customer-love-section";
import { SalesPartnersCompact } from "@/components/homepage/sales-partner/sales-partners";
import { NewsletterSection } from "@/components/homepage/subscriber/newsletter";
import { TestimonialSection } from "@/components/homepage/testimonial/testimonial-section-server";
import FlashSaleSection from "@/components/products/flash-sale-section";
import BogoSection from "@/components/products/bogo-section";
import ProductList from "@/components/products/product-list";

// No `revalidate` segment config here: the root layout reads cookies(), so
// every route renders dynamically and the config would be inert anyway.
export const metadata = {
  title: "German Butcher - Premium German Sausages & Meat Products in Bangladesh",
  description: "Discover premium quality meat products at German Butcher. Fresh cuts, sausages, and more delivered to your doorstep.",
  keywords: "german butcher, meat products, fresh meat, sausages, premium quality",
  alternates: {
    canonical: "/",
  },
};

// Section components (ProductList, BrandList, Client, ...) each render their
// own `container mx-auto`, so <Section> only handles rhythm/background here.
export default function Home() {
  return (
    <main className="min-h-screen">
      <div>
        <CarouselBanner />
      </div>
      <div className="md:py-10 py-4 pb-8 promotional-banner-bg">
        <PromotionalCarousel />
      </div>
      {/* Categories Section: CategoryList owns its padding, so no <Section> */}
      <section>
        <CategoryList endpoint="categories?isMainCategory=true">
          <SectionTitle title="Shop by Category" />
        </CategoryList>
      </section>

      {/* Features Products Section */}
      <Section className="product-bg">
        <ProductList
          endpoint="products?featured=true&isActive=true&limit=10&page=1"
          isHomePage
          href="products/featured/"
        >
          <SectionTitle title="Featured Products" className="mb-8" />
        </ProductList>
      </Section>
      <FlashSaleSection />
      <BogoSection />
      <Section className="bg-gray-50">
        <ProductList
          endpoint="products/discounted?page=1&limit=10&isActive=true"
          isHomePage
          href="products/special-offers"
        >
          <SectionTitle title="SPECIAL OFFERS" />
        </ProductList>
      </Section>
      {/* Popular Products Section */}
      <Section>
        <ProductList
          endpoint="products/bestsellers?limit=10&isActive=true"
          isHomePage
          href="products/popular"
        >
          <SectionTitle title="Popular Products" />
        </ProductList>
      </Section>

      {/* Brands Section */}
      <Section className="product-bg">
        <BrandList endpoint="products?isActive=true&limit=10&page=1">
          <SectionTitle title="Recommended for you" />
        </BrandList>
      </Section>

      <Section>
        <SalesPartnersCompact>
          <SectionTitle title="Our Sales Partner" />
        </SalesPartnersCompact>
      </Section>
      {/* Subscribe Section */}
      <Section className="product-bg">
        <Client>
          <SectionTitle title="Our Prominent Clients" />
        </Client>
      </Section>

      <Section>
        <CustomerLoveSection>
          <SectionTitle title="Why Our Customer Love Us" />
        </CustomerLoveSection>
      </Section>
      <NewsletterSection />

      <TestimonialSection />
    </main>
  );
}
