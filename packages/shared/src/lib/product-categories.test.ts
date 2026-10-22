import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assignProductCategories } from "./product-categories";

const known = new Set(["flowers", "cakes", "anniversary-gifts"]);

describe("product category assignment", () => {
  it("requires a known primary category", () => {
    assert.equal(assignProductCategories({ categorySlug: "", knownSlugs: known }).ok, false);
    assert.equal(assignProductCategories({ categorySlug: "   ", knownSlugs: known }).ok, false);
    const missing = assignProductCategories({ categorySlug: "not-a-category", knownSlugs: known });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.match(missing.error, /not-a-category/);
  });

  it("keeps valid additional categories and drops a repeated primary", () => {
    const assigned = assignProductCategories({
      categorySlug: "flowers",
      additionalCategorySlugs: ["flowers", "cakes", "cakes", " anniversary-gifts "],
      knownSlugs: known,
    });
    assert.equal(assigned.ok, true);
    if (assigned.ok) {
      assert.equal(assigned.categorySlug, "flowers");
      assert.deepEqual(assigned.additionalCategorySlugs, ["cakes", "anniversary-gifts"]);
    }
  });

  it("leaves additional categories unset when the request omits them", () => {
    const assigned = assignProductCategories({ categorySlug: "cakes", knownSlugs: known });
    assert.equal(assigned.ok, true);
    if (assigned.ok) assert.equal(assigned.additionalCategorySlugs, undefined);
  });

  it("rejects an unknown additional category", () => {
    const assigned = assignProductCategories({
      categorySlug: "flowers",
      additionalCategorySlugs: ["cakes", "missing-gifts"],
      knownSlugs: known,
    });
    assert.equal(assigned.ok, false);
    if (!assigned.ok) assert.match(assigned.error, /missing-gifts/);
  });
});
