import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { navItems } from "./site";

describe("main navigation", () => {
  it("places Combos after Hampers and links it to /combos", () => {
    const labels = navItems.map((item) => item.label);
    assert.deepEqual(labels, [
      "Home",
      "Flowers",
      "Bouquets",
      "Cakes",
      "Birthday",
      "Anniversary",
      "Valentine's",
      "Hampers",
      "Combos",
      "Gift Catalog",
      "Remember",
    ]);

    const combos = navItems.find((item) => item.label === "Combos");
    assert.equal(combos?.href, "/combos");
    assert.equal("category" in (combos ?? {}), false);
    assert.equal(navItems.filter((item) => item.label === "Combos").length, 1);
  });
});
