import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOM_PLAN_DURATION_MAX,
  DEFAULT_SUBSCRIPTION_PLANS,
  addCalendarMonthsIso,
  customPlanPrice,
  durationLabel,
  eligibleMembershipEvents,
  groupEligibleEvents,
  membershipWindow,
  resolveMembershipEvents,
  resolvePlanDurationMonths,
  todayIsoDate,
  type SubscriptionPlan,
} from "../index";

const plans = DEFAULT_SUBSCRIPTION_PLANS.map((p) => ({
  ...p,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
})) as SubscriptionPlan[];

describe("membership events", () => {
  it("adds calendar months without overflowing the day", () => {
    assert.equal(addCalendarMonthsIso("2026-01-31", 1), "2026-02-28");
    assert.equal(addCalendarMonthsIso("2026-08-26", 3), "2026-11-26");
    assert.equal(addCalendarMonthsIso("2026-08-26", 12), "2027-08-26");
  });

  it("labels standard and custom durations", () => {
    assert.equal(durationLabel(3), "3 Months");
    assert.equal(durationLabel(12), "1 Year");
    assert.equal(durationLabel(24), "2 Years");
  });

  it("limits 3-month plans to occasions inside the membership window", () => {
    const events = eligibleMembershipEvents({ startDate: "2026-08-26", durationMonths: 3 });
    const titles = events.filter((e) => e.date).map((e) => `${e.title}:${e.date}`);
    assert.ok(titles.includes("Halloween:2026-10-31"));
    assert.ok(titles.includes("Thanksgiving:2026-11-26"));
    assert.equal(
      events.some((e) => e.occasionType === "valentines" && e.date),
      false
    );
    assert.equal(
      events.some((e) => e.occasionType === "christmas" && e.date),
      false
    );
    assert.ok(events.some((e) => e.key === "birthday" && e.needsDate));
  });

  it("includes a full year of catalog events for 1-year plans", () => {
    const events = eligibleMembershipEvents({ startDate: "2026-08-26", durationMonths: 12 });
    const types = new Set(events.filter((e) => e.date).map((e) => e.occasionType));
    assert.ok(types.has("valentines"));
    assert.ok(types.has("chocolate_day"));
    assert.ok(types.has("christmas"));
    assert.ok(events.some((e) => e.occasionType === "birthday"));
    assert.ok(events.some((e) => e.occasionType === "anniversary"));
    assert.ok(events.some((e) => e.title === "Chocolate Day" && e.date === "2027-07-07"));
  });

  it("includes two occurrences of annual events on a 2-year plan", () => {
    const events = eligibleMembershipEvents({ startDate: "2026-08-26", durationMonths: 24 });
    const valentines = events.filter((e) => e.occasionType === "valentines" && e.date);
    assert.equal(valentines.length, 2);
    assert.deepEqual(
      valentines.map((e) => e.date),
      ["2027-02-14", "2028-02-14"]
    );
  });

  it("dedupes selected events and drops dates outside the window", () => {
    const { selected } = resolveMembershipEvents({
      startDate: "2026-08-26",
      durationMonths: 3,
      selectedEvents: [
        {
          key: "halloween-2026-10-31",
          title: "Halloween",
          occasionType: "halloween",
          date: "2026-10-31",
          source: "catalog",
        },
        {
          key: "halloween-2026-10-31",
          title: "Halloween",
          occasionType: "halloween",
          date: "2026-10-31",
          source: "catalog",
        },
        {
          key: "valentines-2027-02-14",
          title: "Valentine's Day",
          occasionType: "valentines",
          date: "2027-02-14",
          source: "catalog",
        },
      ],
    });
    assert.equal(selected.length, 1);
    assert.equal(selected[0]?.date, "2026-10-31");
  });

  it("defaults to eligible dated events when the user skips customization", () => {
    const { selected } = resolveMembershipEvents({
      startDate: "2026-08-26",
      durationMonths: 3,
      skipEvents: true,
    });
    assert.ok(selected.length > 0);
    assert.equal(
      selected.some((e) => e.source === "personal"),
      false
    );
  });

  it("keeps custom events that fall inside the membership window", () => {
    const events = eligibleMembershipEvents({
      startDate: "2026-08-26",
      durationMonths: 3,
      customEvents: [{ title: "Priya's Birthday", month: 10, day: 12, occasionType: "birthday" }],
    });
    assert.ok(events.some((e) => e.title === "Priya's Birthday" && e.date === "2026-10-12"));
  });

  it("prices a custom duration from nearby standard plans", () => {
    assert.equal(customPlanPrice(3, plans), 29);
    assert.equal(customPlanPrice(12, plans), 79);
    const mid = customPlanPrice(9, plans);
    assert.ok(mid > 49 && mid < 79);
    assert.equal(resolvePlanDurationMonths(plans.find((p) => p.isCustom)!, 18), 18);
    assert.equal(resolvePlanDurationMonths(plans.find((p) => p.isCustom)!, 99), CUSTOM_PLAN_DURATION_MAX);
  });

  it("groups eligible events for the membership wizard", () => {
    const events = eligibleMembershipEvents({ startDate: "2026-08-26", durationMonths: 12 });
    const groups = groupEligibleEvents(events);
    assert.ok(groups.some((g) => g.group === "romance"));
    assert.ok(groups.some((g) => g.group === "festival"));
    assert.ok(groups.every((g) => g.events.length > 0));
  });

  it("computes a closed membership window", () => {
    const window = membershipWindow("2026-08-26", 6);
    assert.equal(window.endIso, "2027-02-26");
  });

  it("returns today's UTC date as ISO", () => {
    assert.match(todayIsoDate(new Date("2026-08-26T15:00:00.000Z")), /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(todayIsoDate(new Date("2026-08-26T15:00:00.000Z")), "2026-08-26");
  });
});
