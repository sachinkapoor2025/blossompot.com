import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configKeys } from "../db/keys";
import { clampShoppingCountry, isShoppingCountry } from "./postal-countries";
import {
  applyEnabledShoppingCountry,
  catalogCountryKeys,
  defaultCatalogCountries,
  enabledCatalogCountries,
  isCatalogCountryEnabled,
  normalizeCatalogCountries,
  readStoredCatalogCountries,
  noProductsForDeliveryCountryMessage,
  resolveEnabledShoppingCountry,
  shoppingCountryRejection,
  catalogCountriesForStorefront,
  storefrontShoppingCountryCodes,
  SHOPPING_COUNTRY_UNAVAILABLE_MESSAGE,
} from "./catalog-countries";
import { displayCurrenciesForCountry } from "./currency-display";
import { isGboStorefrontEnabled } from "./gbo";
import { VENDOR_BLOSSOMPOT, VENDOR_FNP, VENDOR_GBO, VENDOR_ORANGE_COUNTY } from "../constants";
import {
  defaultCatalogVendor,
  productAllowedForNewShopping,
  vendorCoversShoppingCountryWithoutArea,
} from "./catalog-vendors";
import { productVisibleForDeliveryCountry } from "./gbo";
import { defaultOrangeCountyAreas, productKeptForServiceableVendors } from "./serviceability";

describe("global country config", () => {
  it("offers only USA when the UK and Serbia are disabled", () => {
    const stored = [
      { countryCode: "US", enabled: true },
      { countryCode: "GB", enabled: false },
      { countryCode: "RS", enabled: false },
    ];
    assert.deepEqual(storefrontShoppingCountryCodes(stored), ["US"]);
    assert.equal(shoppingCountryRejection("GB", storefrontShoppingCountryCodes(stored)), SHOPPING_COUNTRY_UNAVAILABLE_MESSAGE);
    assert.equal(shoppingCountryRejection("RS", storefrontShoppingCountryCodes(stored)), SHOPPING_COUNTRY_UNAVAILABLE_MESSAGE);
    assert.equal(resolveEnabledShoppingCountry("GB", stored), "US");
    assert.equal(resolveEnabledShoppingCountry("RS", stored), "US");
  });

  it("offers USA and the UK when Serbia is disabled", () => {
    const stored = [
      { countryCode: "US", enabled: true },
      { countryCode: "GB", enabled: true },
      { countryCode: "RS", enabled: false },
    ];
    assert.deepEqual(storefrontShoppingCountryCodes(stored), ["US", "GB"]);
    assert.equal(storefrontShoppingCountryCodes(stored).includes("RS"), false);
    assert.equal(resolveEnabledShoppingCountry("GB", stored), "GB");
    assert.equal(resolveEnabledShoppingCountry("RS", stored), "US");
  });

  it("does not treat USA as enabled when only the UK is enabled", () => {
    const stored = [
      { countryCode: "US", enabled: false },
      { countryCode: "GB", enabled: true },
    ];
    assert.deepEqual(storefrontShoppingCountryCodes(stored), ["GB"]);
    assert.equal(resolveEnabledShoppingCountry("US", stored), "GB");
    assert.equal(resolveEnabledShoppingCountry("GB", stored), "GB");
  });

  it("falls back to USA only when the config is missing or unreadable", () => {
    const missing = readStoredCatalogCountries(null);
    const unreadable = readStoredCatalogCountries({ countries: "nope" });
    assert.equal(missing.source, "default");
    assert.equal(unreadable.source, "default");
    assert.deepEqual(storefrontShoppingCountryCodes(missing.countries), ["US"]);
    assert.deepEqual(storefrontShoppingCountryCodes(unreadable.countries), ["US"]);
  });

  it("keeps an enabled config country that has no static catalog metadata", () => {
    const stored = [
      { countryCode: "US", enabled: true },
      { countryCode: "ZZ", enabled: true },
      { countryCode: "GB", enabled: false },
    ];
    assert.deepEqual(catalogCountriesForStorefront(stored), [
      { countryCode: "US", enabled: true },
      { countryCode: "ZZ", enabled: true },
    ]);
  });

  it("hides a USA-only vendor in a globally enabled UK", () => {
    const stored = [
      { countryCode: "US", enabled: true },
      { countryCode: "GB", enabled: true },
    ];
    assert.equal(resolveEnabledShoppingCountry("GB", stored), "GB");
    const vendor = defaultCatalogVendor(VENDOR_BLOSSOMPOT);
    assert.deepEqual(vendor.deliveryCountries, ["US"]);
    assert.equal(
      productAllowedForNewShopping({ slug: "owned-rose", vendorSlug: VENDOR_BLOSSOMPOT }, "GB", [vendor]).available,
      false
    );
  });

  it("keeps a vendor that delivers to the UK when the UK is globally enabled", () => {
    const vendor = { ...defaultCatalogVendor(VENDOR_BLOSSOMPOT), deliveryCountries: ["US", "GB"] };
    assert.equal(
      productAllowedForNewShopping({ slug: "owned-rose", vendorSlug: VENDOR_BLOSSOMPOT }, "GB", [vendor]).available,
      true
    );
  });

  it("rewrites a disabled saved country to USA when USA is enabled", () => {
    const stored = [
      { countryCode: "US", enabled: true },
      { countryCode: "RS", enabled: false },
    ];
    assert.deepEqual(
      applyEnabledShoppingCountry({ countryCode: "RS", postalCode: "11000" }, stored),
      { countryCode: "US", postalCode: "" }
    );
    assert.equal(storefrontShoppingCountryCodes(stored).includes("RS"), false);
  });

  it("keeps display currency independent of the delivery country", () => {
    assert.deepEqual(displayCurrenciesForCountry("US"), ["USD", "INR"]);
    assert.deepEqual(displayCurrenciesForCountry("GB"), ["GBP", "INR"]);
    assert.deepEqual(displayCurrenciesForCountry("RS"), ["RSD", "INR"]);
    assert.deepEqual(displayCurrenciesForCountry("IN"), ["INR"]);
    const uk = resolveEnabledShoppingCountry("GB", [
      { countryCode: "US", enabled: true },
      { countryCode: "GB", enabled: true },
    ]);
    assert.equal(uk, "GB");
    assert.deepEqual(displayCurrenciesForCountry("US"), ["USD", "INR"]);
  });

  it("keeps Orange County on US ZIP prefixes", () => {
    assert.deepEqual(
      defaultOrangeCountyAreas().map((area) => area.postalPrefix),
      ["926", "927", "928", "906", "907"]
    );
    const vendor = defaultCatalogVendor(VENDOR_ORANGE_COUNTY);
    assert.deepEqual(vendor.deliveryCountries, ["US"]);
  });

  it("keeps GBO blocked unless the storefront environment flag is on", () => {
    assert.equal(isGboStorefrontEnabled({}), false);
    assert.equal(isGboStorefrontEnabled({ GBO_STOREFRONT_ENABLED: "false" }), false);
    const vendor = defaultCatalogVendor(VENDOR_GBO);
    const product = { slug: "gbo-us-1", vendorSlug: VENDOR_GBO, sku: "gbo:US:1" };
    assert.equal(
      productAllowedForNewShopping(product, "US", [vendor], { GBO_STOREFRONT_ENABLED: "false" }).available,
      false
    );
  });
});

