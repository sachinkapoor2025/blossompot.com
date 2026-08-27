import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DELIVERY_COUNTRIES,
  enabledDeliveryCountries,
  getDeliveryCountry,
  isValidPostal,
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

  it("does not include countries outside the served set", () => {
    const codes = new Set(DELIVERY_COUNTRIES.map((c) => c.countryCode));
    assert.equal(codes.has("IN"), false);
    assert.equal(codes.has("CN"), false);
    assert.equal(codes.has("BR"), false);
  });
});
