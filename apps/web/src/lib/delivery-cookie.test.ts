import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DELIVERY_COOKIE_MAX_AGE_SECONDS,
  deliveryCookieUpdate,
  isDeliveryCookieFlight,
  parseDeliveryLocationToken,
} from "./delivery-location";
import { shoppingCountryOptions } from "./gbo-delivery-countries";
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

describe("shopping country options", () => {
  it("lists only the United States", () => {
    const options = shoppingCountryOptions();
    assert.deepEqual(
      options.map((country) => country.countryCode),
      ["US"]
    );
  });
});

describe("stored delivery location", () => {
  it("resolves a GB cookie and a CA value to the US and clears the foreign postal code", () => {
    assert.deepEqual(parseDeliveryLocationToken("GB:SW1A1AA"), {
      countryCode: "US",
      postalCode: "",
      postalDisplay: "US",
    });
    assert.deepEqual(parseDeliveryLocationToken("CA:K1A 0B1"), {
      countryCode: "US",
      postalCode: "",
      postalDisplay: "US",
    });
  });

  it("keeps a valid US ZIP", () => {
    assert.deepEqual(parseDeliveryLocationToken("US:90012"), {
      countryCode: "US",
      postalCode: "90012",
      postalDisplay: "90012",
    });
  });
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
    assert.equal(resolved, "US");
    assert.equal(isDeliveryCookieFlight(documentHeaders), false);
    const update = deliveryCookieUpdate({
      resolvedCountry: resolved,
      requestCookie: null,
      flight: false,
    });
    assert.deepEqual(update, { value: "US:", maxAge: DELIVERY_COOKIE_MAX_AGE_SECONDS });
  });

  it("lets the current document response replace an older cookie", () => {
    const resolved = resolveStorefrontCountryIso({
      pathname: "/flower-delivery-uk",
      searchCountry: "GB",
      cookieCountry: "CA",
    });
    assert.equal(resolved, "US");
    const update = deliveryCookieUpdate({
      resolvedCountry: resolved,
      requestCookie: "CA:",
      flight: false,
    });
    assert.equal(update?.value, "US:");
    assert.equal(update?.maxAge, 60 * 60 * 24 * 365);
  });

  it("keeps a US ZIP and clears a foreign postal code", () => {
    const sameCountry = deliveryCookieUpdate({
      resolvedCountry: "US",
      requestCookie: "US:90012",
      flight: false,
    });
    assert.equal(sameCountry?.value, "US:90012");
    assert.equal(sameCountry?.maxAge, DELIVERY_COOKIE_MAX_AGE_SECONDS);
    const foreign = deliveryCookieUpdate({
      resolvedCountry: "GB",
      requestCookie: "GB:SW1A1AA",
      flight: false,
    });
    assert.equal(foreign?.value, "US:");
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
