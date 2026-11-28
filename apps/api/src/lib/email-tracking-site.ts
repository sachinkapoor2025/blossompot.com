import { randomUUID } from "node:crypto";

/** Store and production tracking pages. */
export const PRODUCTION_TRACKING_SITE = "https://www.blossompot.com";

/** Development Amplify site. Its /email routes call the development API. */
export const DEVELOPMENT_TRACKING_SITE = "https://dev.dsjdlmcsa1pdc.amplifyapp.com";

/** Local Next.js site. Its /email routes call the local API. */
export const LOCAL_TRACKING_SITE = "http://localhost:3000";

const PRODUCTION_HOSTS = new Set(["www.blossompot.com", "blossompot.com"]);

function httpOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLoopback(origin: string): boolean {
  const host = new URL(origin).hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

function isProductionSite(origin: string): boolean {
  return PRODUCTION_HOSTS.has(new URL(origin).hostname.toLowerCase());
}

/**
 * Public site that serves /email/open, /email/click, and /email/unsubscribe.
 * A development or local send must not use the production site, because those
 * routes write tracking into the API configured for that site.
 */
export function resolveEmailTrackingSiteUrl(
  env: Record<string, string | undefined> = process.env
): string {
  const environment = (env.ENVIRONMENT ?? "").trim().toLowerCase();
  const configured = httpOrigin(env.EMAIL_TRACKING_SITE_URL) ?? httpOrigin(env.SITE_URL);

  if (environment === "prod" || environment === "production") {
    return configured && isProductionSite(configured) ? configured : PRODUCTION_TRACKING_SITE;
  }
  if (environment === "local") {
    return configured && isLoopback(configured) ? configured : LOCAL_TRACKING_SITE;
  }
  if (environment === "dev" || environment === "development") {
    if (configured && !isProductionSite(configured) && !isLoopback(configured)) return configured;
    return DEVELOPMENT_TRACKING_SITE;
  }
  if (configured && !isProductionSite(configured)) return configured;
  return configured ?? PRODUCTION_TRACKING_SITE;
}

export function emailTrackingUrl(
  siteUrl: string,
  kind: "open" | "click" | "unsubscribe",
  token: string
): string {
  return `${siteUrl.replace(/\/$/, "")}/email/${kind}/${token}`;
}

/** External social / app links should open directly (not via click-tracking redirect). */
export function shouldSkipClickTracking(url: string): boolean {
  if (url.includes("/email/click/") || url.includes("/email/unsubscribe/")) return true;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return (
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.com" ||
      host.endsWith(".fb.com") ||
      host === "instagram.com" ||
      host.endsWith(".instagram.com") ||
      host === "wa.me" ||
      host === "api.whatsapp.com"
    );
  } catch {
    return false;
  }
}

/**
 * Rewrite https links to this environment's click tracker and add the open pixel.
 * Image sources are left unchanged. {{unsubscribe}} is replaced by the caller
 * after this step so the unsubscribe link is not click-wrapped.
 */
export function applyEmailTracking(
  html: string,
  options: {
    siteUrl: string;
    openToken: string;
    linkMap: Map<string, string>;
    newClickToken?: () => string;
  }
): string {
  const newClickToken =
    options.newClickToken ?? (() => randomUUID().replace(/-/g, "").slice(0, 24));
  let out = html.replace(/href=(["'])(https?:\/\/[^"']+)\1/gi, (_match, quote, url: string) => {
    if (shouldSkipClickTracking(url)) {
      return `href=${quote}${url}${quote}`;
    }
    const token = newClickToken();
    options.linkMap.set(token, url);
    return `href=${quote}${emailTrackingUrl(options.siteUrl, "click", token)}${quote}`;
  });
  const pixel = `<img src="${emailTrackingUrl(options.siteUrl, "open", options.openToken)}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${pixel}</body>`);
  else out += pixel;
  return out;
}
