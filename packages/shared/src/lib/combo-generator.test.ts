import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { comboSchema } from "../schemas/combo";
import { generateComboDrafts, type ComboSourceProduct } from "./combo-generator";
import type { VendorDisplaySource } from "./vendor-display-order";

const vendors: VendorDisplaySource[] = [
  { vendorSlug: "blossompot", vendorName: "BlossomPot", displayOrder: 1 },
  { vendorSlug: "fnp", vendorName: "FNP", displayOrder: 2 },
];

function product(
  slug: string,
  categorySlug: string,
  vendorSlug: string,
  name = slug
): ComboSourceProduct {
  return { slug, name, categorySlug, vendorSlug };
}

describe("combo generator", () => {
  it("pairs two products from the same vendor and different categories", () => {
    const drafts = generateComboDrafts(
      [product("roses", "flowers", "blossompot", "Roses"), product("cake", "cakes", "blossompot", "Cake")],
      vendors,
      10
    );
    assert.equal(drafts.length, 1);
    assert.deepEqual(drafts[0]?.productSlugs, ["roses", "cake"]);
    assert.equal(drafts[0]?.name, "Roses and Cake");
    assert.equal(drafts[0]?.slug, "roses-cake");
    assert.equal(drafts[0]?.description, "");
    assert.equal(drafts[0]?.published, true);
    assert.equal("vendorSlug" in (drafts[0] ?? {}), false);
    assert.equal("price" in (drafts[0] ?? {}), false);
    assert.equal(comboSchema.safeParse(drafts[0]).success, true);
  });

  it("excludes products that share a primary category", () => {
    const drafts = generateComboDrafts(
      [
        product("red-roses", "flowers", "blossompot"),
        product("pink-roses", "flowers", "blossompot"),
        product("cake", "cakes", "blossompot"),
      ],
      vendors,
      10
    );
    assert.deepEqual(
      drafts.map((draft) => draft.productSlugs),
      [
        ["red-roses", "cake"],
        ["pink-roses", "cake"],
      ]
    );
  });

  it("excludes products from different vendors", () => {
    const drafts = generateComboDrafts(
      [product("roses", "flowers", "blossompot"), product("cake", "cakes", "fnp")],
      vendors,
      10
    );
    assert.deepEqual(drafts, []);
  });

  it("emits one combo when the same pair appears again in either order", () => {
    const drafts = generateComboDrafts(
      [
        product("roses", "flowers", "blossompot", "Roses"),
        product("cake", "cakes", "blossompot", "Cake"),
        product("cake", "cakes", "blossompot", "Cake"),
        product("roses", "flowers", "blossompot", "Roses"),
      ],
      vendors,
      10
    );
    assert.equal(drafts.length, 1);
    assert.deepEqual(drafts[0]?.productSlugs, ["roses", "cake"]);
  });

  it("orders vendors with the existing display order", () => {
    const drafts = generateComboDrafts(
      [
        product("fnp-cake", "cakes", "fnp", "FNP Cake"),
        product("fnp-roses", "flowers", "fnp", "FNP Roses"),
        product("bp-cake", "cakes", "blossompot", "BP Cake"),
        product("bp-roses", "flowers", "blossompot", "BP Roses"),
      ],
      vendors,
      10
    );
    assert.deepEqual(
      drafts.map((draft) => draft.productSlugs),
      [
        ["bp-cake", "bp-roses"],
        ["fnp-cake", "fnp-roses"],
      ]
    );
    assert.deepEqual(
      drafts.map((draft) => draft.sortOrder),
      [0, 1]
    );
  });

  it("keeps the existing product order when forming pairs", () => {
    const drafts = generateComboDrafts(
      [
        product("roses", "flowers", "blossompot"),
        product("cake", "cakes", "blossompot"),
        product("plant", "plants", "blossompot"),
      ],
      vendors,
      10
    );
    assert.deepEqual(
      drafts.map((draft) => draft.productSlugs),
      [
        ["roses", "cake"],
        ["roses", "plant"],
        ["cake", "plant"],
      ]
    );
  });

  it("caps each vendor and still includes a vendor with fewer pairs", () => {
    const drafts = generateComboDrafts(
      [
        product("roses", "flowers", "blossompot"),
        product("cake", "cakes", "blossompot"),
        product("plant", "plants", "blossompot"),
        product("fnp-hamper", "hampers", "fnp"),
        product("fnp-bouquet", "bouquets", "fnp"),
      ],
      vendors,
      2
    );
    assert.deepEqual(
      drafts.map((draft) => draft.productSlugs),
      [
        ["roses", "cake"],
        ["roses", "plant"],
        ["fnp-hamper", "fnp-bouquet"],
      ]
    );
  });

  it("returns no drafts for an empty list or an invalid limit", () => {
    const products = [product("roses", "flowers", "blossompot"), product("cake", "cakes", "blossompot")];
    assert.deepEqual(generateComboDrafts([], vendors, 10), []);
    assert.deepEqual(generateComboDrafts(products, vendors, 0), []);
    assert.deepEqual(generateComboDrafts(products, vendors, -1), []);
    assert.deepEqual(generateComboDrafts(products, vendors, 1.5), []);
    assert.deepEqual(generateComboDrafts(products, vendors, Number.NaN), []);
  });
});
