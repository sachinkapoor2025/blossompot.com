import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { wishlistEntryHref } from "./wishlist-href";

describe("wishlist login prompt", () => {
  it("sends guests to account login with a return to the wish list", () => {
    assert.equal(wishlistEntryHref(false), "/account?redirect=%2Fwishlist");
    assert.equal(wishlistEntryHref(true), "/wishlist");
  });
});
