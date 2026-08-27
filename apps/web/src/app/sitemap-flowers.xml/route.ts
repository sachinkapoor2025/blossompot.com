import { siteUrl } from "@/lib/env";
import { flowerSitemapPaths } from "@/lib/content/flower-guide";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const urls = flowerSitemapPaths()
    .map(
      (u) => `  <url>
    <loc>${siteUrl}${u.path}</loc>
    <lastmod>${u.lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.72</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
