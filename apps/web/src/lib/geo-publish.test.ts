import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getGeoLocation, isGeoPublished } from "./content/geo/locations";

describe("featured US city publish", () => {
  it("publishes featured metros after New Jersey even on the states wave", () => {
    for (const slug of ["los-angeles", "chicago", "miami", "denver", "new-jersey"]) {
      const geo = getGeoLocation(slug);
      assert.ok(geo, slug);
      assert.equal(isGeoPublished(geo!, "states"), true, slug);
    }
  });
});
