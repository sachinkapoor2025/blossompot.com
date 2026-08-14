import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

/**
 * Next.js storefront robots — no WordPress/WooCommerce paths.
 * Private areas are disallowed; public catalog/category/geo remain crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  const host = siteUrl.replace(/^https?:\/\//, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/vendor/",
          "/api/",
          "/checkout",
          "/account",
          "/cart",
          "/wishlist",
          "/orders/",
          "/email/",
          "/unsubscribe/",
          "/ses-email/",
          "/*?*sort=",
          "/*?*orderby=",
          "/*?*search=",
        ],
      },
      // AI / LLM crawlers — explicitly allowed for discoverability of public content
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "cohere-ai", allow: "/" },
      { userAgent: "Diffbot", allow: "/" },
      { userAgent: "FacebookBot", allow: "/" },
      { userAgent: "Meta-ExternalAgent", allow: "/" },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/sitemap-geo.xml`],
    host,
  };
}
