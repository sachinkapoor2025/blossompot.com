import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Product } from "@blossompot/shared";
import { mergeSavedAdminProduct } from "./admin-product-row";

function product(slug: string, published: boolean | undefined, name: string): Product {
  return {
    slug,
    name,
    description: "Row",
    price: 10,
    currency: "USD",
    categorySlug: "flowers",
    images: [],
    inventory: 4,
    tags: [],
    ...(published === undefined ? {} : { published }),
    createdAt: "2026-10-14T00:00:00.000Z",
    updatedAt: "2026-10-14T00:00:00.000Z",
  };
}

describe("admin row uses the saved product", () => {
  it("replaces a stale Draft badge with the published save response", () => {
    const saved = product("rose", true, "Published rose");
    const next = mergeSavedAdminProduct([product("rose", false, "Draft rose")], saved);
    assert.equal(next[0]?.published, true);
    assert.equal(next[0]?.name, "Published rose");
  });

  it("replaces a stale Published badge with the unpublished save response", () => {
    const saved = product("rose", false, "Hidden rose");
    const next = mergeSavedAdminProduct([product("rose", true, "Visible rose")], saved);
    assert.equal(next[0]?.published, false);
    assert.equal(next[0]?.name, "Hidden rose");
  });
});
