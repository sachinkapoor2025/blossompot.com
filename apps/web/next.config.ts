import type { NextConfig } from "next";
import { categoryRedirectRules, categoryRewriteRules } from "./src/lib/category-urls";
import { legacyRedirectRules } from "./src/lib/legacy-urls";

const nextConfig: NextConfig = {
  transpilePackages: ["@blossompot/shared"],
  expireTime: 300,
  async redirects() {
    return [
      ...categoryRedirectRules(),
      ...legacyRedirectRules(),
      { source: "/cities/:slug", destination: "/gifts-to-:slug", statusCode: 301 },
      { source: "/cities/:slug/", destination: "/gifts-to-:slug", statusCode: 301 },
      { source: "/send-rakhi-to-:city", destination: "/gifts-to-:city", statusCode: 301 },
      { source: "/send-rakhi-to-:city/", destination: "/gifts-to-:city", statusCode: 301 },
      { source: "/raksha-bandhan", destination: "/flowers", statusCode: 301 },
      { source: "/raksha-bandhan/", destination: "/flowers", statusCode: 301 },
      { source: "/send-rakhi-from-india", destination: "/", statusCode: 301 },
      { source: "/send-rakhi-from-india/", destination: "/", statusCode: 301 },
      { source: "/rakhi-from-canada", destination: "/flowers", statusCode: 301 },
      { source: "/rakhi-from-canada/", destination: "/flowers", statusCode: 301 },
      { source: "/rakhi-from-uk", destination: "/flowers", statusCode: 301 },
      { source: "/rakhi-from-uk/", destination: "/flowers", statusCode: 301 },
      // Legacy Rakhi category SEO URLs → flower/gift shop
      { source: "/single-rakhi-to-usa", destination: "/flowers", statusCode: 301 },
      { source: "/single-rakhi-to-usa/", destination: "/flowers", statusCode: 301 },
      { source: "/2-set-rakhi-to-usa", destination: "/products", statusCode: 301 },
      { source: "/2-set-rakhi-to-usa/", destination: "/products", statusCode: 301 },
      { source: "/3-set-rakhi-to-usa", destination: "/products", statusCode: 301 },
      { source: "/3-set-rakhi-to-usa/", destination: "/products", statusCode: 301 },
      { source: "/4-set-rakhi-to-usa", destination: "/products", statusCode: 301 },
      { source: "/4-set-rakhi-to-usa/", destination: "/products", statusCode: 301 },
      { source: "/bhaiya-bhabhi-rakhi-to-usa", destination: "/products", statusCode: 301 },
      { source: "/bhaiya-bhabhi-rakhi-to-usa/", destination: "/products", statusCode: 301 },
      { source: "/kids-rakhi-to-usa", destination: "/products", statusCode: 301 },
      { source: "/kids-rakhi-to-usa/", destination: "/products", statusCode: 301 },
      { source: "/lumba-rakhi-to-usa", destination: "/products", statusCode: 301 },
      { source: "/lumba-rakhi-to-usa/", destination: "/products", statusCode: 301 },
      { source: "/rakhi-combo-to-usa", destination: "/gift-hampers", statusCode: 301 },
      { source: "/rakhi-combo-to-usa/", destination: "/gift-hampers", statusCode: 301 },
      { source: "/rakhi-hampers-to-usa", destination: "/gift-hampers", statusCode: 301 },
      { source: "/rakhi-hampers-to-usa/", destination: "/gift-hampers", statusCode: 301 },
      // path-to-regexp (Next 15.5+) forbids `:slug*` without a `/` delimiter before it
      { source: "/collections/rakhi-:slug", destination: "/flowers", statusCode: 301 },
      { source: "/collections/rakhi-:slug/", destination: "/flowers", statusCode: 301 },
      { source: "/sitemap.rss", destination: "/sitemap.xml", statusCode: 301 },
    ];
  },
  async rewrites() {
    return [
      ...categoryRewriteRules(),
      { source: "/gifts-to-:slug", destination: "/locations/:slug" },
    ];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
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
