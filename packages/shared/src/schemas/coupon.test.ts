import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_TRIAL_COUPON_MINUTES,
  ADMIN_TRIAL_TARGET_USD,
  applyPercentDiscount,
  applyTrialPayableDiscount,
  createAdminCouponSchema,
  trialTargetPayable,
} from "./coupon";

describe("trial coupon", () => {
  it("is valid for 20 minutes and $1 USD", () => {
    assert.equal(ADMIN_TRIAL_COUPON_MINUTES, 20);
    assert.equal(ADMIN_TRIAL_TARGET_USD, 1);
  });

  it("discounts payable so the order total is $1", () => {
    assert.equal(applyTrialPayableDiscount(149.5, 1), 148.5);
    assert.equal(applyTrialPayableDiscount(0.4, 1), 0);
    assert.equal(applyPercentDiscount(100, 10), 10);
  });

  it("converts $1 to INR when checkout is INR", () => {
    assert.equal(trialTargetPayable("USD", 83), 1);
    assert.equal(trialTargetPayable("INR", 83), 83);
  });

  it("accepts admin create payload with kind trial", () => {
    const parsed = createAdminCouponSchema.safeParse({
      kind: "trial",
      email: "tester@blossompot.com",
    });
    assert.equal(parsed.success, true);
  });
});
