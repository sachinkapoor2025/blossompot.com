import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EARLY_BIRD_DISCOUNT_PERCENT,
  EARLY_BIRD_ENDS_DATE,
  SCHEDULE_DELIVERY_HORIZON_DAYS,
  isEarlyBirdPromoActive,
  isValidScheduleDeliveryDate,
  preferredDeliveryDateToIso,
  scheduleDeliveryMaxDate,
  scheduleDeliveryMinDate,
} from "./early-bird";

describe("early bird promo", () => {
  it("is 15% off through Aug 10 2026", () => {
    assert.equal(EARLY_BIRD_DISCOUNT_PERCENT, 15);
    assert.equal(EARLY_BIRD_ENDS_DATE, "2026-08-10");
    assert.equal(isEarlyBirdPromoActive(new Date("2026-08-10T12:00:00-04:00")), true);
    assert.equal(isEarlyBirdPromoActive(new Date("2026-08-11T12:00:00-04:00")), false);
  });

  it("validates schedule delivery for the next 90 days", () => {
    const now = new Date("2026-09-11T12:00:00-04:00");
    const min = scheduleDeliveryMinDate(now);
    const max = scheduleDeliveryMaxDate(now);
    assert.equal(min, "2026-09-11");
    assert.equal(SCHEDULE_DELIVERY_HORIZON_DAYS, 90);
    assert.equal(max, "2026-12-10");
    assert.equal(isValidScheduleDeliveryDate(min, now), true);
    assert.equal(isValidScheduleDeliveryDate(max, now), true);
    assert.equal(isValidScheduleDeliveryDate("2026-09-10", now), false);
    assert.equal(isValidScheduleDeliveryDate("2026-12-11", now), false);
    assert.equal(preferredDeliveryDateToIso("2026-08-15"), "2026-08-15T16:00:00.000Z");
  });
});
