import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { faqsForCountry } from "./faqs-for-country";

describe("faqsForCountry", () => {
  it("localizes delivery timing copy for other countries", () => {
    const uk = faqsForCountry("GB");
    const timing = uk.find((item) => item.q === "How long does delivery take?");
    assert.ok(timing);
    assert.match(timing.a, /UK/);
    assert.doesNotMatch(timing.a, /same-day/i);
  });

  it("uses US recipient-address timing copy for the USA", () => {
    const us = faqsForCountry("US");
    const timing = us.find((item) => item.q === "How long does delivery take?");
    assert.ok(timing);
    assert.match(timing.a, /US recipient address/);
    assert.doesNotMatch(timing.a, /same-day/i);
  });
});
