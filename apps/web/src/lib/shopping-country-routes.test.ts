import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { resolveDefaultShoppingCountry, resolveEnabledShoppingCountry } from "@blossompot/shared";
import { deliverToDestination } from "./country-switch";
import { disabledCountryFallback } from "./gbo-delivery-countries";
import {
  explicitShoppingSeoCountry,
  shopPathForLocation,
  shoppingCountrySitemapPaths,
  shoppingSeoCountryStatus,
} from "./location-seo-urls";

const categories = ["flowers", "cakes"] as const;

describe("shopping country routes", () => {
  it("treats an enabled category URL as available", () => {
    assert.equal(shoppingSeoCountryStatus("/flowers-to-uk", ["US", "GB"]), "enabled");
    assert.equal(explicitShoppingSeoCountry("/flowers-to-uk"), "GB");
  });

  it("marks a disabled category URL unavailable before any product fallback", () => {
    assert.equal(shoppingSeoCountryStatus("/flowers-to-uk", ["US"]), "unavailable");
    assert.equal(shoppingSeoCountryStatus("/flowers-to-uk", []), "unavailable");
    assert.equal(shoppingSeoCountryStatus("/flowers-to-uk", null), "unavailable");
  });

  it("marks a disabled catalog URL unavailable", () => {
    assert.equal(shoppingSeoCountryStatus("/gifts-to-uk", ["US"]), "unavailable");
    assert.equal(shoppingSeoCountryStatus("/gifts-to-usa", ["US"]), "enabled");
  });

  it("rejects an unknown country code", () => {
    assert.equal(explicitShoppingSeoCountry("/flowers-to-zz"), "ZZ");
    assert.equal(shoppingSeoCountryStatus("/flowers-to-zz", ["US", "GB"]), "unavailable");
    assert.equal(shoppingSeoCountryStatus("/gifts-to-zz", ["US"]), "unavailable");
  });

  it("excludes disabled countries and includes enabled countries in shopping sitemap paths", () => {
    const usaOnly = shoppingCountrySitemapPaths(["US"], categories);
    assert.equal(usaOnly.includes("/flowers-to-usa"), true);
    assert.equal(usaOnly.includes("/gifts-to-usa"), true);
    assert.equal(usaOnly.includes("/flower-delivery-usa"), true);
    assert.equal(usaOnly.includes("/flowers-to-uk"), false);
    assert.equal(usaOnly.includes("/flower-delivery-uk"), false);

    const usaAndUk = shoppingCountrySitemapPaths(["US", "GB"], categories);
    assert.equal(usaAndUk.includes("/flowers-to-uk"), true);
    assert.equal(usaAndUk.includes("/cakes-to-uk"), true);
    assert.equal(usaAndUk.includes("/gifts-to-uk"), true);
    assert.equal(usaAndUk.includes("/flower-delivery-uk"), true);
    assert.equal(shoppingCountrySitemapPaths([], categories).length, 0);
  });

  it("does not treat international guides or USA city pages as shopping-country URLs", () => {
    for (const pathname of ["/locations", "/locations/canada", "/locations/europe/united-kingdom", "/delivery-locations", "/gifts-to-california"]) {
      assert.equal(explicitShoppingSeoCountry(pathname), null, pathname);
      assert.equal(shoppingSeoCountryStatus(pathname, ["US"]), "not-shopping", pathname);
    }
    assert.equal(shopPathForLocation("/gifts-to-california", "GB"), "/gifts-to-california");
    const paths = shoppingCountrySitemapPaths(["US", "CA", "GB"], categories);
    assert.equal(paths.includes("/locations/canada"), false);
    assert.equal(paths.includes("/gifts-to-california"), false);
  });

  it("switches /flower-delivery-usa to the equivalent enabled page and keeps /", () => {
    assert.equal(shopPathForLocation("/flower-delivery-usa", "GB"), "/flower-delivery-uk");
    assert.equal(deliverToDestination("/flower-delivery-usa", "GB", ""), "/flower-delivery-uk");
    assert.equal(deliverToDestination("/flowers-to-usa", "GB", "sort=featured"), "/flowers-to-uk?sort=featured");
    assert.equal(shopPathForLocation("/", "GB"), "/");
    assert.equal(deliverToDestination("/", "GB", ""), "/?country=GB");
    assert.equal(shopPathForLocation("/flower-delivery-usa", "IN"), "/flower-delivery-usa");
  });

  it("resolves a disabled saved country to the configured default", () => {
    const countries = [{ countryCode: "US" }, { countryCode: "GB" }];
    assert.equal(disabledCountryFallback("RS", countries, "GB"), "GB");
    assert.equal(disabledCountryFallback("RS", [{ countryCode: "GB" }], "GB"), "GB");
    assert.equal(disabledCountryFallback("GB", countries, "US"), null);
  });

  it("keeps the indexable default country independent of the shopper country", () => {
    const stored = [
      { countryCode: "US", enabled: true },
      { countryCode: "GB", enabled: true },
    ];
    assert.equal(resolveDefaultShoppingCountry(stored, "US"), "US");
    assert.equal(resolveEnabledShoppingCountry("GB", stored), "GB");
    const source = readFileSync(path.join(__dirname, "storefront-country.ts"), "utf8");
    const start = source.indexOf("export async function getIndexableHomeCountry");
    const end = source.indexOf("export async function getStorefrontDeliveryCountry");
    const fn = source.slice(start, end);
    assert.equal(fn.includes("cookies("), false);
    assert.equal(fn.includes("DELIVERY_LOCATION_COOKIE"), false);
    const sitemap = readFileSync(path.join(__dirname, "../app/sitemap.ts"), "utf8");
    assert.match(sitemap, /A failed read keeps the USA-only fallback/);
    assert.match(sitemap, /return \["US"\]/);
    assert.equal(sitemap.includes("/same-day-delivery"), false);
  });

  it("does not advertise the redirected same-day URL as a landing page", () => {
    const promo = readFileSync(path.join(__dirname, "../components/BlossomPotPromoBar.tsx"), "utf8");
    const llms = readFileSync(path.join(__dirname, "../app/llms.txt/route.ts"), "utf8");
    const redirects = readFileSync(path.join(__dirname, "../../next.config.ts"), "utf8");
    assert.equal(promo.includes("$75"), false);
    assert.equal(promo.includes("same-day"), false);
    assert.equal(promo.includes("/same-day-delivery"), false);
    assert.match(promo, /Shop flowers, cakes & hampers/);
    assert.match(promo, /href="\/products"/);
    assert.equal(llms.includes("/same-day-delivery"), false);
    assert.match(redirects, /source: "\/same-day-delivery", destination: "\/products", statusCode: 301/);
  });
});
