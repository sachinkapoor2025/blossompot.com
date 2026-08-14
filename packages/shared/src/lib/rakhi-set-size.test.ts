import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectRakhiSetSize,
  isRakhiSetSizeCategory,
  productMatchesRakhiSetCategory,
} from "./rakhi-set-size";

describe("detectRakhiSetSize", () => {
  it("detects set of 2 from name and slug", () => {
    assert.equal(
      detectRakhiSetSize({
        name: "Red & Blue Rakhi Set of 2",
        slug: "red-blue-rakhi-set-of-2",
        categorySlug: "rakhi-combo",
      }),
      2
    );
  });

  it("detects set of 3 from hamper list item", () => {
    assert.equal(
      detectRakhiSetSize({
        name: "Rakhi Triple Joy Box",
        slug: "rakhi-triple-joy-box",
        categorySlug: "rakhi-hampers",
        description: "<ul><li>Set of 3 Rakhi</li><li>200 g Besan Laddoo</li></ul>",
      }),
      3
    );
  });

  it("detects set of 4 from name/description", () => {
    assert.equal(
      detectRakhiSetSize({
        name: "Festive Rakhi 4 Pack Delight",
        slug: "festive-rakhi-4-pack-delight",
        categorySlug: "rakhi-hampers",
        description: "<ul><li>Set of 4 Rakhi</li><li>200 g Kaju Katli</li></ul>",
      }),
      4
    );
  });

  it("excludes bhaiya bhabhi and lumba products", () => {
    assert.equal(
      detectRakhiSetSize({
        name: "Bhaiya Bhabhi Rakhi Set",
        slug: "bhaiya-bhabhi-rakhi-set",
        categorySlug: "bhaiya-bhabhi-rakhi",
      }),
      null
    );
  });

  it("does not treat chocolate quantity as rakhi set size", () => {
    assert.equal(
      detectRakhiSetSize({
        name: "Designer Rakhi for Men with HERSHEY’S Chocolates",
        slug: "designer-rakhi-for-men-with-hersheys-chocolates",
        categorySlug: "rakhi-combo",
        description: "Includes 3 Ferrero Rocher chocolates with one designer rakhi.",
      }),
      null
    );
  });
});

describe("productMatchesRakhiSetCategory", () => {
  it("matches category slug helpers", () => {
    assert.equal(isRakhiSetSizeCategory("2-set-rakhi"), true);
    assert.equal(isRakhiSetSizeCategory("single-rakhi"), false);
    assert.equal(
      productMatchesRakhiSetCategory(
        { name: "Men Rakhi Set of 2 with Chocolates Combo", categorySlug: "rakhi-combo" },
        "2-set-rakhi"
      ),
      true
    );
  });
});
