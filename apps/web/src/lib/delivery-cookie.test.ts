import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DELIVERY_COOKIE_MAX_AGE_SECONDS,
  deliveryCookieUpdate,
  isDeliveryCookieFlight,
  parseDeliveryLocationToken,
} from "./delivery-location";
import { shoppingCountriesFromGlobal, shoppingCountryOptions } from "./gbo-delivery-countries";
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
  it("lists the full curated delivery catalog before the API loads", () => {
    const options = shoppingCountryOptions();
    const codes = options.map((country) => country.countryCode);
    for (const code of ["US", "GB", "CA", "AU", "AE"]) {
      assert.equal(codes.includes(code), true, code);
    }
    assert.ok(codes.length >= 20);
  });

  it("keeps the full catalog when the API only returns Australia", () => {
    const options = shoppingCountriesFromGlobal([{ countryCode: "AU" }, { countryCode: "ZZ" }]);
    const codes = options.map((country) => country.countryCode);
    for (const code of ["US", "GB", "CA", "AU", "AE"]) {
      assert.equal(codes.includes(code), true, code);
    }
    assert.equal(codes.includes("ZZ"), false);
  });
});

describe("stored delivery location", () => {
  it("keeps a known country and drops an unknown country back to the US", () => {
    assert.deepEqual(parseDeliveryLocationToken("GB:SW1A1AA"), {
      countryCode: "GB",
      postalCode: "SW1A1AA",
      postalDisplay: "SW1A1AA",
    });
    assert.deepEqual(parseDeliveryLocationToken("ZZ:12345"), {
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
    assert.equal(foreign?.value, "GB:SW1A1AA");
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
