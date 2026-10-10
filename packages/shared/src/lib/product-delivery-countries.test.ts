import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VENDOR_BLOSSOMPOT, VENDOR_GBO } from "../constants";
import { defaultCatalogVendor, productAllowedForNewShopping } from "./catalog-vendors";
import { productVisibleForDeliveryCountry } from "./gbo";
import { stripVendorPrivateFields } from "./vendor-pricing";

const vendor = { ...defaultCatalogVendor(VENDOR_BLOSSOMPOT), deliveryCountries: ["US", "GB"] };

describe("product delivery countries", () => {
  it("keeps vendor coverage when the product field is absent", () => {
    const product = { slug: "owned-rose", vendorSlug: VENDOR_BLOSSOMPOT };
    assert.equal(productAllowedForNewShopping(product, "GB", [vendor]).available, true);
    assert.equal(productAllowedForNewShopping(product, "US", [vendor]).available, true);
    assert.equal(productVisibleForDeliveryCountry(product, "GB"), true);
  });

  it("rejects a US-only product for GB and still allows US", () => {
    const product = { slug: "owned-rose", vendorSlug: VENDOR_BLOSSOMPOT, deliveryCountries: ["US"] };
    assert.equal(productVisibleForDeliveryCountry(product, "US"), true);
    assert.equal(productVisibleForDeliveryCountry(product, "GB"), false);
    const blocked = productAllowedForNewShopping(product, "GB", [vendor]);
    assert.equal(blocked.available, false);
    assert.equal(blocked.reason, "country_not_allowed");
    assert.equal(productAllowedForNewShopping(product, "US", [vendor]).available, true);
  });

  it("does not let a product country list widen vendor coverage", () => {
    const product = { slug: "owned-rose", vendorSlug: VENDOR_BLOSSOMPOT, deliveryCountries: ["US", "FR"] };
    assert.equal(productAllowedForNewShopping(product, "FR", [vendor]).available, false);
    assert.equal(productAllowedForNewShopping(product, "GB", [vendor]).available, false);
    assert.equal(productAllowedForNewShopping(product, "US", [vendor]).available, true);
  });

  it("keeps GBO country matching on the SKU and ignores deliveryCountries", () => {
    const gbo = { ...defaultCatalogVendor(VENDOR_GBO), deliveryCountries: ["US", "GB"] };
    const product = { sku: "gbo:US:1", slug: "gbo-us-1-basket", vendorSlug: VENDOR_GBO, deliveryCountries: ["GB"] };
    const env = { GBO_STOREFRONT_ENABLED: "true" };
    assert.equal(productVisibleForDeliveryCountry(product, "US"), true);
    assert.equal(productVisibleForDeliveryCountry(product, "GB"), false);
    assert.equal(productAllowedForNewShopping(product, "US", [gbo], env).available, true);
    assert.equal(productAllowedForNewShopping({ ...product, deliveryCountries: ["US"] }, "GB", [gbo], env).available, true);
  });

  it("keeps vendor cost off the public product", () => {
    const card = stripVendorPrivateFields({
      slug: "rose",
      vendorSlug: VENDOR_BLOSSOMPOT,
      vendorCost: 8,
      deliveryCountries: ["US"],
      price: 20,
    });
    assert.equal("vendorCost" in card, false);
    assert.deepEqual(card.deliveryCountries, ["US"]);
  });
});
