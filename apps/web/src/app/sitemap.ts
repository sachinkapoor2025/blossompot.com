import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { isProductSearchIndexable, type Product } from "@blossompot/shared";
import { siteUrl } from "@/lib/env";
import { categoryHref } from "@/lib/category-urls";
import { getCatalogProducts } from "@/lib/catalog-fallback";
import { categoryOrder } from "@/lib/site";
import { listAllBlogPosts } from "@/lib/content/blog-posts";
import { allCollectionSlugs } from "@/lib/collections";
import { publishedGeoLocations } from "@/lib/content/geo/locations";
import { locationPublicPath } from "@/lib/content/seo-data";
import { internationalPath, publishedInternationalLocations } from "@/lib/content/geo/international";
import { allOccasionSlugs } from "@/lib/content/occasions";
import { allGiftGuideSlugs } from "@/lib/content/recipients";
import { flowerSitemapPaths } from "@/lib/content/flower-guide";

function mergeProducts(apiProducts: Product[]): Product[] {
  const bySlug = new Map(apiProducts.map((p) => [p.slug, p]));
  for (const p of getCatalogProducts()) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);
  }
  return [...bySlug.values()].filter((p) => isProductSearchIndexable(p));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/about/team`, lastModified: now, changeFrequency: "monthly", priority: 0.55 },
    { url: `${siteUrl}/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/same-day-delivery`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteUrl}/corporate-gifting`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/remember`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteUrl}/forgot-occasion`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/flower-guide`, lastModified: now, changeFrequency: "weekly", priority: 0.86 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/press`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/editorial-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.45 },
    { url: `${siteUrl}/delivery-locations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/locations`, lastModified: now, changeFrequency: "weekly", priority: 0.82 },
    { url: `${siteUrl}/flower-delivery-usa`, lastModified: now, changeFrequency: "weekly", priority: 0.86 },
    { url: `${siteUrl}/flower-delivery-uk`, lastModified: now, changeFrequency: "weekly", priority: 0.84 },
    { url: `${siteUrl}/flower-delivery-canada`, lastModified: now, changeFrequency: "weekly", priority: 0.84 },
    { url: `${siteUrl}/flower-delivery-australia`, lastModified: now, changeFrequency: "weekly", priority: 0.84 },
    { url: `${siteUrl}/flower-delivery-uae`, lastModified: now, changeFrequency: "weekly", priority: 0.84 },
    { url: `${siteUrl}/occasions`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/gifts`, lastModified: now, changeFrequency: "weekly", priority: 0.78 },
    { url: `${siteUrl}/become-a-vendor`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${siteUrl}/llms.txt`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/llms-full.txt`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${siteUrl}/humans.txt`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryRoutes = categoryOrder.map((slug) => ({
    url: `${siteUrl}${categoryHref(slug)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // City geo URLs live in /sitemap-geo.xml; keep state hubs here for discovery.
  const locationRoutes = publishedGeoLocations()
    .filter((g) => g.type === "state")
    .map((g) => ({
      url: `${siteUrl}${locationPublicPath(g.slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const internationalRoutes = publishedInternationalLocations().map((loc) => ({
    url: `${siteUrl}${internationalPath(loc)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: loc.kind === "city" ? 0.72 : 0.8,
  }));

  const occasionRoutes = allOccasionSlugs().map((slug) => ({
    url: `${siteUrl}/occasions/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.78,
  }));

  const giftGuideRoutes = allGiftGuideSlugs().map((slug) => ({
    url: `${siteUrl}/gifts/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.76,
  }));

  const flowerGuideRoutes = flowerSitemapPaths()
    .filter((p) => p.path !== "/flower-guide")
    .map((p) => ({
      url: `${siteUrl}${p.path}`,
      lastModified: new Date(p.lastModified),
      changeFrequency: "weekly" as const,
      priority: 0.72,
    }));

  const blogRoutes = listAllBlogPosts().map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const collectionRoutes = allCollectionSlugs().map((slug) => ({
    url: `${siteUrl}/collections/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  let apiProducts: Product[] = [];
  try {
    const productsData = await api<{ products: Product[] }>("/products");
    apiProducts = productsData.products;
  } catch {
    apiProducts = [];
  }

  const productRoutes = mergeProducts(apiProducts).map((p) => ({
    url: `${siteUrl}/products/${p.slug}`,
    lastModified: new Date(p.updatedAt ?? now),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...locationRoutes,
    ...internationalRoutes,
    ...occasionRoutes,
    ...giftGuideRoutes,
    ...flowerGuideRoutes,
    ...blogRoutes,
    ...collectionRoutes,
    ...productRoutes,
  ];
}
