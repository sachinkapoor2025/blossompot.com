import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { geoPageDescription, geoPageTitle, type GeoLocation } from "./location-label";

function location(overrides: Pick<GeoLocation, "type" | "slug" | "name" | "stateAbbr"> & Partial<GeoLocation>): GeoLocation {
  return {
    state: overrides.name,
    timezone: "America/Los_Angeles",
    cutoffTimeLocal: "3:00 PM",
    deliveryWindow: "Same day when available",
    nearbyAreas: [],
    zipPrefixes: [],
    localFaqs: [],
    introParagraph: "",
    region: overrides.type,
    ...overrides,
  };
}

describe("geo page titles", () => {
  it("names the state without claiming same-day delivery", () => {
    const title = geoPageTitle(
      location({ type: "state", slug: "california", name: "California", stateAbbr: "CA" })
    );
    assert.equal(title, "Send Flowers, Cakes & Gifts to California | BlossomPot");
    assert.doesNotMatch(title, /same-day/i);
  });

  it("names the city and state without claiming same-day delivery", () => {
    const city = location({
      type: "city",
      slug: "los-angeles",
      name: "Los Angeles",
      state: "California",
      stateAbbr: "CA",
    });
    const title = geoPageTitle(city);
    assert.equal(title, "Send Flowers, Cakes & Gifts to Los Angeles, CA | BlossomPot");
    assert.doesNotMatch(title, /same-day/i);
    assert.match(geoPageDescription(city), /select ZIPs/i);
  });
});
