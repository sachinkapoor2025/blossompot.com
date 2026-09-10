import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GIFTING_MARKETING_EMAIL_CONFIG,
  GIFTING_MARKETING_EMAIL_SUBJECT,
  buildGiftingMarketingEmailHtml,
} from "./gifting-marketing-email";

describe("gifting marketing email", () => {
  it("includes hero, three categories, worldwide CTA, featured product, and unsubscribe", () => {
    const html = buildGiftingMarketingEmailHtml();
    assert.equal(GIFTING_MARKETING_EMAIL_SUBJECT.length > 20, true);
    assert.match(html, /Send a Gift They'll Never Forget/);
    assert.match(html, /Shop Now/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/flowers/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/cakes/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/gift-hampers/);
    assert.match(html, /Send a Surprise Anywhere in the World/);
    assert.match(html, /200\+ countries worldwide/);
    assert.match(html, /Send a Gift/);
    assert.match(html, /Classic Red Rose Bouquet/);
    assert.match(html, /\$49\.99/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/products\/classic-red-rose-bouquet/);
    assert.match(html, /{{unsubscribe}}/);
    assert.match(html, /support@blossompot\.com/);
    assert.doesNotMatch(html, /16692603819/);
    assert.doesNotMatch(html, /<script/i);
  });

  it("allows hero and featured overrides without changing other defaults", () => {
    const html = buildGiftingMarketingEmailHtml({
      hero: { ...GIFTING_MARKETING_EMAIL_CONFIG.hero, headline: "Limited Spring Offer" },
      featured: { ...GIFTING_MARKETING_EMAIL_CONFIG.featured, name: "Pink Rose Bouquet", priceLabel: "" },
    });
    assert.match(html, /Limited Spring Offer/);
    assert.match(html, /Pink Rose Bouquet/);
    assert.doesNotMatch(html, /\$49\.99/);
  });
});
