import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { USA_ONLY_DELIVERY_MESSAGE } from "@blossompot/shared";
import { chooseCheckoutAddressPrefill, nonUsAccountSaveMessage } from "./checkout-address";

describe("checkout address prefill", () => {
  it("uses a later US address after a non-US saved address is skipped", () => {
    const choice = chooseCheckoutAddressPrefill({
      accountAddress: { country: "CA", line1: "1 King St", city: "Toronto", postalCode: "M5H 2N2" },
      saved: [{ country: "US", name: "Ava", line1: "10 Main St", city: "Los Angeles", state: "CA", postalCode: "90012" }],
    });
    assert.equal(choice.notice, null);
    assert.equal(choice.address?.postalCode, "90012");
    assert.equal(choice.address?.line1, "10 Main St");
  });

  it("asks for a US address when every saved address is outside the United States", () => {
    const choice = chooseCheckoutAddressPrefill({
      accountAddress: { country: "GB", line1: "10 Downing" },
      previousOrder: { country: "CA", line1: "1 King" },
    });
    assert.equal(choice.address, null);
    assert.match(choice.notice ?? "", /United States/);
    assert.match(choice.notice ?? "", new RegExp(USA_ONLY_DELIVERY_MESSAGE.replace(/[.]/g, "\\.")));
  });

  it("does not save a new non-US account address", () => {
    assert.match(nonUsAccountSaveMessage("CA") ?? "", /United States/);
    assert.equal(nonUsAccountSaveMessage("US"), null);
    assert.equal(nonUsAccountSaveMessage(""), null);
  });
});
