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
      "Christmas",
      "New Year",
      "Valentine's",
      "Hampers",
      "Combos to USA",
      "Flower & Cake Combo",
    ]);

    const christmas = navItems.find((item) => item.label === "Christmas");
    const newYear = navItems.find((item) => item.label === "New Year");
    const valentines = navItems.find((item) => item.label === "Valentine's");
    assert.equal(christmas?.href, "/christmas-gifts");
    assert.equal(newYear?.href, "/new-year-gifts");
    assert.equal(valentines?.href, "/valentines-day-gifts");
    assert.ok(labels.indexOf("Christmas") === labels.indexOf("New Year") - 1);
    assert.ok(labels.indexOf("New Year") === labels.indexOf("Valentine's") - 1);

    const combos = navItems.find((item) => item.label === "Combos to USA");
    assert.equal(combos?.href, "/combos");
    assert.equal("category" in (combos ?? {}), false);
    assert.equal(navItems.filter((item) => item.label === "Combos to USA").length, 1);
  });
});
