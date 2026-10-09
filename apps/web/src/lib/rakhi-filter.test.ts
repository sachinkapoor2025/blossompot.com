import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isGboHiddenFromStorefront } from "@blossompot/shared";
import { isRakhiRelatedProduct, productsNotShownInSections, storefrontSkipsRakhiCategory } from "./rakhi-filter";

const orangeCountyHamper = {
  name: "Rakhi Dry Fruit Celebration Combo",
  slug: "rakhi-dry-fruit-celebration-combo",
  categorySlug: "rakhi-hampers",
  description: "Designer rakhi with dry fruits for Raksha Bandhan.",
  tags: ["rakhi-hamper", "raksha-bandhan"],
  additionalCategorySlugs: ["single-rakhi"],
  vendorSlug: "orange-county",
};

describe("storefront rakhi filter", () => {
  it("keeps Orange County rakhi hampers visible, including the public payload without vendorSlug", () => {
    assert.equal(isRakhiRelatedProduct(orangeCountyHamper), false);
    const { vendorSlug: _vendor, ...publicProduct } = orangeCountyHamper;
    assert.equal(isRakhiRelatedProduct(publicProduct), false);
  });

  it("still filters rakhi products from other vendors", () => {
    assert.equal(
      isRakhiRelatedProduct({
        name: "Kids Rakhi Combo",
        slug: "kids-rakhi-combo",
        categorySlug: "kids-rakhi",
        description: "Rakhi set for children",
        tags: ["rakhi"],
        vendorSlug: "blossompot",
      }),
      true
    );
    assert.equal(
      isRakhiRelatedProduct({
        name: "Rakhi Dry Fruit Celebration Combo",
        slug: "rakhi-dry-fruit-celebration-combo",
        categorySlug: "gift-hampers",
        vendorSlug: "blossompot",
      }),
      true
    );
  });

  it("loads the rakhi-hampers category and still skips other rakhi categories", () => {
    assert.equal(storefrontSkipsRakhiCategory("rakhi-hampers"), false);
    assert.equal(storefrontSkipsRakhiCategory("single-rakhi"), true);
    assert.equal(storefrontSkipsRakhiCategory("bhaiya-bhabhi-rakhi"), true);
    assert.equal(storefrontSkipsRakhiCategory("flowers"), false);
  });

  it("keeps Orange County hampers on the shop page when home sections omit rakhi-hampers", () => {
    const hamper = { slug: "rakhi-dry-fruit-celebration-combo", categorySlug: "rakhi-hampers" };
    const bouquet = { slug: "blush-bloom-bouquet", categorySlug: "flower-bouquets" };
    const shown = [bouquet];
    assert.deepEqual(productsNotShownInSections([bouquet, hamper], shown), [hamper]);
  });

  it("keeps GBO products hidden when the storefront toggle is false", () => {
    const off = { GBO_STOREFRONT_ENABLED: "false" };
    assert.equal(
      isGboHiddenFromStorefront(
        { vendorSlug: "gift-baskets-overseas", slug: "gbo-us-1", sku: "gbo:US:1", internationalDelivery: true },
        off
      ),
      true
    );
    assert.equal(isGboHiddenFromStorefront({ vendorSlug: "orange-county", slug: orangeCountyHamper.slug }, off), false);
    assert.equal(
      isGboHiddenFromStorefront(
        {
          vendorSlug: "gift-baskets-overseas",
          slug: "gbo-us-rakhi",
          sku: "gbo:US:9",
          categorySlug: "rakhi-hampers",
          internationalDelivery: true,
        },
        off
      ),
      true
    );
  });
});
