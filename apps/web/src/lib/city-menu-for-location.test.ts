import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cityLinks, cityNavHref } from "./site";
import { cityMenuForCountry } from "./city-menu-for-location";

describe("US city nav list", () => {
  it("keeps featured metros after New Jersey on gifts-to URLs", () => {
    const jersey = cityLinks.findIndex((link) => link.slug === "new-jersey");
    assert.ok(jersey >= 0);
    const after = cityLinks.slice(jersey + 1).map((link) => link.slug);
    for (const slug of ["los-angeles", "chicago", "miami", "denver"]) {
      assert.ok(after.includes(slug), slug);
      const link = cityLinks.find((row) => row.slug === slug);
      assert.equal(cityNavHref(link!), `/gifts-to-${slug}`);
    }
  });

  it("scopes the Cities menu to the selected country", () => {
    const us = cityMenuForCountry("US");
    assert.ok(us.links.some((link) => link.slug === "los-angeles"));
    const gb = cityMenuForCountry("GB");
    assert.equal(
      gb.links.some((link) => link.slug === "los-angeles"),
      false
    );
  });
});
