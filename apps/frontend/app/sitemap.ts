import { fetchData } from "@/utils/api-utils";
import { Category, Product } from "@/utils/types";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://germanbutcherbd.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/certifications`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    // Fetch products
    const products: Product[] = await fetchData(
      "products?limit=1000&isActive=true"
    );
    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug || product.id}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: product.isFeatured ? 0.9 : 0.7,
    }));

    const categories: Category[] = await fetchData("categories");
    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/categories/${category.slug || category.id}`,
      lastModified: new Date(category.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...productPages, ...categoryPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return static pages if API fails
    return staticPages;
  }
}
