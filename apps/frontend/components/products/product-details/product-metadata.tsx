import { formatCurrencyEnglish } from "@/lib/utils";
import type { Product } from "@/utils/types";
import type { Metadata } from "next";

interface GenerateProductMetadataProps {
  product: Product;
  baseUrl?: string;
}

export function generateProductMetadata({
  product,
  baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yoursite.com",
}: GenerateProductMetadataProps): Metadata {
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

  const productUrl = `${baseUrl}/products/${product.slug || product.id}`;

  const description =
    product.description ||
    `${product.name} - High quality ${product.category?.name || "product"} from ${product.brand?.name || "our store"}. ${product.stock > 0 ? "In stock" : "Currently unavailable"}.`;

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
    title: `${product.name} | ${product.brand?.name} - ${formatCurrencyEnglish(finalPrice)}`,
    description: metaDescription,
    keywords,

    // Open Graph
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
        ...(product.gallery?.attachments?.slice(0, 3).map((img) => ({
          url: img.url,
          width: 800,
          height: 600,
          alt: `${product.name} - Additional view`,
        })) || []),
      ],
      locale: "en_US",
      type: "website",
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title: `${product.name} - ${formatCurrencyEnglish(finalPrice)}`,
      description: metaDescription,
      images: [product.attachment?.url || "/placeholder-product.jpg"],
      creator: "@yourstore", // Replace with your Twitter handle
    },

    // Additional meta tags
    other: {
      // Product specific meta tags
      "product:brand": product.brand?.name || "",
      "product:category": product.category?.name || "",
      "product:price:amount": finalPrice.toString(),
      "product:price:currency": "USD", // Adjust currency as needed
      "product:availability": availability,
      "product:condition": "new",
      "product:sku": product.productSku,

      // Rich snippets / Schema.org structured data
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
          priceCurrency: "USD", // Adjust currency
          price: finalPrice,
          priceValidUntil: hasActiveDiscount
            ? product.discountEndDate
            : undefined,
          availability: `https://schema.org/${availability}`,
          seller: {
            "@type": "Organization",
            name: "German Butcher Bangladesh",
          },
          itemCondition: "https://schema.org/NewCondition",
        },
        aggregateRating:
          product.saleCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: "4.5", // You might want to add actual ratings to your Product interface
                reviewCount: product.saleCount,
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

    // Additional metadata
    alternates: {
      canonical: productUrl,
    },
  };
}
