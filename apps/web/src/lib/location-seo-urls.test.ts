import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categoryLocationHref,
  giftsCatalogLocationHref,
  isExistingGiftsToSeoPage,
  isLocationUrlExemptPath,
  localizeShopCopy,
  locationShopHeading,
  locationShopRewritePath,
  parseLocationShopPath,
  shopPathForLocation,
  giftsCatalogCountryIso,
  giftsCatalogCountryRewrites,
} from "./location-seo-urls";

describe("location SEO shop URLs", () => {
  it("builds pretty country category URLs", () => {
    assert.equal(categoryLocationHref("flowers", "US"), "/flowers-to-usa");
    assert.equal(categoryLocationHref("gift-hampers", "US"), "/hampers-to-usa");
    assert.equal(categoryLocationHref("cakes", "GB"), "/cakes-to-uk");
    assert.equal(giftsCatalogLocationHref("US"), "/gifts-to-usa");
  });

  it("parses location shop paths and rewrites internally", () => {
    const flowers = parseLocationShopPath("/flowers-to-usa");
    assert.deepEqual(flowers, { kind: "category", internalSlug: "flowers", countryIso: "US", stem: "flowers" });
    assert.equal(flowers && locationShopRewritePath(flowers), "/flowers");

    const hampers = parseLocationShopPath("/hampers-to-uk/");
    assert.equal(hampers?.kind, "category");
    assert.equal(hampers && hampers.kind === "category" ? hampers.internalSlug : null, "gift-hampers");
    assert.equal(hampers && locationShopRewritePath(hampers), "/gift-hampers");

    const gifts = parseLocationShopPath("/gifts-to-usa");
    assert.deepEqual(gifts, { kind: "gifts-catalog", countryIso: "US", stem: "gifts" });
    assert.equal(gifts && locationShopRewritePath(gifts), "/products");
  });

  it("leaves existing city gifts-to pages alone", () => {
    assert.equal(isExistingGiftsToSeoPage("california"), true);
    assert.equal(isExistingGiftsToSeoPage("usa"), false);
    assert.equal(parseLocationShopPath("/gifts-to-california"), null);
    assert.equal(shopPathForLocation("/gifts-to-california", "US"), "/gifts-to-california");
  });

  it("does not suffix home, remember, cities, or countries pages", () => {
    assert.equal(isLocationUrlExemptPath("/"), true);
    assert.equal(isLocationUrlExemptPath("/remember"), true);
    assert.equal(isLocationUrlExemptPath("/cities"), true);
    assert.equal(isLocationUrlExemptPath("/countries"), true);
    assert.equal(isLocationUrlExemptPath("/flower-delivery-usa"), true);
    assert.equal(isLocationUrlExemptPath("/gift-catalog"), true);
    assert.equal(shopPathForLocation("/", "US"), "/");
    assert.equal(shopPathForLocation("/remember", "GB"), "/remember");
  });

  it("updates category URLs when the selected country changes", () => {
    assert.equal(shopPathForLocation("/flowers", "US"), "/flowers-to-usa");
    assert.equal(shopPathForLocation("/flowers-to-usa", "GB"), "/flowers-to-uk");
    assert.equal(shopPathForLocation("/hampers-to-usa", "GB"), "/hampers-to-uk");
    assert.equal(shopPathForLocation("/flowers-to-usa", null), "/flowers");
    assert.equal(shopPathForLocation("/products", "US"), "/gifts-to-usa");
  });

  it("localizes worldwide metadata for location shop URLs", () => {
    const copy = localizeShopCopy("/flowers-to-usa", {
      title: "Send Flowers Online Worldwide | BlossomPot",
      description: "Order fresh flowers for worldwide delivery.",
      h1: "Send Flowers Online — Worldwide Delivery",
    });
    assert.match(copy.title, /USA/);
    assert.match(copy.description, /USA/);
    assert.equal(copy.h1, "Send Flowers Online — Delivery to USA");
    assert.equal(locationShopHeading("/gifts-to-uk", "Shop Flowers, Cakes & Gifts"), "Shop Flowers, Cakes & Gifts to UK");
  });

  it("rewrites country catalog gifts-to URLs to /products before city pages", () => {
    assert.equal(giftsCatalogCountryIso("usa"), "US");
    assert.equal(giftsCatalogCountryIso("uk"), "GB");
    assert.equal(giftsCatalogCountryIso("california"), null);
    const usa = giftsCatalogCountryRewrites().find((r) => r.source === "/gifts-to-usa");
    assert.deepEqual(usa, { source: "/gifts-to-usa", destination: "/products?country=US" });
  });
});
