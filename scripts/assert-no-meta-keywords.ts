/**
 * Build-time assertion: no page may emit <meta name="keywords">.
 *
 * Always scans apps/web source for Metadata `keywords:` assignments.
 * Optionally scans .next HTML when ASSERT_META_KEYWORDS_HTML=1 (post-build CI).
 *
 * Usage:
 *   npx tsx scripts/assert-no-meta-keywords.ts
 *   ASSERT_META_KEYWORDS_HTML=1 npx tsx scripts/assert-no-meta-keywords.ts
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const WEB = join(ROOT, "apps/web");

function fail(msg: string): never {
  console.error(`assert-no-meta-keywords: FAIL — ${msg}`);
  process.exit(1);
}

function assertSourceClean() {
  let out = "";
  try {
    out = execSync(
      `rg -n --glob '*.{ts,tsx}' -e 'keywords\\s*:' src/app src/lib/seo.ts`,
      { cwd: WEB, encoding: "utf8" }
    );
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string };
    if (err.status === 1) return; // no matches
    out = err.stdout ?? "";
  }
  const lines = out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^\S+:\d+:\s*\/\//.test(l) && !l.includes("* "));
  if (lines.length) {
    fail(`Found keywords metadata in app sources:\n${lines.join("\n")}`);
  }
}

function walkHtml(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkHtml(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

function assertBuiltHtmlClean() {
  if (process.env.ASSERT_META_KEYWORDS_HTML !== "1") {
    console.log(
      "assert-no-meta-keywords: skipping .next HTML scan (set ASSERT_META_KEYWORDS_HTML=1 after next build)"
    );
    return;
  }
  const nextDir = join(WEB, ".next");
  if (!existsSync(nextDir)) {
    fail(".next missing — run next build before ASSERT_META_KEYWORDS_HTML=1");
  }
  const files = walkHtml(nextDir);
  const re = /<meta\s+name=["']keywords["']/i;
  const hits: string[] = [];
  for (const f of files) {
    if (re.test(readFileSync(f, "utf8"))) hits.push(f.replace(WEB + "/", ""));
  }
  if (hits.length) {
    fail(`Built HTML still emits meta keywords (${hits.length}):\n${hits.slice(0, 20).join("\n")}`);
  }
}

assertSourceClean();
assertBuiltHtmlClean();
console.log("assert-no-meta-keywords: OK");
