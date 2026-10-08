import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deliveryDestinationName } from "../location-seo-urls";
import { productFaqsForCategory } from "./product-faqs";

function deliveryFaq(countryIso?: string | null) {
  const destination = countryIso == null ? undefined : deliveryDestinationName(countryIso);
  return productFaqsForCategory("flowers", destination)[0];
}

describe("product delivery FAQ follows the selected country", () => {
  it("uses UAE when the selected country is AE", () => {
    const faq = deliveryFaq("AE");
    assert.match(faq.q, /UAE/);
    assert.match(faq.a, /UAE/);
    assert.equal(faq.q, "How long does delivery take in the UAE?");
    assert.match(faq.a, /5–7 business day UAE window/);
    assert.doesNotMatch(`${faq.q} ${faq.a}`, /USA/);
  });

  it("uses Canada when the selected country is CA", () => {
    const faq = deliveryFaq("CA");
    assert.equal(faq.q, "How long does delivery take in Canada?");
    assert.match(faq.a, /Canada window/);
    assert.doesNotMatch(`${faq.q} ${faq.a}`, /USA/);
  });

  it("uses Bahrain when the selected country is BH", () => {
    const faq = deliveryFaq("BH");
    assert.equal(faq.q, "How long does delivery take in Bahrain?");
    assert.match(faq.a, /Bahrain window/);
    assert.doesNotMatch(`${faq.q} ${faq.a}`, /USA/);
  });

  it("updates from UAE to Canada when the selected country changes", () => {
    const uae = deliveryFaq("AE");
    const canada = deliveryFaq("CA");
    assert.match(uae.q, /UAE/);
    assert.equal(canada.q, "How long does delivery take in Canada?");
    assert.match(canada.a, /Canada/);
    assert.doesNotMatch(canada.q, /UAE/);
  });

  it("updates from Canada to UAE when the selected country changes", () => {
    const canada = deliveryFaq("CA");
    const uae = deliveryFaq("AE");
    assert.match(canada.q, /Canada/);
    assert.equal(uae.q, "How long does delivery take in the UAE?");
    assert.match(uae.a, /UAE/);
    assert.doesNotMatch(uae.q, /Canada/);
  });

  it("keeps the storefront default when no country is selected", () => {
    const faq = productFaqsForCategory("flowers")[0];
    assert.equal(faq.q, "How long does delivery take in the USA?");
    assert.match(faq.a, /USA window/);
    const payment = productFaqsForCategory("flowers").find((item) => item.q.includes("payment"));
    assert.match(payment?.a ?? "", /Stripe \(USD\) and Razorpay \(INR\)/);
    assert.match(faq.a, /product page and checkout/);
  });

  it("uses the project USA display name for the United States", () => {
    const faq = deliveryFaq("US");
    assert.equal(faq.q, "How long does delivery take in the USA?");
    assert.match(faq.a, /USA window/);
  });
});
