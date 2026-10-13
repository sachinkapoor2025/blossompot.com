import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categoryKeys, comboKeys } from "../db/keys";
import {
  ComboSlugConflictError,
  createStoredCombo,
  updateStoredCombo,
} from "./combo-record";

const input = {
  slug: "rose-and-cake",
  name: "Rose and Cake",
  productSlugs: ["golden-sunset-blooms", "chocolate-truffle"],
  sortOrder: 4,
};

describe("combo storage keys", () => {
  it("uses the products table combo prefix and the category sort-order key", () => {
    assert.equal(comboKeys.pk("rose-and-cake"), "COMBO#rose-and-cake");
    assert.equal(comboKeys.sk(), "META");
    assert.equal(comboKeys.gsi1pk(), "ENTITY#COMBO");
    assert.equal(comboKeys.gsi1sk(4, "rose-and-cake"), "000004#rose-and-cake");
    assert.equal(comboKeys.gsi1sk(4, "rose-and-cake"), categoryKeys.gsi1sk(4, "rose-and-cake"));
    assert.equal(comboKeys.gsi1sk(-3, "rose-and-cake"), categoryKeys.gsi1sk(-3, "rose-and-cake"));
    assert.equal(comboKeys.gsi1sk(0, "rose-and-cake"), "000000#rose-and-cake");
  });

  it("stores both timestamps on create and does not replace an existing slug", () => {
    const created = createStoredCombo(input, "2026-01-01T00:00:00.000Z", undefined);
    assert.equal(created.PK, "COMBO#rose-and-cake");
    assert.equal(created.SK, "META");
    assert.equal(created.GSI1PK, "ENTITY#COMBO");
    assert.equal(created.GSI1SK, "000004#rose-and-cake");
    assert.equal(created.createdAt, "2026-01-01T00:00:00.000Z");
    assert.equal(created.updatedAt, "2026-01-01T00:00:00.000Z");
    assert.throws(() => createStoredCombo(input, "2026-02-01T00:00:00.000Z", created), ComboSlugConflictError);
  });

  it("keeps createdAt and the slug when a combo is updated", () => {
    const created = createStoredCombo(input, "2026-01-01T00:00:00.000Z", null);
    const updated = updateStoredCombo(
      created,
      { name: "Rose and Chocolate Cake", sortOrder: 9, published: false, createdAt: "1999-01-01T00:00:00.000Z", slug: "other" },
      "2026-03-01T00:00:00.000Z"
    );
    assert.equal(updated.slug, "rose-and-cake");
    assert.equal(updated.PK, "COMBO#rose-and-cake");
    assert.equal(updated.name, "Rose and Chocolate Cake");
    assert.equal(updated.published, false);
    assert.equal(updated.createdAt, "2026-01-01T00:00:00.000Z");
    assert.equal(updated.updatedAt, "2026-03-01T00:00:00.000Z");
    assert.equal(updated.GSI1SK, "000009#rose-and-cake");
    assert.deepEqual(updated.productSlugs, input.productSlugs);
  });
});
