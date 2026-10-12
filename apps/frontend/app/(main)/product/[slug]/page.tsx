import ProductDetails from "@/components/products/product-details/product-details";
import { formatCurrencyEnglish } from "@/lib/utils";
import { fetchData } from "@/utils/api-utils";
import { Product, RatingSummary } from "@/utils/types";
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

    // JSON-LD requires absolute URLs; defaults to the production host so it
    // matches the root metadataBase. OG url and canonical stay relative and
    // are resolved against metadataBase by Next.js.
    const jsonLdUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.germanbutcherbd.com"}/products/${product.slug || product.id}`;
    const productPath = `/products/${product.slug || product.id}`;

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

    // Real rating data for JSON-LD; cached 60s like other non-product
    // endpoints. Omitted entirely when there are no approved reviews —
    // Google flags AggregateRating with reviewCount 0 as a Rich Results error.
    let ratingSummary: RatingSummary | null = null;
    try {
      ratingSummary = await fetchData<RatingSummary>(
        `reviews/product/${product.id}/rating-summary`
      );
    } catch (error) {
      console.error("Error fetching rating summary:", error);
    }

    return {
      title: `${product.name} | ${product.brand?.name || "Your Store"} - ${formatCurrencyEnglish(finalPrice)}`,
      description: metaDescription,
      keywords,

      openGraph: {
        title: `${product.name} - ${formatCurrencyEnglish(finalPrice)}`,
        description: metaDescription,
        url: productPath,
        siteName: "German Butcher Bangladesh",
        images: [
          ...(product.attachment?.url
            ? [
                {
                  url: product.attachment.url,
                  alt: product.name,
                },
              ]
            : []),
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
        ...(product.attachment?.url ? { images: [product.attachment.url] } : {}),
        creator: "@germanbutcherbd",
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
            url: jsonLdUrl,
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
            ratingSummary && ratingSummary.reviewCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: ratingSummary.averageRating,
                  reviewCount: ratingSummary.reviewCount,
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
        canonical: productPath,
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
