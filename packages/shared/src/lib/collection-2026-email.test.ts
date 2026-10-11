import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COLLECTION_2026_EMAIL_CONFIG,
  COLLECTION_2026_EMAIL_NAME,
  COLLECTION_2026_EMAIL_PREVIEW,
  COLLECTION_2026_EMAIL_SUBJECT,
  buildCollection2026EmailHtml,
} from "./collection-2026-email";

describe("flowers cakes gifts collection 2026 email", () => {
  const html = buildCollection2026EmailHtml();

  it("uses the requested name, subject, and preview text", () => {
    assert.equal(COLLECTION_2026_EMAIL_NAME, "BlossomPot Flowers, Cakes & Gifts Collection 2026");
    assert.equal(
      COLLECTION_2026_EMAIL_SUBJECT,
      "Make Every Moment Special with Flowers, Cakes & Beautiful Gifts"
    );
    assert.equal(COLLECTION_2026_EMAIL_CONFIG.subject, COLLECTION_2026_EMAIL_SUBJECT);
    assert.match(html, /Make Someone Smile Today/);
    assert.match(html, /Surprise your loved ones with stunning bouquets/);
    assert.equal(COLLECTION_2026_EMAIL_PREVIEW.includes("BlossomPot"), true);
  });

  it("links every call to action to a live storefront route", () => {
    assert.match(html, /Shop Now/);
    assert.match(html, /href="https:\/\/www\.blossompot\.com\/products"/);
    assert.match(html, /Shop Flowers/);
    assert.match(html, /href="https:\/\/www\.blossompot\.com\/flowers"/);
    assert.match(html, /Order Cakes/);
    assert.match(html, /href="https:\/\/www\.blossompot\.com\/cakes"/);
    assert.match(html, /Explore Gift Hampers/);
    assert.match(html, /href="https:\/\/www\.blossompot\.com\/gift-hampers"/);
    assert.match(html, /View Product/);
    for (const product of COLLECTION_2026_EMAIL_CONFIG.products) {
      assert.match(html, new RegExp(product.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.match(html, new RegExp(product.priceLabel.replace("$", "\\$")));
      assert.match(html, new RegExp(product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.match(html, /{{unsubscribe}}/);
  });

  it("does not invent offers", () => {
    assert.doesNotMatch(html, /free shipping/i);
    assert.doesNotMatch(html, /\d+%\s*off/i);
    assert.doesNotMatch(html, /same-day/i);
  });
});
