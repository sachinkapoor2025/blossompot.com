import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FNP_IMPORT_TAG, productForShoppingDecision } from "./fnp-import";
import { VENDOR_BLOSSOMPOT, VENDOR_FNP } from "../constants";

describe("FNP shopping identity", () => {
  it("uses the import tag only when the product has no vendor slug", () => {
    const tagged = productForShoppingDecision({ slug: "perfectly-pastel-premium", tags: [FNP_IMPORT_TAG] });
    assert.equal(tagged.vendorSlug, VENDOR_FNP);

    const explicit = productForShoppingDecision({
      slug: "owned-rose",
      vendorSlug: VENDOR_BLOSSOMPOT,
      tags: [FNP_IMPORT_TAG],
    });
    assert.equal(explicit.vendorSlug, VENDOR_BLOSSOMPOT);

    const unrelated = productForShoppingDecision({ slug: "owned-rose", tags: ["birthday"] });
    assert.equal(unrelated.vendorSlug, undefined);

    const blank = productForShoppingDecision({ slug: "pastel", vendorSlug: "  ", tags: [FNP_IMPORT_TAG] });
    assert.equal(blank.vendorSlug, VENDOR_FNP);
  });
});
