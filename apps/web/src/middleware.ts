import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { classifyUserAgent } from "@/lib/crawler-policy";
import {
  DELIVERY_LOCATION_COOKIE,
  deliveryLocationToken,
  parseDeliveryLocationToken,
} from "@/lib/delivery-location";
import {
  LOCATION_SEO_HEADER,
  STOREFRONT_COUNTRY_HEADER,
  locationShopRewritePath,
  parseLocationShopPath,
  resolveStorefrontCountryIso,
} from "@/lib/location-seo-urls";

/**
 * Edge 301: apex → www.
 * Build an absolute URL explicitly — cloning nextUrl on Amplify SSR can keep
 * internal port :3000 and break production (Location: https://www.blossompot.com:3000/).
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host === "blossompot.com") {
    const dest = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      "https://www.blossompot.com"
    );
    return NextResponse.redirect(dest, 301);
  }

  const locationShop = parseLocationShopPath(request.nextUrl.pathname);
  if (locationShop) {
    const url = request.nextUrl.clone();
    url.pathname = locationShopRewritePath(locationShop);
    url.searchParams.set("country", locationShop.countryIso);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCATION_SEO_HEADER, request.nextUrl.pathname.replace(/\/+$/, "") || "/");
    requestHeaders.set(STOREFRONT_COUNTRY_HEADER, locationShop.countryIso);
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    applyDeliveryCountryCookie(response, request, locationShop.countryIso);
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
  const existing = parseDeliveryLocationToken(request.cookies.get(DELIVERY_LOCATION_COOKIE)?.value);
  const postalCode = existing?.countryCode === country ? existing.postalCode : "";
  response.cookies.set({
    name: DELIVERY_LOCATION_COOKIE,
    value: deliveryLocationToken({
      countryCode: country,
      postalCode,
      postalDisplay: postalCode || country,
    }),
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
