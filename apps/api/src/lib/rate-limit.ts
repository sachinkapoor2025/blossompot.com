/**
 * Best-effort in-process rate limit (per Lambda instance).
 * Not a replacement for WAF / API Gateway usage plans.
 * Verified search crawlers should not hit these POST/admin routes.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 2000) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now);
  const current = buckets.get(key);
  if (!current || now > current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function clientIp(event: { requestContext?: { http?: { sourceIp?: string } } }): string {
  return event.requestContext?.http?.sourceIp || "unknown";
}

export type RateClass = "public-write" | "checkout" | "admin" | "auth";

export function limitForPath(method: string, path: string): { cls: RateClass; limit: number; windowMs: number } | null {
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;
  if (path.startsWith("/admin") || path.startsWith("/ses-email")) {
    return { cls: "admin", limit: 60, windowMs: 60_000 };
  }
  if (path.startsWith("/account") || path.includes("/login") || path.includes("/marketplace/vendors/login")) {
    return { cls: "auth", limit: 10, windowMs: 60_000 };
  }
  if (path.startsWith("/checkout") || path.startsWith("/payments") || path.startsWith("/cart")) {
    return { cls: "checkout", limit: 30, windowMs: 60_000 };
  }
  if (path === "/leads" || path === "/events" || path.startsWith("/products") && method === "POST") {
    return { cls: "public-write", limit: 40, windowMs: 60_000 };
  }
  return { cls: "public-write", limit: 80, windowMs: 60_000 };
}
