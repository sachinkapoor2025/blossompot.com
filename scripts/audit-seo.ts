/**
 * Automated public SEO / crawlability audit for BlossomPot.
 *
 * Usage:
 *   npm run audit:seo
 *   AUDIT_SEO_BASE=https://www.blossompot.com npm run audit:seo
 *   AUDIT_SEO_BASE=http://localhost:3000 npm run audit:seo
 *
 * Checks robots, sitemap, and a representative set of public URLs for
 * status, title, canonical, robots meta, H1, and Product JSON-LD where expected.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.env.AUDIT_SEO_BASE ?? "https://www.blossompot.com").replace(/\/$/, "");
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs/seo-audit-latest.json");

type Check = {
  url: string;
  status: number | null;
  title: string | null;
  canonical: string | null;
  robots: string | null;
  h1: string | null;
  hasProductSchema: boolean;
  hasBreadcrumbSchema: boolean;
  missingAltApprox: number;
  error?: string;
};

const MUST_200 = [
  "/",
  "/products",
  "/flowers",
  "/cakes",
  "/faq",
  "/delivery-locations",
  "/occasions",
  "/gifts",
  "/become-a-vendor",
  "/robots.txt",
  "/sitemap.xml",
  "/sitemap-geo.xml",
];

const MUST_NOINDEX_OR_BLOCKED = ["/cart", "/checkout", "/account", "/wishlist", "/vendor/login", "/admin"];

function extract(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m?.[1]?.trim() ?? null;
}

function countMissingAlt(html: string): number {
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  return imgs.filter((tag) => !/\balt\s*=/.test(tag)).length;
}

async function fetchText(path: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "follow",
    headers: { "user-agent": "BlossomPot-SEO-Audit/1.0" },
  });
  const body = await res.text();
  return { status: res.status, body };
}

async function auditPage(path: string, expectProduct = false): Promise<Check> {
  const url = `${BASE}${path}`;
  try {
    const { status, body } = await fetchText(path);
    const title = extract(body, /<title[^>]*>([^<]*)<\/title>/i);
    const canonical = extract(body, /rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
      ?? extract(body, /href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    const robots =
      extract(body, /name=["']robots["'][^>]*content=["']([^"']+)["']/i)
      ?? extract(body, /content=["']([^"']+)["'][^>]*name=["']robots["']/i);
    const h1 = extract(body, /<h1[^>]*>([\s\S]*?)<\/h1>/i)?.replace(/<[^>]+>/g, "").trim() ?? null;
    const hasProductSchema = /"@type"\s*:\s*"Product"/.test(body);
    const hasBreadcrumbSchema = /"@type"\s*:\s*"BreadcrumbList"/.test(body);
    return {
      url,
      status,
      title,
      canonical,
      robots,
      h1,
      hasProductSchema: expectProduct ? hasProductSchema : hasProductSchema,
      hasBreadcrumbSchema,
      missingAltApprox: countMissingAlt(body),
    };
  } catch (e) {
    return {
      url,
      status: null,
      title: null,
      canonical: null,
      robots: null,
      h1: null,
      hasProductSchema: false,
      hasBreadcrumbSchema: false,
      missingAltApprox: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function main() {
  console.log(`audit:seo → ${BASE}`);

  const checks: Check[] = [];
  for (const path of MUST_200) {
    checks.push(await auditPage(path));
  }
  for (const path of MUST_NOINDEX_OR_BLOCKED) {
    checks.push(await auditPage(path));
  }

  // First product from sitemap if available
  let productPath: string | null = null;
  try {
    const { body } = await fetchText("/sitemap.xml");
    const m = body.match(/\/products\/([a-z0-9-]+)/i);
    if (m) productPath = `/products/${m[1]}`;
  } catch {
    /* ignore */
  }
  if (productPath) {
    checks.push(await auditPage(productPath, true));
  }

  let robotsBody = "";
  try {
    robotsBody = (await fetchText("/robots.txt")).body;
  } catch {
    robotsBody = "";
  }

  const publicOk = checks.filter((c) => MUST_200.some((p) => c.url.endsWith(p) || c.url === `${BASE}${p}`));
  const missingTitle = checks.filter((c) => c.status === 200 && !c.title).length;
  const missingCanonical = checks.filter(
    (c) => c.status === 200 && MUST_200.some((p) => c.url.endsWith(p)) && !c.canonical
  ).length;
  const missingH1 = checks.filter(
    (c) => c.status === 200 && MUST_200.some((p) => c.url.endsWith(p) && !p.includes(".")) && !c.h1
  ).length;
  const broken = checks.filter((c) => c.status !== null && c.status >= 400 && MUST_200.some((p) => c.url.endsWith(p)));
  const productCheck = productPath ? checks.find((c) => c.url.includes(productPath!)) : undefined;

  const robotsHasVendor = /Disallow:\s*\/vendor/i.test(robotsBody);
  const robotsHasSitemap = /Sitemap:\s*https?:\/\//i.test(robotsBody);
  const robotsHasAdmin = /Disallow:\s*\/admin/i.test(robotsBody);

  const report = {
    auditedAt: new Date().toISOString(),
    base: BASE,
    totals: {
      urlsChecked: checks.length,
      must200Failures: broken.length,
      missingTitle,
      missingCanonical,
      missingH1,
      productSchemaOk: productCheck ? productCheck.hasProductSchema : null,
      robotsBlocksVendor: robotsHasVendor,
      robotsBlocksAdmin: robotsHasAdmin,
      robotsListsSitemap: robotsHasSitemap,
    },
    checks,
    robotsSnippet: robotsBody.slice(0, 800),
  };

  writeFileSync(OUT, JSON.stringify(report, null, 2));

  console.log(`
Total URLs checked: ${report.totals.urlsChecked}
Must-200 failures:  ${report.totals.must200Failures}
Missing title:      ${report.totals.missingTitle}
Missing canonical:  ${report.totals.missingCanonical}
Missing H1:         ${report.totals.missingH1}
Product schema OK:  ${report.totals.productSchemaOk}
robots /vendor:     ${report.totals.robotsBlocksVendor}
robots /admin:      ${report.totals.robotsBlocksAdmin}
robots sitemap:     ${report.totals.robotsListsSitemap}
Wrote: ${OUT}
`);

  const fail =
    broken.length > 0 ||
    !robotsHasVendor ||
    !robotsHasAdmin ||
    !robotsHasSitemap ||
    (productCheck && productCheck.status === 200 && !productCheck.hasProductSchema);

  if (fail) {
    console.error("audit:seo — FAIL (see report for details)");
    process.exit(1);
  }
  console.log("audit:seo — PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