describe("catalog country defaults", () => {

  it("uses USA only when the config item is missing", () => {
    const resolved = readStoredCatalogCountries(null);
    assert.equal(resolved.source, "default");
    assert.deepEqual(resolved.countries, defaultCatalogCountries());
    assert.equal(isCatalogCountryEnabled(resolved.countries, "US"), true);
    assert.equal(isCatalogCountryEnabled(resolved.countries, "GB"), false);
    assert.deepEqual(enabledCatalogCountries(resolved.countries), [{ countryCode: "US", enabled: true }]);
  });

  it("keeps a stored USA row enabled", () => {
    const resolved = readStoredCatalogCountries({
      countries: [{ countryCode: "US", enabled: true }],
      updatedAt: "2026-10-05T00:00:00.000Z",
    });
    assert.equal(resolved.source, "config");
    assert.equal(isCatalogCountryEnabled(resolved.countries, "US"), true);
    assert.equal(isCatalogCountryEnabled(resolved.countries, "GB"), false);
  });

  it("keeps both USA and the UK when both are enabled", () => {
    const normalized = normalizeCatalogCountries([
      { countryCode: "us", enabled: true },
      { countryCode: "GB", enabled: true },
    ]);
    assert.equal("countries" in normalized, true);
    if (!("countries" in normalized)) return;
    assert.deepEqual(normalized.countries, [
      { countryCode: "US", enabled: true },
      { countryCode: "GB", enabled: true },
    ]);
    assert.equal(isCatalogCountryEnabled(normalized.countries, "GB"), true);
  });

  it("stores the global list on one config key", () => {
    assert.equal(catalogCountryKeys.pk, "CONFIG#CATALOG_COUNTRIES");
    assert.equal(catalogCountryKeys.sk, "META");
    assert.equal(configKeys.catalogCountries.pk, catalogCountryKeys.pk);
  });
});

