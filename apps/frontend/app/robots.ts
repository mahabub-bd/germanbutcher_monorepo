import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://germanbutcherbd.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/categories", "/about", "/contact"],
        disallow: [
          "/admin/",
          "/api/",
          "/private/",
          "/checkout/",
          "/cart/",
          "/account/",
          "/_next/",
          "/.*",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/products", "/categories"],
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
