import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { periodRange, salesDayBucket, startOfIstDay } from "./sales-report";

describe("sales report IST day boundaries", () => {
  it("starts Today at 00:00 IST, not UTC midnight", () => {
    // 2026-08-13 02:00 UTC = 07:30 IST → still Aug 13 IST
    const now = new Date("2026-08-13T02:00:00.000Z");
    const { from, label } = periodRange("day", now);
    assert.equal(label, "Today");
    assert.equal(from.toISOString(), "2026-08-12T18:30:00.000Z"); // midnight IST
    assert.equal(startOfIstDay(now).toISOString(), from.toISOString());
  });

  it("counts early-morning IST payments as today (would be prior UTC day)", () => {
    // 2026-08-13 01:00 IST = 2026-08-12 19:30 UTC
    const now = new Date("2026-08-13T10:00:00.000Z"); // afternoon IST
    const { from, to } = periodRange("day", now);
    const paidEarlyIst = new Date("2026-08-12T19:45:00.000Z").getTime();
    assert.ok(paidEarlyIst >= from.getTime());
    assert.ok(paidEarlyIst <= to.getTime());
  });

  it("buckets paidAt into IST calendar days", () => {
    // Just after IST midnight Aug 13
    assert.equal(salesDayBucket("2026-08-12T18:30:00.000Z"), "2026-08-13");
    // Just before IST midnight Aug 13
    assert.equal(salesDayBucket("2026-08-12T18:29:59.000Z"), "2026-08-12");
  });

  it("week/month start at IST midnight N days back", () => {
    const now = new Date("2026-08-13T12:00:00.000Z");
    const week = periodRange("week", now);
    const month = periodRange("month", now);
    assert.equal(week.from.toISOString(), "2026-08-06T18:30:00.000Z");
    assert.equal(month.from.toISOString(), "2026-07-14T18:30:00.000Z");
  });
});
