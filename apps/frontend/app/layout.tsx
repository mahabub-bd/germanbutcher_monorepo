import { getUser } from "@/actions/auth";
import { SearchModal } from "@/components/homepage/search/search-modal";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/providers/cart-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { SearchProvider } from "@/providers/search-provider";
import { fetchProtectedData } from "@/utils/api-utils";
import type { Cart } from "@/utils/types";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import localFont from "next/font/local";
import type React from "react";
import "./globals.css";

// Google Font - Quicksand
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Local Font - CastorTwoW01
const castorTwoW01 = localFont({
  src: "../public/font/CastorTwoW01-Regular.woff",
  variable: "--font-castor",
  display: "swap",
  weight: "400",
});

// Combine font variables
const fontVariables = `${quicksand.variable} ${castorTwoW01.variable}`;

export const metadata: Metadata = {
  title: {
    default: "German Butcher - Premium German Sausages & Meat Products in Bangladesh",
    template: "%s | German Butcher",
  },
  description:
    "In 1991, Ferenz Georgy started German Butcher in Bangladesh with a love for sausages noticing the unavailability of such products in our country. Since then, German Butcher is the pioneer of authentic German Sausages in Bangladesh and became the icon of premium quality gourmet sausages, cold cuts, ham, bacon, meatloaf, salami, pepperoni and so many meat based products. Order online for fresh delivery.",
  keywords: [
    "german butcher",
    "German Butcher",
    "GB",
    "german-butcher",
    "German-Butcher",
    "germanbutcherbd",
    "german butcher bd",
    "beef",
    "fish",
    "steak",
    "offer",
    "meat",
    "meatball",
    "milk",
    "dairy",
    "gb product",
    "chicken",
    "sausages",
    "cold cuts",
    "ham",
    "bacon",
    "meatloaf",
    "salami",
    "pepperoni",
    "authentic german sausages",
    "premium quality",
    "gourmet",
    "bangladesh",
    "dhaka",
    "online meat shop",
    "meat delivery",
    "german food bangladesh",
    "pork bangladesh",
    "cold cuts bangladesh",
    "bacon bangladesh",
    "sausages bangladesh",
    "gourmet meat",
    "premium meat",
  ],
  authors: [{ name: "German Butcher Team", url: "https://www.germanbutcherbd.com" }],
  creator: "German Butcher",
  publisher: "German Butcher",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.germanbutcherbd.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "German Butcher - Premium German Sausages & Meat Products in Bangladesh",
    description:
      "Pioneer of authentic German Sausages in Bangladesh since 1991. Premium quality gourmet sausages, cold cuts, ham, bacon, meatloaf, salami, pepperoni and meat based products. Order online for fresh delivery across Bangladesh.",
    url: "https://www.germanbutcherbd.com",
    siteName: "German Butcher",
    images: [
      {
        url: "https://germanbutcherbd.com/images/twitter-card.png",
        width: 1200,
        height: 630,
        alt: "German Butcher - Premium German Sausages & Meat Products",
        type: "image/png",
      },
      {
        url: "https://germanbutcherbd.com/images/logo3.png",
        width: 1200,
        height: 630,
        alt: "German Butcher Logo",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    site: "@germanbutcherbd",
    creator: "@germanbutcherbd",
    title: "German Butcher - Premium German Sausages & Meat Products in Bangladesh",
    description:
      "Pioneer of authentic German Sausages in Bangladesh since 1991. Premium quality gourmet sausages, cold cuts, ham, bacon and meat products. Order online for fresh delivery.",
    images: [
      {
        url: "https://germanbutcherbd.com/images/twitter-card.png",
        width: 1200,
        height: 630,
        alt: "German Butcher - Premium German Sausages & Meat Products",
      },
      "https://germanbutcherbd.com/images/logo3.png",
    ],
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon-72.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  manifest: "/manifest.json",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "5TIMzRI4DGfgTxaMGSbVmI4e7MgP4",
  },
  category: "food",
  referrer: "origin-when-cross-origin",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const cart = user ? await fetchProtectedData<Cart>("cart") : null;

  return (
    <html lang="en" className={fontVariables}>
      <GoogleTagManager gtmId="GTM-5H5N8NBL" />
      <GoogleAnalytics gaId="G-JP7KEDH4NK" />
      <body className={fontVariables} suppressHydrationWarning>
        <Toaster richColors />

        <NotificationProvider>
          <CartProvider serverCart={cart ?? undefined} isLoggedIn={!!user}>
            <SearchProvider>
              {children}
              <SearchModal />
            </SearchProvider>
          </CartProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}

export { castorTwoW01, quicksand };

