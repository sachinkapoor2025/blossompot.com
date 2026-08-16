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
      // Verified search / AI search crawlers (see docs/CRAWLER-POLICY.md).
      // Private paths remain disallowed via the * rule. UA is not authentication.
      { userAgent: "Googlebot", allow: "/", disallow: ["/admin/", "/vendor/", "/api/", "/checkout", "/account", "/cart"] },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "bingbot", allow: "/", disallow: ["/admin/", "/vendor/", "/api/", "/checkout", "/account", "/cart"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/admin/", "/vendor/", "/api/", "/checkout", "/account", "/cart"] },
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin/", "/vendor/", "/api/"] },
      { userAgent: "ChatGPT-User", allow: "/", disallow: ["/admin/", "/vendor/", "/api/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/admin/", "/vendor/", "/api/", "/checkout", "/account", "/cart"] },
      { userAgent: "Claude-SearchBot", allow: "/", disallow: ["/admin/", "/vendor/", "/api/", "/checkout", "/account", "/cart"] },
      { userAgent: "Claude-User", allow: "/", disallow: ["/admin/", "/vendor/", "/api/"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/admin/", "/vendor/", "/api/"] },
      { userAgent: "Applebot", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
    ],
    sitemap: [
      `${siteUrl}/sitemap.xml`,
      `${siteUrl}/sitemap-geo.xml`,
      `${siteUrl}/sitemap-locations.xml`,
      `${siteUrl}/sitemap-flowers.xml`,
    ],
    host,
  };
}
