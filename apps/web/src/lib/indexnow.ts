/**
 * IndexNow helper — key stays in INDEXNOW_KEY / NEXT_PUBLIC_INDEXNOW_KEY env.
 * Never commit the key. See docs/SEARCH-ENGINE-SETUP.md.
 */

import { siteUrl } from "./env";

export function indexNowKey(): string {
  return (process.env.INDEXNOW_KEY || process.env.NEXT_PUBLIC_INDEXNOW_KEY || "").trim();
}

export async function submitIndexNow(urls: string[]): Promise<{ ok: boolean; status?: number; skipped?: string }> {
  const key = indexNowKey();
  if (!key) return { ok: false, skipped: "INDEXNOW_KEY not set" };
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${siteUrl}/indexnow-key.txt`,
      urlList: urls.slice(0, 10_000),
    }),
  });
  return { ok: res.ok, status: res.status };
}
