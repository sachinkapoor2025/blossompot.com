import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { classifyUserAgent } from "@/lib/crawler-policy";
import {
  DELIVERY_LOCATION_COOKIE,
  deliveryCookieUpdate,
  isDeliveryCookieFlight,
  parseDeliveryLocationToken,
} from "@/lib/delivery-location";
import { getApiUrl } from "@/lib/env";
import {
  LOCATION_SEO_HEADER,
  STOREFRONT_COUNTRY_HEADER,
  explicitShoppingSeoCountry,
  locationShopRewritePath,
  parseLocationShopPath,
  resolveStorefrontCountryIso,
  shoppingSeoCountryStatus,
  ENABLED_SHOPPING_COUNTRIES_HEADER,
} from "@/lib/location-seo-urls";

const ENABLED_CACHE_MS = 30_000;
let enabledCache: { at: number; codes: string[] } | null = null;

/**
 * Enabled shopping countries for this edge isolate.
 * A failed read uses the USA-only fallback. An empty successful list stays empty.
 */
async function loadEdgeEnabledShoppingCountries(): Promise<string[]> {
  const now = Date.now();
  if (enabledCache && now - enabledCache.at < ENABLED_CACHE_MS) return enabledCache.codes;
  try {
    const response = await fetch(`${getApiUrl()}/catalog-countries`, {
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`catalog countries ${response.status}`);
    const data = (await response.json()) as { countries?: { countryCode?: string }[] };
    const codes = [
      ...new Set(
        (data.countries ?? [])
          .map((country) => (country.countryCode ?? "").trim().toUpperCase())
          .filter((code) => /^[A-Z]{2}$/.test(code))
      ),
    ];
    enabledCache = { at: now, codes };
    return codes;
  } catch {
    return enabledCache?.codes ?? ["US"];
  }
}

/**
 * Edge 301: apex → www.
 * Build an absolute URL explicitly — cloning nextUrl on Amplify SSR can keep
 * internal port :3000 and break production (Location: https://www.blossompot.com:3000/).
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host === "blossompot.com") {
    const dest = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      "https://www.blossompot.com"
    );
    return NextResponse.redirect(dest, 301);
  }

  const explicitCountry = explicitShoppingSeoCountry(request.nextUrl.pathname);
  let enabledForRequest: string[] | null = null;
  if (explicitCountry) {
    enabledForRequest = await loadEdgeEnabledShoppingCountries();
    if (shoppingSeoCountryStatus(request.nextUrl.pathname, enabledForRequest) === "unavailable") {
      const url = request.nextUrl.clone();
      url.pathname = "/shopping-country-unavailable";
      url.search = "";
      const unavailable = NextResponse.rewrite(url);
      stampBotHeaders(unavailable, request);
      return unavailable;
    }
  }

  const locationShop = parseLocationShopPath(request.nextUrl.pathname);
  if (locationShop) {
    const countryIso = locationShop.countryIso;
    const url = request.nextUrl.clone();
    url.pathname = locationShopRewritePath(locationShop);
    url.searchParams.set("country", countryIso);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete(ENABLED_SHOPPING_COUNTRIES_HEADER);
    if (enabledForRequest) requestHeaders.set(ENABLED_SHOPPING_COUNTRIES_HEADER, enabledForRequest.join(","));
    requestHeaders.set(LOCATION_SEO_HEADER, request.nextUrl.pathname.replace(/\/+$/, "") || "/");
    requestHeaders.set(STOREFRONT_COUNTRY_HEADER, countryIso);
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    applyDeliveryCountryCookie(response, request, countryIso);
    stampBotHeaders(response, request);
    return response;
  }

  const cookieCountry = parseDeliveryLocationToken(
    request.cookies.get(DELIVERY_LOCATION_COOKIE)?.value
  )?.countryCode;
  const country = resolveStorefrontCountryIso({
    pathname: request.nextUrl.pathname,
    searchCountry: request.nextUrl.searchParams.get("country"),
    cookieCountry,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(ENABLED_SHOPPING_COUNTRIES_HEADER);
  if (enabledForRequest) requestHeaders.set(ENABLED_SHOPPING_COUNTRIES_HEADER, enabledForRequest.join(","));
  if (country) requestHeaders.set(STOREFRONT_COUNTRY_HEADER, country);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  stampBotHeaders(response, request);
  if (country) applyDeliveryCountryCookie(response, request, country);

  return response;
}

function stampBotHeaders(response: NextResponse, request: NextRequest) {
  const classified = classifyUserAgent(request.headers.get("user-agent"));
  response.headers.set("x-blossompot-bot-class", classified.class);
  if (classified.crawlerId) {
    response.headers.set("x-blossompot-crawler", classified.crawlerId);
  }
}

function applyDeliveryCountryCookie(response: NextResponse, request: NextRequest, country: string) {
  const update = deliveryCookieUpdate({
    resolvedCountry: country,
    requestCookie: request.cookies.get(DELIVERY_LOCATION_COOKIE)?.value,
    flight: isDeliveryCookieFlight(request.headers),
  });
  if (!update) return;
  response.cookies.set({
    name: DELIVERY_LOCATION_COOKIE,
    value: update.value,
    path: "/",
    sameSite: "lax",
    maxAge: update.maxAge,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|SVG|PNG|JPG|JPEG|GIF|WEBP|ICO)$).*)",
  ],
};
