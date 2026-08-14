import type { NextConfig } from "next";
import { categoryRedirectRules, categoryRewriteRules } from "./src/lib/category-urls";
import { legacyRedirectRules } from "./src/lib/legacy-urls";

const nextConfig: NextConfig = {
  transpilePackages: ["@blossompot/shared"],
  /**
   * Cap ISR stale-while-revalidate. Next default (~1 year) kept wrong product prices
   * in CloudFront/HTML long after DynamoDB + API had the correct storefront price.
   */
  expireTime: 300,
  async redirects() {
    return [
      ...categoryRedirectRules(),
      ...legacyRedirectRules(),
      // Prefer 301 over Next's default 308 for permanent:true so crawlers treat these as classic permanent moves.
      // Legacy /cities/* → canonical /send-rakhi-to-* (handled by locations/[slug] dynamic route).
      { source: "/cities/:slug", destination: "/send-rakhi-to-:slug", statusCode: 301 },
      { source: "/cities/:slug/", destination: "/send-rakhi-to-:slug", statusCode: 301 },
      // Slash form → hyphenated canonical (keeps one public URL per city).
      { source: "/send-rakhi-to/:city", destination: "/send-rakhi-to-:city", statusCode: 301 },
      { source: "/send-rakhi-to/:city/", destination: "/send-rakhi-to-:city", statusCode: 301 },
      // Country landings — trailing-slash → canonical (not US city /send-rakhi-to-* pages).
      { source: "/rakhi-from-uk/", destination: "/rakhi-from-uk", statusCode: 301 },
      { source: "/rakhi-from-canada/", destination: "/rakhi-from-canada", statusCode: 301 },
      { source: "/sitemap.rss", destination: "/sitemap.xml", statusCode: 301 },
    ];
  },
  async rewrites() {
    return [
      ...categoryRewriteRules(),
      // All city/state landings (express + secondary + other) → one dynamic handler.
      { source: "/send-rakhi-to-:slug", destination: "/locations/:slug" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    NEXT_PUBLIC_COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
  },
};

export default nextConfig;
