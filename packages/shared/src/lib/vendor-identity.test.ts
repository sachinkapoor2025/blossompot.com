import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FNP_IMPORT_TAG,
  VENDOR_BLOSSOMPOT,
  VENDOR_FNP,
  VENDOR_GBO,
  VENDOR_ORANGE_COUNTY,
} from "../constants";
import { productKeptForServiceableVendors } from "./serviceability";
import { resolveCatalogVendorSlug } from "./vendor-identity";
import { productForShoppingDecision } from "./fnp-import";
import { annotateStorefrontListing, type VendorDisplaySource } from "./vendor-display-order";

describe("catalog vendor identity", () => {
  it("keeps an explicit slug ahead of a conflicting tag", () => {
    assert.equal(
      resolveCatalogVendorSlug({ vendorSlug: VENDOR_BLOSSOMPOT, tags: [FNP_IMPORT_TAG] }),
      VENDOR_BLOSSOMPOT
    );
    assert.equal(
      resolveCatalogVendorSlug({ vendorSlug: VENDOR_FNP, tags: ["birthday"] }),
      VENDOR_FNP
    );
    assert.equal(
      resolveCatalogVendorSlug({ vendorSlug: VENDOR_ORANGE_COUNTY, tags: [FNP_IMPORT_TAG] }),
      VENDOR_ORANGE_COUNTY
    );
  });

  it("uses the FNP import tag only when the slug is missing", () => {
    assert.equal(resolveCatalogVendorSlug({ tags: [FNP_IMPORT_TAG] }), VENDOR_FNP);
    assert.equal(resolveCatalogVendorSlug({ vendorSlug: "  ", tags: [FNP_IMPORT_TAG] }), VENDOR_FNP);
    assert.equal(resolveCatalogVendorSlug({ tags: ["birthday"] }), VENDOR_BLOSSOMPOT);
    assert.equal(resolveCatalogVendorSlug({ tags: ["tf-usa"] }), VENDOR_BLOSSOMPOT);
    assert.equal(resolveCatalogVendorSlug({}), VENDOR_BLOSSOMPOT);
  });

  it("keeps Gift Baskets Overseas signals ahead of the BlossomPot default", () => {
    assert.equal(resolveCatalogVendorSlug({ vendorSlug: VENDOR_GBO }), VENDOR_GBO);
    assert.equal(resolveCatalogVendorSlug({ internationalDelivery: true }), VENDOR_GBO);
    assert.equal(resolveCatalogVendorSlug({ slug: "gbo-us-101-basket" }), VENDOR_GBO);
    assert.equal(resolveCatalogVendorSlug({ productSlug: "gbo-us-101-basket" }), VENDOR_GBO);
    assert.equal(resolveCatalogVendorSlug({ sku: "gbo:US:101" }), VENDOR_GBO);
    assert.equal(
      resolveCatalogVendorSlug({ vendorSlug: VENDOR_FNP, internationalDelivery: true }),
      VENDOR_GBO
    );
  });

  it("does not write the BlossomPot default onto a cart line that still needs the stored product", () => {
    const legacy = productForShoppingDecision({ slug: "owned-rose", tags: ["birthday"] });
    assert.equal(legacy.vendorSlug, undefined);
    const tagged = productForShoppingDecision({ slug: "pastel", tags: [FNP_IMPORT_TAG] });
    assert.equal(tagged.vendorSlug, VENDOR_FNP);
  });

  it("keeps a public FNP or Orange County card when BlossomPot is not serviceable", () => {
    const vendors = [VENDOR_FNP, VENDOR_ORANGE_COUNTY, VENDOR_GBO];
    assert.equal(
      productKeptForServiceableVendors({ slug: "pastel", vendorSlug: VENDOR_FNP, tags: [FNP_IMPORT_TAG] }, vendors, true, "US"),
      true
    );
    assert.equal(
      productKeptForServiceableVendors({ slug: "pastel", tags: [FNP_IMPORT_TAG] }, vendors, true, "US"),
      true
    );
    assert.equal(
      productKeptForServiceableVendors({ slug: "hamper", vendorSlug: VENDOR_ORANGE_COUNTY }, vendors, true, "US"),
      true
    );
    assert.equal(
      productKeptForServiceableVendors({ slug: "rose", vendorSlug: VENDOR_BLOSSOMPOT }, vendors, true, "US"),
      false
    );
    assert.equal(
      productKeptForServiceableVendors({ slug: "basket", internationalDelivery: true }, vendors, true, "US"),
      true
    );
  });

  it("keeps listing identity after public annotation removes vendorSlug", () => {
    const display: VendorDisplaySource[] = [
      { vendorSlug: VENDOR_BLOSSOMPOT, vendorName: "BlossomPot", displayOrder: 1 },
      { vendorSlug: VENDOR_ORANGE_COUNTY, vendorName: "Orange County", displayOrder: 2 },
      { vendorSlug: VENDOR_GBO, vendorName: "Gift Baskets Overseas", displayOrder: 3 },
      { vendorSlug: VENDOR_FNP, vendorName: "FNP", displayOrder: 4 },
    ];
    const annotated = annotateStorefrontListing(
      [
        { slug: "oc-hamper", name: "Hamper", price: 40, vendorSlug: VENDOR_ORANGE_COUNTY, vendorCost: 20, tags: ["hamper"] },
        { slug: "fnp-explicit", name: "Explicit FNP", price: 30, vendorSlug: VENDOR_FNP, vendorCost: 12, tags: ["birthday"] },
        { slug: "fnp-tag", name: "Tagged FNP", price: 28, tags: [FNP_IMPORT_TAG], vendorCost: 10 },
        { slug: "gbo-basket", name: "Basket", price: 50, internationalDelivery: true, sku: "gbo:US:101", vendorCost: 25 },
        { slug: "owned-rose", name: "Rose", price: 20, tags: ["roses"], vendorCost: 8 },
      ],
      display
    );
    for (const card of annotated) {
      assert.equal("vendorSlug" in card, false);
      assert.equal("vendorCost" in card, false);
    }
    assert.equal(annotated.find((card) => card.slug === "oc-hamper")?.listingVendorSlug, VENDOR_ORANGE_COUNTY);
    assert.equal(annotated.find((card) => card.slug === "fnp-explicit")?.listingVendorSlug, VENDOR_FNP);
    assert.equal(annotated.find((card) => card.slug === "fnp-tag")?.listingVendorSlug, VENDOR_FNP);
    assert.equal(annotated.find((card) => card.slug === "gbo-basket")?.listingVendorSlug, VENDOR_GBO);
    assert.equal(annotated.find((card) => card.slug === "owned-rose")?.listingVendorSlug, VENDOR_BLOSSOMPOT);

    const serviceableWithoutBlossomPot = [VENDOR_FNP, VENDOR_ORANGE_COUNTY, VENDOR_GBO];
    const kept = annotated.filter((card) =>
      productKeptForServiceableVendors(card, serviceableWithoutBlossomPot, true, "US")
    );
    assert.deepEqual(
      kept.map((card) => card.slug).sort(),
      ["fnp-explicit", "fnp-tag", "gbo-basket", "oc-hamper"]
    );
    assert.equal(
      resolveCatalogVendorSlug({ vendorSlug: VENDOR_BLOSSOMPOT, listingVendorSlug: VENDOR_FNP, tags: [FNP_IMPORT_TAG] }),
      VENDOR_BLOSSOMPOT
    );
  });
});
