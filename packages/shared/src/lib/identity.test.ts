import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidPublicEmail, normalizeEmail } from "./identity";

describe("isValidPublicEmail", () => {
  it("rejects addresses without a real domain TLD", () => {
    assert.equal(isValidPublicEmail("111@cc"), false);
    assert.equal(isValidPublicEmail("user@localhost"), false);
    assert.equal(isValidPublicEmail("not-an-email"), false);
    assert.equal(isValidPublicEmail("a@b.c"), false);
  });

  it("accepts normal addresses", () => {
    assert.equal(isValidPublicEmail("shopper@gmail.com"), true);
    assert.equal(isValidPublicEmail("name.plus@blossompot.com"), true);
  });
});

describe("normalizeEmail", () => {
  it("lowercases valid emails and drops invalid ones", () => {
    assert.equal(normalizeEmail("  A@Gmail.COM "), "a@gmail.com");
    assert.equal(normalizeEmail("111@cc"), undefined);
  });
});
