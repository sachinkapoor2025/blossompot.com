import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categoryLocationHref,
  giftsCatalogLocationHref,
  isExistingGiftsToSeoPage,
  isLocationUrlExemptPath,
  localizeCopyForCountry,
  localizeShopCopy,
  locationShopHeading,
  locationShopRewritePath,
  parseLocationShopPath,
  shopPathForLocation,
  giftsCatalogCountryIso,
  giftsCatalogCountryRewrites,
  countryIsoFromPathname,
  deliveryDestinationName,
  resolveStorefrontCountryIso,
  withCountryQuery,
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
    assert.equal(locationShopHeading("/gifts-to-uk", "Shop Flowers, Cakes & Gifts"), "Shop Flowers, Cakes & Gifts to USA");
    assert.equal(locationShopHeading("/flowers-to-uk", "Send Flowers"), "Send Flowers to USA");
    const ukShop = localizeShopCopy("/flowers-to-uk", {
      title: "Send Flowers Online Worldwide | BlossomPot",
      description: "Order fresh flowers for worldwide delivery.",
      h1: "Send Flowers — Worldwide Delivery",
    });
    assert.match(ukShop.title, /USA/);
    assert.match(ukShop.h1 ?? "", /USA/);
    assert.equal(countryIsoFromPathname("/flowers-to-uk"), "GB");
    assert.match(localizeCopyForCountry("Shop with worldwide delivery.", "GB"), /UK/);
  });

  it("rewrites country catalog gifts-to URLs to /products before city pages", () => {
    assert.equal(giftsCatalogCountryIso("usa"), "US");
    assert.equal(giftsCatalogCountryIso("uk"), "GB");
    assert.equal(giftsCatalogCountryIso("california"), null);
    const usa = giftsCatalogCountryRewrites().find((r) => r.source === "/gifts-to-usa");
    assert.deepEqual(usa, { source: "/gifts-to-usa", destination: "/products?country=US" });
    const uk = giftsCatalogCountryRewrites().find((r) => r.source === "/gifts-to-uk");
    assert.deepEqual(uk, { source: "/gifts-to-uk", destination: "/products?country=US" });
    assert.equal(categoryLocationHref("flowers", "US"), "/flowers-to-usa");
  });

  it("names the selected delivery destination for help copy", () => {
    assert.equal(deliveryDestinationName("BH", "Bahrain"), "Bahrain");
    assert.equal(deliveryDestinationName("BH"), "Bahrain");
    assert.equal(deliveryDestinationName("AE", "United Arab Emirates"), "UAE");
    assert.equal(deliveryDestinationName("GB"), "UK");
    assert.equal(deliveryDestinationName("US", "United States"), "USA");
    assert.equal(deliveryDestinationName(null), "USA");
    assert.equal(
      `confirm ${deliveryDestinationName("AE", "United Arab Emirates")} delivery addresses.`,
      "confirm UAE delivery addresses."
    );
  });

  it("maps country pages to that country's ISO for city menus", () => {
    assert.equal(countryIsoFromPathname("/flower-delivery-usa"), "US");
    assert.equal(countryIsoFromPathname("/flower-delivery-uk"), "GB");
    assert.equal(countryIsoFromPathname("/flower-delivery-canada"), "CA");
    assert.equal(countryIsoFromPathname("/flower-delivery-uk", "US"), "GB");
    assert.equal(countryIsoFromPathname("/locations/canada/ontario"), "CA");
    assert.equal(countryIsoFromPathname("/", "GB"), "GB");
  });

  it("keeps shopping in the US when a guide, query, or cookie names another country", () => {
    assert.equal(
      resolveStorefrontCountryIso({
        pathname: "/flower-delivery-uk",
        cookieCountry: "US",
      }),
      "US"
    );
    assert.equal(
      resolveStorefrontCountryIso({
        pathname: "/flower-delivery-usa",
        cookieCountry: "GB",
      }),
      "US"
    );
    assert.equal(
      resolveStorefrontCountryIso({
        pathname: "/flower-delivery-canada",
      }),
      "US"
    );
    assert.equal(
      resolveStorefrontCountryIso({
        pathname: "/flower-delivery-uae",
      }),
      "US"
    );
    assert.equal(
      resolveStorefrontCountryIso({
        pathname: "/flower-delivery-australia",
      }),
      "US"
    );
    assert.equal(
      resolveStorefrontCountryIso({
        pathname: "/flowers",
        cookieCountry: "GB",
      }),
      "US"
    );
    assert.equal(
      resolveStorefrontCountryIso({
        pathname: "/products",
        searchCountry: "AE",
        cookieCountry: "US",
      }),
      "US"
    );
    assert.equal(countryIsoFromPathname("/flower-delivery-uk"), "GB");
    assert.equal(withCountryQuery("/products?search=roses", "GB"), "/products?search=roses&country=US");
    assert.equal(withCountryQuery("/products?search=roses", "US"), "/products?search=roses&country=US");
  });
});