describe("catalog country validation", () => {
  it("rejects an unknown country code", () => {
    const result = normalizeCatalogCountries([
      { countryCode: "US", enabled: true },
      { countryCode: "ZZ", enabled: false },
    ]);
    assert.deepEqual(result, { error: '"ZZ" is not a known delivery country.' });
  });

  it("rejects a country code that is not ISO-2", () => {
    const result = normalizeCatalogCountries([
      { countryCode: "USA", enabled: true },
    ]);
    assert.deepEqual(result, { error: '"USA" is not a two-letter country code.' });
  });

  it("rejects a duplicate country code", () => {
    const result = normalizeCatalogCountries([
      { countryCode: "US", enabled: true },
      { countryCode: "us", enabled: false },
    ]);
    assert.deepEqual(result, { error: '"US" is listed more than once.' });
  });

  it("rejects a list with no enabled country", () => {
    const result = normalizeCatalogCountries([
      { countryCode: "US", enabled: false },
      { countryCode: "GB", enabled: false },
    ]);
    assert.deepEqual(result, { error: "At least one country must be enabled." });
  });

  it("leaves the USA shopping clamp unchanged", () => {
    assert.equal(clampShoppingCountry("GB"), "US");
    assert.equal(clampShoppingCountry("CA"), "US");
    assert.equal(isShoppingCountry("US"), true);
    assert.equal(isShoppingCountry("GB"), false);
  });
});

