import ProductDetails from "@/components/products/product-details/product-details";
import { formatCurrencyEnglish } from "@/lib/utils";
import { fetchData } from "@/utils/api-utils";
import { Product } from "@/utils/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Validate slug - reject file extensions (images, etc.)
function isValidSlug(slug: string): boolean {
  const invalidExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp', '.pdf', '.txt'];
  const lowerSlug = slug.toLowerCase();
  return !invalidExtensions.some(ext => lowerSlug.endsWith(ext));
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;

    // Validate slug before making API call
    if (!isValidSlug(slug)) {
      return {
        title: "Invalid Product URL",
        description: "The requested product URL is not valid.",
        robots: { index: false, follow: false },
      };
    }

    const product: Product = await fetchData(`products/slug/${slug}`);

    if (!product || !product.id) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
        robots: { index: false, follow: false },
      };
    }

    const now = new Date();
    const discountStart = new Date(product?.discountStartDate || 0);
    const discountEnd = new Date(product?.discountEndDate || 0);
    const hasActiveDiscount =
      product.discountType &&
      product.discountValue &&
      now >= discountStart &&
      now <= discountEnd;

    let finalPrice = product.sellingPrice;
    if (hasActiveDiscount) {
      if (product.discountType?.toUpperCase() === "PERCENTAGE") {
        finalPrice =
          product.sellingPrice * (1 - (product.discountValue || 0) / 100);
      } else if (product.discountType?.toUpperCase() === "FIXED") {
        finalPrice = product.sellingPrice - (product.discountValue || 0);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://germanbutcherbd.com";
    const productUrl = `${baseUrl}/products/${product.slug || product.id}`;

    const description =
      product.description ||
      `${product.name} - High quality ${product.category?.name || "product"} from ${product.brand?.name || "our store"}. ${product.stock > 0 ? "In stock and ready to ship." : "Currently unavailable."}`;

    const metaDescription =
      description.length > 155
        ? description.substring(0, 152) + "..."
        : description;

    const keywords = [
      product.name,
      product.category?.name,
      product.brand?.name,
      product.unit?.name,
      "buy online",
      product.stock > 0 ? "in stock" : "pre-order",
    ]
      .filter(Boolean)
      .join(", ");

    const availability = product.stock > 0 ? "InStock" : "OutOfStock";

    return {
      title: `${product.name} | ${product.brand?.name || "Your Store"} - ${formatCurrencyEnglish(finalPrice)}`,
      description: metaDescription,
      keywords,

      openGraph: {
        title: `${product.name} - ${formatCurrencyEnglish(finalPrice)}`,
        description: metaDescription,
        url: productUrl,
        siteName: "German Butcher Bangladesh",
        images: [
          {
            url: product.attachment?.url || "/placeholder-product.jpg",
            width: 1200,
            height: 630,
            alt: product.name,
          },
          ...(product?.gallery?.attachments?.slice(0, 3).map((img) => ({
            url: img.url,
            width: 800,
            height: 600,
            alt: `${product.name} - Additional view`,
          })) || []),
        ],
        locale: "en_US",
        type: "website",
      },

      twitter: {
        card: "summary_large_image",
        title: `${product.name} - ${formatCurrencyEnglish(finalPrice)}`,
        description: metaDescription,
        images: [product.attachment?.url || "/placeholder-product.jpg"],
        creator: "@yourstore",
      },

      other: {
        "product:brand": product.brand?.name || "",
        "product:category": product.category?.name || "",
        "product:price:amount": finalPrice.toString(),
        "product:price:currency": "BDT",
        "product:availability": availability,
        "product:condition": "new",
        "product:sku": product.productSku,

        "application/ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          sku: product.productSku,
          brand: {
            "@type": "Brand",
            name: product.brand?.name || "Unknown Brand",
          },
          category: product.category?.name,
          image: [
            product.attachment?.url,
            ...(product.gallery?.attachments?.map((img) => img.url) || []),
          ].filter(Boolean),
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "BDT",
            price: finalPrice.toFixed(2),
            priceValidUntil: hasActiveDiscount
              ? product.discountEndDate
              : undefined,
            availability: `https://schema.org/${availability}`,
            seller: {
              "@type": "Organization",
              name: "German Butcher Bangladesh", // Replace with your store name
            },
            itemCondition: "https://schema.org/NewCondition",
          },
          aggregateRating:
            product.saleCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: "4.5", // Add actual ratings if available
                  reviewCount: product.saleCount.toString(),
                }
              : undefined,
          weight: product.weight
            ? {
                "@type": "QuantitativeValue",
                value: product.weight,
                unitCode: "KGM", // Adjust unit as needed
              }
            : undefined,
        }),
      },

      // Robots
      robots: {
        index: product.isActive,
        follow: product.isActive,
        googleBot: {
          index: product.isActive,
          follow: product.isActive,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },

      alternates: {
        canonical: productUrl,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Product Details",
      description: "View product details and specifications.",
    };
  }
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Validate slug before fetching data
  if (!isValidSlug(slug)) {
    notFound();
  }

  let product: Product;
  try {
    product = await fetchData(`products/slug/${slug}`);
  } catch (error) {
    console.error("Error fetching product:", error);
    notFound();
  }

  if (!product || !product.id) {
    notFound();
  }

  return <ProductDetails product={product} />;
}
