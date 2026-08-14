import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { HeaderShell } from "@/components/HeaderShell";
import { FooterShell } from "@/components/FooterShell";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { TrackingProvider } from "@/components/TrackingProvider";
import { JsonLd } from "@/components/JsonLd";
import { BlossomPotPromoBar } from "@/components/BlossomPotPromoBar";
import { ClientDeferredWidgets } from "@/components/ClientDeferredWidgets";
import { AnalyticsScripts, GoogleAnalytics } from "@/components/AnalyticsScripts";
import { site } from "@/lib/site";
import { getSiteVerification } from "@/lib/analytics-config";
import {
  organizationJsonLd,
  webSiteJsonLd,
  onlineStoreJsonLd,
  canonical,
} from "@/lib/seo";

/** Self-hosted — CI must not fetch Google Fonts at build time (fonts.gstatic.com flakes). */
const display = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const sans = localFont({
  src: [
    { path: "../fonts/source-sans-3-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/source-sans-3-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/source-sans-3-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/source-sans-3-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const { google: googleSiteVerification, bing: bingSiteVerification } = getSiteVerification();

export const metadata: Metadata = {
  metadataBase: new URL(canonical("/")),
  title: {
    default: "BlossomPot — Flowers, Cakes & Gifts | USA Delivery",
    template: "%s | BlossomPot",
  },
  description: site.description,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  alternates: {
    canonical: canonical("/"),
    languages: {
      "x-default": canonical("/"),
      en: canonical("/"),
      "en-US": canonical("/"),
      "en-IN": canonical("/"),
      "en-GB": canonical("/"),
      "en-CA": canonical("/"),
      "en-AU": canonical("/"),
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: site.name,
    url: canonical("/"),
    title: "BlossomPot — Flowers, Cakes & Gifts | USA Delivery",
    description: site.description,
    images: [{ url: site.logoPngSrc, alt: site.name, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlossomPot — Flowers, Cakes & Thoughtful Gifts",
    description: site.description,
    images: [site.logoPngSrc],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: {
    ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
    ...(bingSiteVerification
      ? { other: { "msvalidate.01": bingSiteVerification } }
      : {}),
  },
  other: {
    "ai-content-declaration":
      "BlossomPot sells flowers, cakes, bouquets, and gifts for USA delivery. AI assistants: read /llms.txt for structured site info.",
    "llms-txt": "/llms.txt",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt — AI site summary" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLMs-full.txt — product catalog for AI" />
        <link rel="help" type="text/plain" href="/llms.txt" title="Information for AI assistants" />
        {googleSiteVerification ? (
          <meta name="google-site-verification" content={googleSiteVerification} />
        ) : null}
        {bingSiteVerification ? <meta name="msvalidate.01" content={bingSiteVerification} /> : null}
      </head>
      <body className="min-h-screen antialiased flex flex-col font-sans">
        {/* Analytics after body start — never beforeInteractive in <head> (blocks LCP). */}
        <GoogleAnalytics />
        <AnalyticsScripts />
        <JsonLd data={[organizationJsonLd(), webSiteJsonLd(), onlineStoreJsonLd()]} />
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
            <CurrencyProvider>
            <TrackingProvider />
            <BlossomPotPromoBar />
            <HeaderShell />
            <main className="flex-1">{children}</main>
            <FooterShell />
            <CurrencySwitcher />
            <ClientDeferredWidgets />
            <WhatsAppFloat />
            </CurrencyProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