describe("customer country resolution", () => {
  const usaOnly = defaultCatalogCountries();
  const usaAndUk = [
    { countryCode: "US", enabled: true },
    { countryCode: "GB", enabled: true },
    { countryCode: "CA", enabled: false },
  ];

  it("keeps USA when it is the only enabled country", () => {
    assert.equal(resolveEnabledShoppingCountry("GB", usaOnly), "US");
    assert.equal(resolveEnabledShoppingCountry("CA", usaOnly), "US");
    assert.equal(resolveEnabledShoppingCountry(undefined, usaOnly), "US");
    assert.deepEqual(
      applyEnabledShoppingCountry({ countryCode: "GB", postalCode: "SW1A 1AA" }, usaOnly),
      { countryCode: "US", postalCode: "" }
    );
  });

  it("accepts USA and the UK and rejects a disabled or unknown country", () => {
    assert.equal(resolveEnabledShoppingCountry("GB", usaAndUk), "GB");
    assert.equal(resolveEnabledShoppingCountry("US", usaAndUk), "US");
    assert.equal(resolveEnabledShoppingCountry("CA", usaAndUk), "US");
    assert.equal(resolveEnabledShoppingCountry("ZZ", usaAndUk), "US");
    assert.equal(shoppingCountryRejection("CA", ["US", "GB"]), SHOPPING_COUNTRY_UNAVAILABLE_MESSAGE);
    assert.equal(shoppingCountryRejection("GB", ["US", "GB"]), null);
    assert.equal(shoppingCountryRejection("", ["US", "GB"]), null);
  });

  it("falls back to the first enabled country when USA is off", () => {
    const ukOnly = [
      { countryCode: "US", enabled: false },
      { countryCode: "GB", enabled: true },
    ];
    assert.equal(resolveEnabledShoppingCountry("US", ukOnly), "GB");
    assert.equal(resolveEnabledShoppingCountry("CA", ukOnly), "GB");
  });

  it("fails safely when no country is enabled", () => {
    assert.equal(
      resolveEnabledShoppingCountry("US", [
        { countryCode: "US", enabled: false },
        { countryCode: "GB", enabled: false },
      ]),
      null
    );
    assert.equal(applyEnabledShoppingCountry({ countryCode: "US", postalCode: "90012" }, []), null);
  });

  it("filters one vendor at a time for the selected country", () => {
    const vendors = [VENDOR_BLOSSOMPOT, VENDOR_FNP, VENDOR_ORANGE_COUNTY, VENDOR_GBO].map((slug) => {
      const vendor = defaultCatalogVendor(slug);
      if (slug === VENDOR_BLOSSOMPOT || slug === VENDOR_GBO) {
        return { ...vendor, deliveryCountries: ["US", "GB"] };
      }
      return vendor;
    });
    const fnp = { slug: "fnp-cake", vendorSlug: VENDOR_FNP };
    const blossompot = { slug: "owned-rose", vendorSlug: VENDOR_BLOSSOMPOT };
    const orange = { slug: "oc-hamper", vendorSlug: VENDOR_ORANGE_COUNTY };
    const gbo = { slug: "gbo-gb-1", vendorSlug: VENDOR_GBO, sku: "gbo:GB:1" };
    const country = resolveEnabledShoppingCountry("GB", usaAndUk);
    assert.equal(country, "GB");
    assert.equal(productAllowedForNewShopping(fnp, country, vendors).available, false);
    assert.equal(productAllowedForNewShopping(orange, country, vendors).available, false);
    assert.equal(productAllowedForNewShopping(blossompot, country, vendors).available, true);
    assert.equal(productVisibleForDeliveryCountry(blossompot, "GB"), true);
    assert.equal(productVisibleForDeliveryCountry(fnp, "GB"), true);
    assert.equal(
      productAllowedForNewShopping(gbo, country, vendors, { GBO_STOREFRONT_ENABLED: "false" }).reason,
      "gbo_storefront_disabled"
    );
    assert.equal(productVisibleForDeliveryCountry({ sku: "gbo:US:1", vendorSlug: VENDOR_GBO }, "GB"), false);
    assert.equal(productVisibleForDeliveryCountry(gbo, "GB"), true);

    const fnpOff = vendors.map((vendor) =>
      vendor.vendorSlug === VENDOR_FNP ? { ...vendor, enabled: false } : vendor
    );
    assert.equal(productAllowedForNewShopping(fnp, "US", fnpOff).available, false);
    assert.equal(productAllowedForNewShopping(blossompot, "US", fnpOff).available, true);
    assert.equal(
      productAllowedForNewShopping(gbo, "US", fnpOff, { GBO_STOREFRONT_ENABLED: "true" }).available,
      true
    );
  });

  it("does not erase vendor delivery countries when a global country is disabled", () => {
    const vendor = { ...defaultCatalogVendor(VENDOR_BLOSSOMPOT), deliveryCountries: ["US", "GB"] };
    const disabledUk = [
      { countryCode: "US", enabled: true },
      { countryCode: "GB", enabled: false },
    ];
    assert.equal(resolveEnabledShoppingCountry("GB", disabledUk), "US");
    assert.deepEqual(vendor.deliveryCountries, ["US", "GB"]);
    const reenabled = [
      { countryCode: "US", enabled: true },
      { countryCode: "GB", enabled: true },
    ];
    assert.equal(resolveEnabledShoppingCountry("GB", reenabled), "GB");
    assert.equal(productAllowedForNewShopping({ slug: "owned-rose" }, "GB", [vendor]).available, true);
  });

  it("keeps Orange County ZIP prefixes and does not use them outside the US", () => {
    const prefixes = defaultOrangeCountyAreas().map((area) => area.postalPrefix);
    assert.deepEqual(prefixes, ["926", "927", "928", "906", "907"]);
    const vendor = defaultCatalogVendor(VENDOR_ORANGE_COUNTY);
    assert.equal(
      vendorCoversShoppingCountryWithoutArea(vendor, "US", "no_matching_service_area"),
      false
    );
    assert.equal(
      vendorCoversShoppingCountryWithoutArea(
        { ...vendor, deliveryCountries: ["US", "GB"] },
        "GB",
        "no_matching_service_area"
      ),
      true
    );
    assert.equal(
      vendorCoversShoppingCountryWithoutArea(vendor, "GB", "denied"),
      false
    );
  });

  it("shows nothing for Serbia until a vendor delivers there", () => {
    const enabled = [
      { countryCode: "US", enabled: true },
      { countryCode: "RS", enabled: true },
    ];
    assert.equal(resolveEnabledShoppingCountry("RS", enabled), "RS");
    const defaults = [VENDOR_BLOSSOMPOT, VENDOR_FNP, VENDOR_ORANGE_COUNTY, VENDOR_GBO].map((slug) =>
      defaultCatalogVendor(slug)
    );
    const fnp = { slug: "fnp-cake", vendorSlug: VENDOR_FNP };
    const owned = { slug: "owned-rose", vendorSlug: VENDOR_BLOSSOMPOT };
    const orange = { slug: "oc-hamper", vendorSlug: VENDOR_ORANGE_COUNTY };
    assert.equal(productAllowedForNewShopping(fnp, "RS", defaults).available, false);
    assert.equal(productAllowedForNewShopping(owned, "RS", defaults).available, false);
    assert.equal(productAllowedForNewShopping(orange, "RS", defaults).available, false);
    assert.equal(productAllowedForNewShopping(fnp, "RS", defaults).reason, "country_not_allowed");
    const serbiaVendor = defaults.map((vendor) =>
      vendor.vendorSlug === VENDOR_BLOSSOMPOT ? { ...vendor, deliveryCountries: ["US", "RS"] } : vendor
    );
    assert.equal(productAllowedForNewShopping(owned, "RS", serbiaVendor).available, true);
    assert.equal(productAllowedForNewShopping(fnp, "RS", serbiaVendor).available, false);
    assert.equal(productKeptForServiceableVendors(owned, [], true, "RS"), false);
    assert.equal(productKeptForServiceableVendors(owned, [VENDOR_BLOSSOMPOT], true, "RS"), true);
    assert.equal(productKeptForServiceableVendors(fnp, [VENDOR_BLOSSOMPOT], true, "RS"), false);
    assert.equal(productKeptForServiceableVendors(owned, [], true, "US"), true);
    assert.equal(noProductsForDeliveryCountryMessage("RS"), "No products are currently available for delivery to Serbia.");
  });
});
