import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VENDOR_BLOSSOMPOT, VENDOR_FNP, VENDOR_GBO, VENDOR_ORANGE_COUNTY } from "../constants";
import { catalogVendorKeys, marketplaceVendorKeys } from "../db/keys";
import { buildFnpProductDraft, fnpImportWriteBlocked } from "./fnp-import";
import { clampShoppingCountry } from "./postal-countries";
import { productVisibleForDeliveryCountry } from "./gbo";
import { defaultOrangeCountyAreas } from "./serviceability";
import { CATALOG_VENDOR_SLUGS } from "../schemas/catalog-vendor";
import {
  catalogVendorShoppingStatus,
  defaultCatalogVendor,
  isCatalogVendorKey,
  isCatalogVendorSlug,
  isMarketplaceVendorKey,
  normalizeDeliveryCountries,
  productAllowedForNewShopping,
  readStoredCatalogVendor,
} from "./catalog-vendors";
import type { FnpImportPlanRow } from "./fnp-import";

describe("catalog vendor defaults", () => {
  it("returns the safe default when no config item exists", () => {
    const resolved = readStoredCatalogVendor(VENDOR_ORANGE_COUNTY, null);
    assert.equal(resolved.source, "default");
    assert.equal(resolved.vendor.enabled, true);
    assert.deepEqual(resolved.vendor.deliveryCountries, ["US"]);
    assert.equal(resolved.vendor.integrationType, "local-catalog");
    assert.equal(resolved.vendor.vendorName, "Orange County");
  });

  it("represents the four catalog vendors", () => {
    assert.deepEqual(CATALOG_VENDOR_SLUGS, [
      VENDOR_BLOSSOMPOT,
      VENDOR_ORANGE_COUNTY,
      VENDOR_GBO,
      VENDOR_FNP,
    ]);
    assert.equal(defaultCatalogVendor("blossompot").integrationType, "owned");
    assert.equal(defaultCatalogVendor("gift-baskets-overseas").integrationType, "partner-api");
    assert.equal(defaultCatalogVendor("fnp").integrationType, "excel");
    assert.equal(defaultCatalogVendor("fnp").enabled, true);
    assert.deepEqual(defaultCatalogVendor("fnp").deliveryCountries, ["US"]);
    assert.equal(defaultCatalogVendor("blossompot").displayOrder, 1);
    assert.equal(defaultCatalogVendor("orange-county").displayOrder, 2);
    assert.equal(defaultCatalogVendor("gift-baskets-overseas").displayOrder, 3);
    assert.equal(defaultCatalogVendor("fnp").displayOrder, 4);
  });

  it("keeps catalog vendor keys separate from marketplace vendors", () => {
    assert.equal(catalogVendorKeys.pk("fnp"), "CATALOGVENDOR#fnp");
    assert.equal(catalogVendorKeys.sk(), "META");
    assert.equal(marketplaceVendorKeys.pk("vendor-123"), "MVENDOR#vendor-123");
    assert.equal(isCatalogVendorKey("CATALOGVENDOR#orange-county"), true);
    assert.equal(isMarketplaceVendorKey("CATALOGVENDOR#orange-county"), false);
    assert.equal(isMarketplaceVendorKey("MVENDOR#vendor-123"), true);
    assert.equal(isCatalogVendorKey("MVENDOR#vendor-123"), false);
    assert.equal(isCatalogVendorSlug("fnp"), true);
    assert.equal(isCatalogVendorSlug("sample-florist"), false);
  });

  it("normalizes duplicate country codes and rejects values that are not ISO-2", () => {
    assert.deepEqual(normalizeDeliveryCountries(["us", "US", " us "]), { countries: ["US"] });
    const invalid = normalizeDeliveryCountries(["USA"]);
    assert.equal("error" in invalid, true);
  });

  it("reports an environment block when GBO is catalog-enabled but the storefront flag is off", () => {
    const vendor = defaultCatalogVendor(VENDOR_GBO);
    assert.equal(vendor.enabled, true);
    const blocked = catalogVendorShoppingStatus(vendor, { GBO_STOREFRONT_ENABLED: "false" });
    assert.equal(blocked.shoppingAvailable, false);
    assert.equal(blocked.storefrontEnvEnabled, false);
    assert.equal(blocked.storefrontBlockReason, "Blocked by environment");
    const open = catalogVendorShoppingStatus(vendor, { GBO_STOREFRONT_ENABLED: "true" });
    assert.equal(open.shoppingAvailable, true);
    assert.equal(open.storefrontBlockReason, null);
  });
});

