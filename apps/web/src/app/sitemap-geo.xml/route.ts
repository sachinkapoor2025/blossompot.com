import { siteUrl } from "@/lib/env";
import { locationPublicPath } from "@/lib/content/seo-data";
import { publishedGeoLocations } from "@/lib/content/geo/locations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Generic sitemap splitter — geo set is well under 50k URLs. */
function splitUrls(urls: string[], chunkSize = 45_000): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += chunkSize) {
    chunks.push(urls.slice(i, i + chunkSize));
  }
  return chunks.length ? chunks : [[]];
}

function urlsetXml(urls: { loc: string; lastmod: string }[]): string {
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export async function GET() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const locs = publishedGeoLocations().map((g) => ({
    loc: `${siteUrl}${locationPublicPath(g.slug)}`,
    lastmod,
  }));
  const chunks = splitUrls(locs.map((l) => l.loc));
  // Single chunk in practice
  const xml = urlsetXml(
    chunks[0]!.map((loc) => ({ loc, lastmod }))
  );
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
