import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  earliestOpenScheduleDeliveryDate,
  quoteCartDeliveryDateShipping,
} from "./delivery-date-shipping";

/** Monday 23 Nov 2026, afternoon in America/New_York. */
const MONDAY = new Date("2026-11-23T18:00:00Z");

describe("quoteCartDeliveryDateShipping", () => {
  it("prices each product from how soon the selected date is", () => {
    const quote = (deliveryDate: string, quantity = 1) =>
      quoteCartDeliveryDateShipping({
        items: [{ quantity }],
        deliveryDate,
        currency: "USD",
        usdInrRate: 96,
        now: MONDAY,
      });

    assert.equal(quote("2026-11-23").tier, "same_day");
    assert.equal(quote("2026-11-23").totalCharge, 16);
    assert.equal(quote("2026-11-24").tier, "next_day");
    assert.equal(quote("2026-11-24").totalCharge, 18);
    assert.equal(quote("2026-11-25").tier, "within_3_days");
    assert.equal(quote("2026-11-26").totalCharge, 20);
    assert.equal(quote("2026-11-27").tier, "within_5_days");
    assert.equal(quote("2026-11-27").totalCharge, 0);
    assert.equal(quote("2026-11-30").tier, "later");
    assert.equal(quote("2026-11-30").totalCharge, 0);
  });

  it("adds the same fee to every unit", () => {
    const quote = quoteCartDeliveryDateShipping({
      items: [
        { quantity: 1 },
        { quantity: 2 },
      ],
      deliveryDate: "2026-11-24",
      currency: "USD",
      usdInrRate: 96,
      now: MONDAY,
    });
    assert.equal(quote.perUnitUsd, 18);
    assert.equal(quote.totalCharge, 54);
  });

  it("uses the next open weekday when no date is selected", () => {
    const friday = new Date("2026-11-27T18:00:00Z");
    assert.equal(earliestOpenScheduleDeliveryDate(friday), "2026-11-27");
    const sameDay = quoteCartDeliveryDateShipping({
      items: [{ quantity: 1 }],
      deliveryDate: "",
      currency: "USD",
      usdInrRate: 96,
      now: friday,
    });
    assert.equal(sameDay.deliveryDate, "2026-11-27");
    assert.equal(sameDay.tier, "same_day");
    assert.equal(sameDay.totalCharge, 16);

    const saturday = new Date("2026-11-28T18:00:00Z");
    assert.equal(earliestOpenScheduleDeliveryDate(saturday), "2026-11-30");
  });
});