describe("phase 3 leaves existing catalog behavior in place", () => {
  it("keeps Orange County ZIP prefixes", () => {
    assert.deepEqual(
      defaultOrangeCountyAreas().map((area) => area.postalPrefix),
      ["926", "927", "928", "906", "907"]
    );
    assert.equal(
      defaultOrangeCountyAreas().every((area) => area.scope === "POSTAL_PREFIX" && area.countryCode === "US"),
      true
    );
  });

  it("keeps FNP drafts unpublished, unstocked, and without a vendor slug", () => {
    const row: FnpImportPlanRow = {
      row: 1,
      status: "ready",
      name: "Petite Midnight Chocolate Cake",
      slug: "petite-midnight-chocolate-cake",
      sourceUrl: "https://www.fnp.com/usa/gift/petite-midnight-chocolate-cake",
      sourceKey: "fnp:example",
      imageUrl: "https://static-assets-prod.fnp.com/example.jpg",
      categorySlug: "cakes",
      categoryName: "Cakes",
      categoryAction: "reuse",
      unmatchedCategory: null,
      sourceSerial: "1",
      price: 49.99,
      errors: [],
      warnings: [],
      input: {},
    };
    const draft = buildFnpProductDraft({
      row,
      batchId: "batch-test-1",
      imageUrl: "https://cdn.example.com/cake.jpg",
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(draft.published, false);
    assert.equal(draft.inventory, 0);
    assert.equal(draft.vendorSlug, "fnp");
    assert.equal(fnpImportWriteBlocked({ environment: "prod" }).blocked, true);
  });

  it("keeps the USA clamp helper and lets vendor delivery decide local products", () => {
    assert.equal(clampShoppingCountry("GB"), "US");
    assert.equal(productVisibleForDeliveryCountry({ slug: "rakhi-hamper" }, "US"), true);
    assert.equal(productVisibleForDeliveryCountry({ slug: "rakhi-hamper" }, "GB"), true);
  });
});

describe("new shopping vendor gate", () => {
  const vendors = CATALOG_VENDOR_SLUGS.map((slug) => defaultCatalogVendor(slug));

  it("shows a product while its catalog vendor is enabled", () => {
    const decision = productAllowedForNewShopping({ slug: "rose", vendorSlug: "orange-county" }, "US", vendors);
    assert.equal(decision.available, true);
    assert.equal(decision.vendorSlug, "orange-county");
  });

  it("hides a product when its catalog vendor is disabled and shows it again when re-enabled", () => {
    const disabled = vendors.map((vendor) =>
      vendor.vendorSlug === "orange-county" ? { ...vendor, enabled: false } : vendor
    );
    const off = productAllowedForNewShopping({ slug: "rose", vendorSlug: "orange-county" }, "US", disabled);
    assert.equal(off.available, false);
    assert.equal(off.reason, "vendor_disabled");
    const on = productAllowedForNewShopping({ slug: "rose", vendorSlug: "orange-county" }, "US", vendors);
    assert.equal(on.available, true);
  });

  it("keeps GBO available only when the catalog vendor and the environment flag are both on", () => {
    const product = { slug: "gbo-us-1", vendorSlug: "gift-baskets-overseas" };
    const open = productAllowedForNewShopping(product, "US", vendors, { GBO_STOREFRONT_ENABLED: "true" });
    assert.equal(open.available, true);

    const catalogOff = vendors.map((vendor) =>
      vendor.vendorSlug === "gift-baskets-overseas" ? { ...vendor, enabled: false } : vendor
    );
    const catalogBlocked = productAllowedForNewShopping(product, "US", catalogOff, {
      GBO_STOREFRONT_ENABLED: "true",
    });
    assert.equal(catalogBlocked.available, false);
    assert.equal(catalogBlocked.reason, "vendor_disabled");

    const envBlocked = productAllowedForNewShopping(product, "US", vendors, { GBO_STOREFRONT_ENABLED: "false" });
    assert.equal(envBlocked.available, false);
    assert.equal(envBlocked.reason, "gbo_storefront_disabled");
  });

  it("treats a missing vendor slug as BlossomPot and does not classify it as FNP", () => {
    const decision = productAllowedForNewShopping({ slug: "owned-rose" }, "US", vendors);
    assert.equal(decision.available, true);
    assert.equal(decision.vendorSlug, VENDOR_BLOSSOMPOT);
    assert.notEqual(decision.vendorSlug, VENDOR_FNP);
  });

  it("recognizes an FNP product by vendorSlug", () => {
    const open = productAllowedForNewShopping({ slug: "fnp-cake", vendorSlug: "fnp" }, "US", vendors);
    assert.equal(open.available, true);
    assert.equal(open.vendorSlug, VENDOR_FNP);
    const disabled = vendors.map((vendor) => (vendor.vendorSlug === "fnp" ? { ...vendor, enabled: false } : vendor));
    const closed = productAllowedForNewShopping({ slug: "fnp-cake", vendorSlug: "fnp" }, "US", disabled);
    assert.equal(closed.available, false);
    assert.equal(closed.reason, "vendor_disabled");
  });

  it("hides GBO when the vendor is disabled, the country is not delivered, or the SKU country differs", () => {
    const env = { GBO_STOREFRONT_ENABLED: "true" };
    const product = { slug: "gbo-us-9", sku: "gbo:US:9", vendorSlug: VENDOR_GBO };
    const disabled = vendors.map((vendor) =>
      vendor.vendorSlug === VENDOR_GBO ? { ...vendor, enabled: false } : vendor
    );
    const vendorOff = productAllowedForNewShopping(product, "US", disabled, env);
    assert.equal(vendorOff.available, false);
    assert.equal(vendorOff.reason, "vendor_disabled");

    const elsewhere = vendors.map((vendor) =>
      vendor.vendorSlug === VENDOR_GBO ? { ...vendor, deliveryCountries: ["GB"] } : vendor
    );
    const wrongCountry = productAllowedForNewShopping(product, "US", elsewhere, env);
    assert.equal(wrongCountry.available, false);
    assert.equal(wrongCountry.reason, "country_not_allowed");

    assert.equal(productVisibleForDeliveryCountry(product, "GB"), false);
    assert.equal(productVisibleForDeliveryCountry(product, "US"), true);
  });

  it("does not open a USA catalog vendor for a non-US country", () => {
    const decision = productAllowedForNewShopping({ slug: "rose", vendorSlug: "blossompot" }, "GB", vendors);
    assert.equal(decision.available, false);
    assert.equal(decision.reason, "country_not_allowed");
    assert.equal(clampShoppingCountry("GB"), "US");
  });
});
