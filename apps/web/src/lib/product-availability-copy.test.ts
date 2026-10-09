import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATALOG_VENDOR_UNAVAILABLE_MESSAGE,
  GBO_STOREFRONT_UNAVAILABLE_MESSAGE,
} from "@blossompot/shared";
import {
  availabilityAllowsPurchase,
  PRODUCT_AVAILABILITY_REASONS,
  productAvailabilityNotice,
  UNAVAILABLE_PAGE_ALLOWS_PURCHASE,
} from "./product-availability-copy";

const countryName = "United States";

describe("product detail availability reasons", () => {
  it("keeps a country mismatch on the existing country explanation", () => {
    const notice = productAvailabilityNotice({
      productName: "Rose bouquet",
      countryName,
      reason: "country_not_allowed",
      visibleForCountry: true,
    });
    assert.equal(notice.countryMismatch, true);
    assert.match(notice.heading, /not available for United States/);
    assert.match(notice.body, /different delivery country/);
  });

  it("uses the country explanation when the product is hidden for that country", () => {
    const notice = productAvailabilityNotice({
      productName: "London hamper",
      countryName,
      reason: "matched",
      visibleForCountry: false,
    });
    assert.equal(notice.countryMismatch, true);
    assert.match(notice.body, /different delivery country/);
  });

  it("keeps a disabled vendor ahead of a country mismatch", () => {
    const notice = productAvailabilityNotice({
      productName: "Rose bouquet",
      countryName,
      reason: "vendor_disabled",
      visibleForCountry: false,
    });
    assert.equal(notice.countryMismatch, false);
    assert.equal(notice.body, CATALOG_VENDOR_UNAVAILABLE_MESSAGE);
    assert.doesNotMatch(notice.body, /different delivery country/);
  });

  it("keeps a disabled GBO storefront ahead of a country mismatch", () => {
    const notice = productAvailabilityNotice({
      productName: "Overseas hamper",
      countryName,
      reason: "gbo_storefront_disabled",
      visibleForCountry: false,
    });
    assert.equal(notice.countryMismatch, false);
    assert.equal(notice.body, GBO_STOREFRONT_UNAVAILABLE_MESSAGE);
    assert.doesNotMatch(notice.body, /different delivery country/);
  });

  it("hides purchase controls on the unavailable product page", () => {
    assert.equal(UNAVAILABLE_PAGE_ALLOWS_PURCHASE, false);
  });

  it("rejects a deliverable flag that carries a blocking reason", () => {
    assert.equal(availabilityAllowsPurchase({ deliverable: true, reason: "vendor_disabled" }), false);
    assert.equal(
      availabilityAllowsPurchase({ deliverable: true, reason: "gbo_storefront_disabled" }),
      false
    );
    assert.equal(availabilityAllowsPurchase({ deliverable: true, reason: "matched" }), true);
    assert.equal(availabilityAllowsPurchase({ deliverable: true }), true);
    assert.equal(availabilityAllowsPurchase({ deliverable: false, reason: "matched" }), false);
  });

  it("describes a disabled vendor as unavailable", () => {
    const notice = productAvailabilityNotice({
      productName: "Rose bouquet",
      countryName,
      reason: "vendor_disabled",
      visibleForCountry: true,
    });
    assert.equal(notice.countryMismatch, false);
    assert.equal(notice.body, CATALOG_VENDOR_UNAVAILABLE_MESSAGE);
    assert.doesNotMatch(notice.body, /different delivery country/);
    assert.doesNotMatch(notice.heading, /United States/);
  });

  it("describes a disabled GBO storefront as unavailable", () => {
    const notice = productAvailabilityNotice({
      productName: "Overseas hamper",
      countryName,
      reason: "gbo_storefront_disabled",
      visibleForCountry: true,
    });
    assert.equal(notice.countryMismatch, false);
    assert.equal(notice.body, GBO_STOREFRONT_UNAVAILABLE_MESSAGE);
    assert.doesNotMatch(notice.body, /different delivery country/);
  });

  it("describes an inactive vendor as unavailable", () => {
    const notice = productAvailabilityNotice({
      productName: "Rose bouquet",
      countryName,
      reason: "inactive_vendor",
      visibleForCountry: true,
    });
    assert.equal(notice.countryMismatch, false);
    assert.equal(notice.body, CATALOG_VENDOR_UNAVAILABLE_MESSAGE);
    assert.doesNotMatch(notice.body, /different delivery country/);
  });

  it("describes a ZIP miss as an address failure", () => {
    const notice = productAvailabilityNotice({
      productName: "Orange County hamper",
      countryName,
      reason: "no_matching_service_area",
      visibleForCountry: true,
    });
    assert.equal(notice.countryMismatch, false);
    assert.match(notice.body, /not available for delivery to this ZIP code/);
    assert.doesNotMatch(`${notice.heading} ${notice.body}`, /different delivery country/);
  });

  it("describes a denied service area as an address failure", () => {
    const notice = productAvailabilityNotice({
      productName: "Orange County hamper",
      countryName,
      reason: "denied",
      visibleForCountry: true,
    });
    assert.equal(notice.countryMismatch, false);
    assert.match(notice.body, /ZIP code/);
    assert.doesNotMatch(notice.body, /different delivery country/);
  });

  it("describes an invalid location as a ZIP requirement", () => {
    const notice = productAvailabilityNotice({
      productName: "Rose bouquet",
      countryName,
      reason: "invalid_location",
      visibleForCountry: true,
    });
    assert.equal(notice.countryMismatch, false);
    assert.match(notice.body, /ZIP code/);
    assert.doesNotMatch(notice.body, /different delivery country/);
  });

  it("fails closed when delivery was not verified", () => {
    const notice = productAvailabilityNotice({
      productName: "Rose bouquet",
      countryName,
      visibleForCountry: true,
    });
    assert.equal(notice.countryMismatch, false);
    assert.match(notice.body, /cannot be purchased until availability is verified/);
    assert.doesNotMatch(notice.body, /different delivery country/);
  });

  it("covers every reason the product API currently produces", () => {
    assert.deepEqual(PRODUCT_AVAILABILITY_REASONS, [
      "vendor_disabled",
      "gbo_storefront_disabled",
      "country_not_allowed",
      "no_matching_service_area",
      "denied",
      "inactive_vendor",
      "invalid_location",
    ]);
    for (const reason of PRODUCT_AVAILABILITY_REASONS) {
      const notice = productAvailabilityNotice({
        productName: "Sample gift",
        countryName,
        reason,
        visibleForCountry: true,
      });
      if (reason === "country_not_allowed") {
        assert.equal(notice.countryMismatch, true);
      } else {
        assert.equal(notice.countryMismatch, false, reason);
        assert.doesNotMatch(notice.body, /different delivery country/, reason);
      }
    }
  });
});
