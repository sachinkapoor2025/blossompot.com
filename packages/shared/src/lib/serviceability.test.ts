import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VENDOR_BLOSSOMPOT } from "../constants";
import {
  checkVendorServiceability,
  defaultBlossompotAreas,
  getServiceableVendors,
  type VendorServiceArea,
} from "./serviceability";
import { isValidPostal, normalizePostal } from "./postal-countries";

function area(partial: Partial<VendorServiceArea> & Pick<VendorServiceArea, "scope" | "ruleType">): VendorServiceArea {
  return {
    areaId: partial.areaId ?? "a1",
    vendorSlug: partial.vendorSlug ?? "vendor-a",
    countryCode: partial.countryCode ?? "US",
    isActive: partial.isActive ?? true,
    ...partial,
  };
}

describe("postal normalize", () => {
  it("normalizes US ZIP+4 to 5 digits", () => {
    assert.equal(normalizePostal("US", "90012-1234"), "90012");
  });
  it("normalizes Canadian postal codes", () => {
    assert.equal(normalizePostal("CA", "m5v 3a8"), "M5V3A8");
    assert.equal(isValidPostal("CA", "M5V 3A8"), true);
  });
});

describe("serviceability engine", () => {
  it("scenario 1: exact / prefix 90012 is serviceable", () => {
    const areas = [area({ scope: "POSTAL_PREFIX", ruleType: "ALLOW", postalPrefix: "900" })];
    const r = checkVendorServiceability("vendor-a", areas, { countryCode: "US", postalCode: "90012" });
    assert.equal(r.serviceable, true);
    assert.equal(r.matchedRule?.scope, "POSTAL_PREFIX");
  });

  it("scenario 2: NY ZIP does not match CA-only vendor", () => {
    const areas = [area({ scope: "STATE", ruleType: "ALLOW", stateCode: "CA" })];
    const r = checkVendorServiceability("vendor-a", areas, {
      countryCode: "US",
      postalCode: "10001",
      stateCode: "NY",
    });
    assert.equal(r.serviceable, false);
  });

  it("scenario 3: ALLOW California DENY 900* → 90012 not serviceable", () => {
    const areas = [
      area({ areaId: "ca", scope: "STATE", ruleType: "ALLOW", stateCode: "CA" }),
      area({ areaId: "deny", scope: "POSTAL_PREFIX", ruleType: "DENY", postalPrefix: "900" }),
    ];
    const r = checkVendorServiceability("vendor-a", areas, {
      countryCode: "US",
      postalCode: "90012",
      stateCode: "CA",
    });
    assert.equal(r.serviceable, false);
    assert.equal(r.reason, "denied");
  });

  it("scenario 4: prefix 900* matches 90012", () => {
    const areas = [area({ scope: "POSTAL_PREFIX", ruleType: "ALLOW", postalPrefix: "900*" })];
    assert.equal(
      checkVendorServiceability("vendor-a", areas, { countryCode: "US", postalCode: "90012" }).serviceable,
      true
    );
  });

  it("scenario 5: prefix 900* does not match 94105", () => {
    const areas = [area({ scope: "POSTAL_PREFIX", ruleType: "ALLOW", postalPrefix: "900" })];
    assert.equal(
      checkVendorServiceability("vendor-a", areas, { countryCode: "US", postalCode: "94105" }).serviceable,
      false
    );
  });

  it("scenario 6: multiple vendors for same ZIP", () => {
    const areas = [
      area({ vendorSlug: "vendor-a", scope: "POSTAL_PREFIX", ruleType: "ALLOW", postalPrefix: "900" }),
      area({ vendorSlug: "vendor-b", scope: "COUNTRY", ruleType: "ALLOW" }),
    ];
    const matches = getServiceableVendors(areas, { countryCode: "US", postalCode: "90012" }, [
      "vendor-a",
      "vendor-b",
      "vendor-c",
    ]);
    assert.deepEqual(matches.map((m) => m.vendorSlug).sort(), ["vendor-a", "vendor-b"]);
  });

  it("BlossomPot default country US covers any US ZIP", () => {
    const r = checkVendorServiceability(VENDOR_BLOSSOMPOT, defaultBlossompotAreas(), {
      countryCode: "US",
      postalCode: "10001",
    });
    assert.equal(r.serviceable, true);
  });

  it("BlossomPot default does not cover Canada", () => {
    const r = checkVendorServiceability(VENDOR_BLOSSOMPOT, defaultBlossompotAreas(), {
      countryCode: "CA",
      postalCode: "M5V 3A8",
    });
    assert.equal(r.serviceable, false);
  });

  it("Canada prefix M5V matches M5V 3A8", () => {
    const areas = [
      area({
        vendorSlug: "vendor-d",
        countryCode: "CA",
        scope: "POSTAL_PREFIX",
        ruleType: "ALLOW",
        postalPrefix: "M5V",
      }),
    ];
    const r = checkVendorServiceability("vendor-d", areas, { countryCode: "CA", postalCode: "M5V 3A8" });
    assert.equal(r.serviceable, true);
  });
});
