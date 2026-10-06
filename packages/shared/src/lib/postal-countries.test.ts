import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DELIVERY_COUNTRIES,
  clampShoppingCountry,
  enabledDeliveryCountries,
  getDeliveryCountry,
  isShoppingCountry,
  isValidPostal,
  mergeGboDeliveryCountries,
  nonUsDeliveryRejection,
  shoppingCatalogLocation,
  USA_ONLY_DELIVERY_MESSAGE,
} from "./postal-countries";

describe("delivery countries", () => {
  it("does not list India as a delivery country", () => {
    assert.equal(getDeliveryCountry("IN"), undefined);
    assert.equal(
      enabledDeliveryCountries().some((c) => c.countryCode === "IN"),
      false
    );
  });

  it("includes USA, Canada, Australia, UAE and European markets", () => {
    for (const code of ["US", "CA", "AU", "AE", "GB", "DE", "FR", "PL", "PT", "IE"]) {
      const cfg = getDeliveryCountry(code);
      assert.ok(cfg?.enabled, `expected ${code} to be enabled`);
    }
  });

  it("validates UAE five-digit postal codes", () => {
    assert.equal(isValidPostal("AE", "00000"), true);
    assert.equal(isValidPostal("AE", "12"), false);
  });

  it("accepts GBO worldwide postals when the country is not in the curated list", () => {
    assert.equal(isValidPostal("IN", "110001"), true);
    assert.equal(isValidPostal("JP", "100-0001"), true);
    assert.equal(isValidPostal("IN", "x"), false);
  });

  it("merges GBO countries onto the curated list", () => {
    const merged = mergeGboDeliveryCountries([
      { iso_code: "IN", country: "India" },
      { iso_code: "US", country: "United States" },
    ]);
    assert.equal(merged.some((c) => c.countryCode === "IN"), true);
    assert.equal(merged.find((c) => c.countryCode === "US")?.countryName, "United States");
    assert.ok(merged.length > 1);
  });

  it("keeps shopping in the United States without removing other countries", () => {
    assert.equal(clampShoppingCountry("US"), "US");
    assert.equal(clampShoppingCountry("us"), "US");
    assert.equal(clampShoppingCountry("GB"), "US");
    assert.equal(clampShoppingCountry("CA"), "US");
    assert.equal(clampShoppingCountry(""), "US");
    assert.equal(isShoppingCountry("US"), true);
    assert.equal(isShoppingCountry("GB"), false);
    assert.ok(getDeliveryCountry("GB")?.enabled);
    assert.ok(DELIVERY_COUNTRIES.length > 1);
  });

  it("normalizes catalog filters to the US and drops foreign postal codes", () => {
    assert.deepEqual(shoppingCatalogLocation("US", "90012"), {
      countryCode: "US",
      postalCode: "90012",
    });
    assert.equal(shoppingCatalogLocation("US", "AB1"), null);
    assert.deepEqual(shoppingCatalogLocation("GB", "SW1A 1AA"), {
      countryCode: "US",
      postalCode: "",
    });
    assert.deepEqual(shoppingCatalogLocation("CA", "K1A 0B1"), {
      countryCode: "US",
      postalCode: "",
    });
    assert.equal(shoppingCatalogLocation("", "90012"), null);
  });

  it("rejects a non-US delivery country and allows a blank or US value", () => {
    assert.equal(nonUsDeliveryRejection("GB"), USA_ONLY_DELIVERY_MESSAGE);
    assert.equal(nonUsDeliveryRejection("ca"), USA_ONLY_DELIVERY_MESSAGE);
    assert.equal(nonUsDeliveryRejection("US"), null);
    assert.equal(nonUsDeliveryRejection(""), null);
    assert.equal(nonUsDeliveryRejection(undefined), null);
  });
});
