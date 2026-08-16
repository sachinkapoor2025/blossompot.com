import { siteUrl } from "@/lib/env";
import { internationalPath, publishedInternationalLocations } from "@/lib/content/geo/international";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function urlsetXml(urls: { loc: string; lastmod: string }[]): string {
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.78</priority>
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
  const locs = [
    { loc: `${siteUrl}/locations`, lastmod },
    ...publishedInternationalLocations().map((g) => ({
      loc: `${siteUrl}${internationalPath(g)}`,
      lastmod,
    })),
  ];
  return new Response(urlsetXml(locs), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
