import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { optionalShippingDims, type ShippingDimForm } from "./admin-product-dims";

const blank: ShippingDimForm = { weightOz: "", lengthIn: "", widthIn: "", heightIn: "" };

describe("optional shipping dimensions on product edit", () => {
  it("omits blank dimensions instead of inventing values", () => {
    const parsed = optionalShippingDims(blank);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.deepEqual(parsed.dims, {});
  });

  it("keeps a supplied positive dimension and leaves the others out", () => {
    const parsed = optionalShippingDims({ ...blank, weightOz: " 12.5 " });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.deepEqual(parsed.dims, { weightOz: 12.5 });
  });

  it("rejects a supplied dimension that is not a positive number", () => {
    for (const weightOz of ["0", "-1", "abc"]) {
      const parsed = optionalShippingDims({ ...blank, weightOz });
      assert.equal(parsed.ok, false);
      if (parsed.ok) continue;
      assert.match(parsed.message, /Weight \(oz\) must be greater than 0/);
    }
  });
});
