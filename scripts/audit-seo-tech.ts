/**
 * Technical SEO report for representative public URLs (locations + core pages).
 *   AUDIT_SEO_BASE=http://localhost:3000 npm run audit:seo-tech
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.env.AUDIT_SEO_BASE ?? "https://www.blossompot.com").replace(/\/$/, "");
const OUT = join(__dirname, "../docs/seo-tech-latest.json");

type Row = {
  url: string;
  status: number | null;
  title: string | null;
  canonical: string | null;
  robots: string | null;
  h1: string | null;
  wordCount: number;
  schemaTypes: string[];
  issues: string[];
};

function extract(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m?.[1]?.trim() ?? null;
}

const PATHS = [
  "/",
  "/locations",
  "/locations/united-states",
  "/locations/canada",
  "/locations/canada/ontario",
  "/locations/canada/ontario/toronto",
  "/locations/australia",
  "/locations/australia/new-south-wales/sydney",
  "/locations/europe",
  "/locations/europe/united-kingdom",
  "/locations/europe/united-kingdom/london",
  "/delivery-locations",
  "/gifts-to-california",
  "/robots.txt",
  "/sitemap-locations.xml",
];

async function audit(path: string): Promise<Row> {
  const url = `${BASE}${path}`;
  const issues: string[] = [];
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "BlossomPot-SEO-Tech/1.0" },
    });
    const body = await res.text();
    const title = extract(body, /<title[^>]*>([^<]*)<\/title>/i);
    const canonical =
      extract(body, /rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ??
      extract(body, /href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    const robots =
      extract(body, /name=["']robots["'][^>]*content=["']([^"']+)["']/i) ??
      extract(body, /content=["']([^"']+)["'][^>]*name=["']robots["']/i);
    const h1 = extract(body, /<h1[^>]*>([\s\S]*?)<\/h1>/i)?.replace(/<[^>]+>/g, "").trim() ?? null;
    const wordCount = body.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
    const schemaTypes = [...body.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]!);
    if (res.status !== 200 && !path.includes(".")) issues.push(`status ${res.status}`);
    if (!path.includes(".") && res.status === 200) {
      if (!title) issues.push("missing title");
      if (!h1) issues.push("missing H1");
      if (!canonical) issues.push("missing canonical");
      if (robots && /noindex/i.test(robots)) issues.push("noindex on public page");
      if (wordCount < 200) issues.push(`thin content (${wordCount} words)`);
    }
    return { url, status: res.status, title, canonical, robots, h1, wordCount, schemaTypes, issues };
  } catch (e) {
    return {
      url,
      status: null,
      title: null,
      canonical: null,
      robots: null,
      h1: null,
      wordCount: 0,
      schemaTypes: [],
      issues: [e instanceof Error ? e.message : String(e)],
    };
  }
}

async function main() {
  const paths = [...new Set(PATHS)];
  const rows: Row[] = [];
  for (const path of paths) rows.push(await audit(path));
  const report = {
    auditedAt: new Date().toISOString(),
    base: BASE,
    issueCount: rows.reduce((n, r) => n + r.issues.length, 0),
    rows,
  };
  writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`audit:seo-tech → ${BASE} (${rows.length} URLs, ${report.issueCount} issues)`);
  console.log(`Wrote ${OUT}`);
  if (report.issueCount > 0) {
    for (const row of rows.filter((r) => r.issues.length)) {
      console.error(`${row.url}: ${row.issues.join("; ")}`);
    }
    process.exit(1);
  }
  console.log("audit:seo-tech — PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
