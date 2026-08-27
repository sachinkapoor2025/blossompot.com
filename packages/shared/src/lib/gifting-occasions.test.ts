import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  daysUntil,
  formatMonthDay,
  isRecipientProfileComplete,
  mergeUpcomingOccasions,
  nextMonthDay,
  nthWeekdayOfMonth,
  toIsoDate,
} from "./gifting-occasions";
import type { GiftRecipient } from "../schemas/gifting";

describe("gifting occasions", () => {
  it("computes next month/day in the following year when already passed", () => {
    const from = new Date("2026-08-22T00:00:00.000Z");
    const next = nextMonthDay(3, 15, from);
    assert.equal(toIsoDate(next), "2027-03-15");
  });

  it("keeps a future date in the same year", () => {
    const from = new Date("2026-02-01T00:00:00.000Z");
    const next = nextMonthDay(6, 10, from);
    assert.equal(toIsoDate(next), "2026-06-10");
  });

  it("computes US Mother's Day as the second Sunday of May", () => {
    const day = nthWeekdayOfMonth(2026, 5, 0, 2);
    assert.equal(toIsoDate(day), "2026-05-10");
  });

  it("counts days until an occasion", () => {
    assert.equal(daysUntil("2026-08-29", new Date("2026-08-22T12:00:00.000Z")), 7);
  });

  it("builds upcoming occasions from a recipient", () => {
    const recipient: GiftRecipient = {
      id: "r1",
      userId: "u1",
      name: "Sarah",
      relationship: "wife",
      birthday: { month: 6, day: 10 },
      anniversary: { month: 3, day: 15 },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const upcoming = mergeUpcomingOccasions({
      recipients: [recipient],
      occasions: [],
      includeNational: false,
      from: new Date("2026-08-22T00:00:00.000Z"),
    });
    assert.equal(upcoming[0]?.title, "Sarah's Anniversary");
    assert.equal(upcoming[0]?.date, "2027-03-15");
    assert.equal(upcoming[1]?.title, "Sarah's Birthday");
  });

  it("requires dates plus preferences for a complete profile", () => {
    const incomplete: GiftRecipient = {
      id: "r1",
      userId: "u1",
      name: "Mom",
      relationship: "mother",
      createdAt: "",
      updatedAt: "",
    };
    assert.equal(isRecipientProfileComplete(incomplete), false);
    assert.equal(
      isRecipientProfileComplete({
        ...incomplete,
        birthday: { month: 1, day: 2 },
        preferences: { favouriteFlower: "roses", budgetMax: 75 },
      }),
      true
    );
  });

  it("formats month/day for display", () => {
    assert.equal(formatMonthDay(6, 10), "June 10");
  });
});
