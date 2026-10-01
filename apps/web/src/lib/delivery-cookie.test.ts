import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DELIVERY_COOKIE_MAX_AGE_SECONDS,
  deliveryCookieUpdate,
  isDeliveryCookieFlight,
} from "./delivery-location";
import { resolveStorefrontCountryIso } from "./location-seo-urls";

function headerBag(record: Record<string, string>) {
  const lower = Object.fromEntries(Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]));
  return { get: (name: string) => lower[name.toLowerCase()] ?? null };
}

const documentHeaders = headerBag({
  accept: "text/html,application/xhtml+xml",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
});

describe("delivery cookie responses", () => {
  it("does not let a stale Canada flight overwrite a newer UK selection", () => {
    const flight = isDeliveryCookieFlight(
      headerBag({
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "next-url": "/?country=CA",
      })
    );
    assert.equal(flight, true);
    const update = deliveryCookieUpdate({
      resolvedCountry: "CA",
      requestCookie: "CA:",
      flight,
    });
    assert.equal(update, null);
  });

  it("does not let a stale UK flight overwrite a newer US selection", () => {
    const flight = isDeliveryCookieFlight(
      headerBag({
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "next-router-prefetch": "1",
        "next-url": "/flower-delivery-uk?country=GB",
      })
    );
    assert.equal(flight, true);
    const update = deliveryCookieUpdate({
      resolvedCountry: "GB",
      requestCookie: "GB:",
      flight,
    });
    assert.equal(update, null);
  });

  it("does not let a stale Canada flight overwrite a newer Australia selection", () => {
    const flight = isDeliveryCookieFlight(
      headerBag({
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "next-router-segment-prefetch": "/flower-delivery-canada",
      })
    );
    assert.equal(flight, true);
    const update = deliveryCookieUpdate({
      resolvedCountry: "CA",
      requestCookie: "CA:K1A 0B1",
      flight,
    });
    assert.equal(update, null);
  });

  it("initializes the cookie on a direct country-page load", () => {
    const resolved = resolveStorefrontCountryIso({
      pathname: "/flower-delivery-uk",
      cookieCountry: null,
    });
    assert.equal(resolved, "GB");
    assert.equal(isDeliveryCookieFlight(documentHeaders), false);
    const update = deliveryCookieUpdate({
      resolvedCountry: resolved,
      requestCookie: null,
      flight: false,
    });
    assert.deepEqual(update, { value: "GB:", maxAge: DELIVERY_COOKIE_MAX_AGE_SECONDS });
  });

  it("lets the current document response replace an older cookie", () => {
    const resolved = resolveStorefrontCountryIso({
      pathname: "/flower-delivery-uk",
      searchCountry: "GB",
      cookieCountry: "CA",
    });
    assert.equal(resolved, "GB");
    const update = deliveryCookieUpdate({
      resolvedCountry: resolved,
      requestCookie: "CA:",
      flight: false,
    });
    assert.equal(update?.value, "GB:");
    assert.equal(update?.maxAge, 60 * 60 * 24 * 365);
  });

  it("keeps the cookie format, postal value, and one-year lifetime", () => {
    const sameCountry = deliveryCookieUpdate({
      resolvedCountry: "GB",
      requestCookie: "GB:SW1A1AA",
      flight: false,
    });
    assert.equal(sameCountry?.value, "GB:SW1A1AA");
    assert.equal(sameCountry?.maxAge, DELIVERY_COOKIE_MAX_AGE_SECONDS);
    assert.equal(
      resolveStorefrontCountryIso({
        pathname: "/flower-delivery-usa",
        searchCountry: "GB",
        cookieCountry: "CA",
      }),
      "US"
    );
  });

  it("treats an RSC payload request as a flight even when the URL country differs", () => {
    assert.equal(isDeliveryCookieFlight(headerBag({ accept: "text/x-component" })), true);
    assert.equal(isDeliveryCookieFlight(headerBag({ rsc: "1" })), true);
    assert.equal(
      isDeliveryCookieFlight(headerBag({ "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", rsc: "1" })),
      false
    );
    const update = deliveryCookieUpdate({
      resolvedCountry: "AU",
      requestCookie: "CA:",
      flight: true,
    });
    assert.equal(update, null);
  });
});
