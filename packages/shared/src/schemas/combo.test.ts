import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { comboSchema } from "./combo";

const valid = {
  slug: "rose-and-cake",
  name: "Rose and Cake",
  productSlugs: ["golden-sunset-blooms", "chocolate-truffle"],
};

describe("combo schema", () => {
  it("accepts a combo and fills description, sort order, and published", () => {
    const parsed = comboSchema.parse(valid);
    assert.equal(parsed.description, "");
    assert.equal(parsed.sortOrder, 0);
    assert.equal(parsed.published, true);
    assert.deepEqual(parsed.productSlugs, valid.productSlugs);
  });

  it("accepts eight unique product slugs and a 2000-character description", () => {
    const parsed = comboSchema.parse({
      ...valid,
      description: "a".repeat(2000),
      productSlugs: ["a", "b", "c", "d", "e", "f", "g", "h"],
      sortOrder: 12,
      published: false,
    });
    assert.equal(parsed.productSlugs.length, 8);
    assert.equal(parsed.description.length, 2000);
    assert.equal(parsed.published, false);
  });

  it("rejects slugs that are not lowercase kebab-case", () => {
    for (const slug of ["Rose", "rose_and_cake", "rose and cake", "-rose", "rose-", ""]) {
      assert.equal(comboSchema.safeParse({ ...valid, slug }).success, false, slug);
    }
  });

  it("rejects names outside 1–160 characters", () => {
    assert.equal(comboSchema.safeParse({ ...valid, name: "" }).success, false);
    assert.equal(comboSchema.safeParse({ ...valid, name: "n".repeat(161) }).success, false);
    assert.equal(comboSchema.safeParse({ ...valid, name: "n".repeat(160) }).success, true);
  });

  it("rejects a description longer than 2000 characters", () => {
    assert.equal(comboSchema.safeParse({ ...valid, description: "a".repeat(2001) }).success, false);
  });

  it("rejects fewer than 2, more than 8, or repeated product slugs", () => {
    assert.equal(comboSchema.safeParse({ ...valid, productSlugs: ["only-one"] }).success, false);
    assert.equal(
      comboSchema.safeParse({
        ...valid,
        productSlugs: ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
      }).success,
      false
    );
    assert.equal(
      comboSchema.safeParse({ ...valid, productSlugs: ["ok", "x".repeat(201)] }).success,
      false
    );
    const duplicate = comboSchema.safeParse({
      ...valid,
      productSlugs: ["golden-sunset-blooms", "golden-sunset-blooms"],
    });
    assert.equal(duplicate.success, false);
    if (!duplicate.success) {
      assert.match(duplicate.error.message, /Each product can appear only once/);
    }
  });
});
