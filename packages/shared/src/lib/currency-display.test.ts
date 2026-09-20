import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkoutCurrencyForDisplay,
  convertCurrency,
  currencyForCountryCode,
} from "./currency-display";

describe("currencyForCountryCode", () => {
  it("maps delivery countries to local currency", () => {
    assert.equal(currencyForCountryCode("US"), "USD");
    assert.equal(currencyForCountryCode("GB"), "GBP");
    assert.equal(currencyForCountryCode("CA"), "CAD");
    assert.equal(currencyForCountryCode("AU"), "AUD");
    assert.equal(currencyForCountryCode("AE"), "AED");
    assert.equal(currencyForCountryCode("IN"), "INR");
  });
});

describe("convertCurrency display FX", () => {
  it("converts USD catalog prices to GBP using the rate table", () => {
    const gbp = convertCurrency(100, "USD", "GBP", 96, { GBP: 0.75 });
    assert.equal(gbp, 75);
  });

  it("keeps USD↔INR on the checkout rate", () => {
    assert.equal(convertCurrency(10, "USD", "INR", 96), 960);
  });
});

describe("checkoutCurrencyForDisplay", () => {
  it("charges Stripe in USD for non-INR display currencies", () => {
    assert.equal(checkoutCurrencyForDisplay("GBP"), "USD");
    assert.equal(checkoutCurrencyForDisplay("INR"), "INR");
  });
});
