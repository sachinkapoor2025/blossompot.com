import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { faqsForCountry } from "./faqs-for-country";

describe("faqsForCountry", () => {
  it("does not keep USA-only same-day copy for other countries", () => {
    const uk = faqsForCountry("GB");
    const sameDay = uk.find((item) => item.q === "Do you offer same-day delivery?");
    assert.ok(sameDay);
    assert.match(sameDay.a, /UK/);
    assert.doesNotMatch(sameDay.a, /select US cities/);
  });

  it("keeps US same-day cities language for the USA", () => {
    const us = faqsForCountry("US");
    const sameDay = us.find((item) => item.q === "Do you offer same-day delivery?");
    assert.ok(sameDay);
    assert.match(sameDay.a, /US cities/);
  });
});
