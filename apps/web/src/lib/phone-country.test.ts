import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validatePhoneForCountry } from "./phone-country";

const US_NATIONAL = "6502530000";
const IN_NATIONAL = "9876543210";
const CA_NATIONAL = "4168680000";

describe("spin-wheel phone country validation", () => {
  it("accepts a valid USA number when USA is selected", () => {
    const result = validatePhoneForCountry("US", US_NATIONAL);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.e164, "+16502530000");
  });

  it("rejects an India number when USA is selected", () => {
    assert.equal(validatePhoneForCountry("US", "+91 9876543210").ok, false);
  });

  it("accepts a valid India number when India is selected", () => {
    const result = validatePhoneForCountry("IN", IN_NATIONAL);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.e164, "+919876543210");
  });

  it("rejects a USA number when India is selected", () => {
    assert.equal(validatePhoneForCountry("IN", "+1 650 253 0000").ok, false);
  });

  it("rejects an incomplete number", () => {
    assert.equal(validatePhoneForCountry("US", "650").ok, false);
    assert.equal(validatePhoneForCountry("IN", "98765").ok, false);
  });

  it("rejects an empty number", () => {
    assert.equal(validatePhoneForCountry("US", "").ok, false);
    assert.equal(validatePhoneForCountry("US", "   ").ok, false);
  });

  it("accepts after the country and number are both updated", () => {
    assert.equal(validatePhoneForCountry("US", US_NATIONAL).ok, true);
    const updated = validatePhoneForCountry("IN", IN_NATIONAL);
    assert.equal(updated.ok, true);
    if (updated.ok) assert.equal(updated.e164, "+919876543210");
  });

  it("rejects an India number after the country changes to USA", () => {
    assert.equal(validatePhoneForCountry("IN", IN_NATIONAL).ok, true);
    assert.equal(validatePhoneForCountry("US", IN_NATIONAL).ok, false);
  });

  it("accepts an international number when it matches the selected country", () => {
    const result = validatePhoneForCountry("US", "+1 (650) 253-0000");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.e164, "+16502530000");
  });

  it("distinguishes countries that share a calling code", () => {
    assert.equal(validatePhoneForCountry("CA", CA_NATIONAL).ok, true);
    assert.equal(validatePhoneForCountry("US", `+1 ${CA_NATIONAL}`).ok, false);
    assert.equal(validatePhoneForCountry("CA", US_NATIONAL).ok, false);
    assert.equal(validatePhoneForCountry("GB", "2079460958").ok, true);
    assert.equal(validatePhoneForCountry("GB", "7911123456").ok, false);
    assert.equal(validatePhoneForCountry("GG", "7911123456").ok, true);
  });
});
