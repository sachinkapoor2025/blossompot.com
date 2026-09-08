import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DELIVERY_COUNTRIES,
  enabledDeliveryCountries,
  getDeliveryCountry,
  isValidPostal,
  mergeGboDeliveryCountries,
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
  });
});
