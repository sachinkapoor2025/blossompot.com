/**
 * Crawler policy + robots.txt smoke check.
 *   npm run audit:crawlers
 *   AUDIT_SEO_BASE=https://www.blossompot.com npm run audit:crawlers
 */
import { CRAWLER_POLICY } from "../apps/web/src/lib/crawler-policy";

const BASE = (process.env.AUDIT_SEO_BASE ?? "https://www.blossompot.com").replace(/\/$/, "");

const MUST_ALLOW = [
  "Googlebot",
  "OAI-SearchBot",
  "PerplexityBot",
  "Claude-SearchBot",
  "bingbot",
];

async function main() {
  const res = await fetch(`${BASE}/robots.txt`, {
    headers: { "user-agent": "BlossomPot-Crawler-Audit/1.0" },
  });
  const body = await res.text();
  const errors: string[] = [];
  if (res.status !== 200) errors.push(`robots.txt status ${res.status}`);
  if (!/Sitemap:\s*https?:\/\//i.test(body)) errors.push("robots.txt missing Sitemap");
  if (!/Disallow:\s*\/admin/i.test(body)) errors.push("robots.txt missing /admin disallow");
  if (!/sitemap-locations\.xml/i.test(body)) errors.push("robots.txt missing sitemap-locations.xml");

  for (const ua of MUST_ALLOW) {
    const block = new RegExp(`User-agent:\\s*${ua}[\\s\\S]*?(?:User-agent:|$)`, "i").exec(body);
    if (block && /Disallow:\s*\/\s*$/m.test(block[0]) && !/Allow:\s*\//i.test(block[0])) {
      errors.push(`${ua} appears fully disallowed`);
    }
  }

  const stale = CRAWLER_POLICY.filter((c) => !c.docsUrl.startsWith("https://"));
  if (stale.length) errors.push(`Crawler policy missing https docs: ${stale.map((s) => s.id).join(",")}`);

  console.log(`audit:crawlers → ${BASE}`);
  console.log(`Policy entries: ${CRAWLER_POLICY.length}`);
  console.log(body.slice(0, 600));

  if (errors.length) {
    console.error("audit:crawlers FAIL");
    for (const e of errors) console.error(` - ${e}`);
    process.exit(1);
  }
  console.log("audit:crawlers — PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
