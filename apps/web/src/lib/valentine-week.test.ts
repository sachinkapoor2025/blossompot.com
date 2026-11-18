import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  VALENTINE_WEEK_DAYS,
  valentineWeekDayFromPath,
  valentineWeekHref,
  valentineWeekNavLabel,
  valentineWeekShopHref,
} from "./valentine-week";

describe("Valentine week menu links", () => {
  it("lists the eight February special days in order", () => {
    assert.deepEqual(
      VALENTINE_WEEK_DAYS.map((day) => `${day.name} — ${day.date}`),
      [
        "Rose Day — 7 February",
        "Propose Day — 8 February",
        "Chocolate Day — 9 February",
        "Teddy Day — 10 February",
        "Promise Day — 11 February",
        "Hug Day — 12 February",
        "Kiss Day — 13 February",
        "Valentine's Day — 14 February",
      ]
    );
  });

  it("points every day at its own country shop URL", () => {
    assert.deepEqual(
      VALENTINE_WEEK_DAYS.map((day) => valentineWeekHref(day, "US")),
      [
        "/rose-day-gifts-to-usa",
        "/propose-day-gifts-to-usa",
        "/chocolate-day-gifts-to-usa",
        "/teddy-day-gifts-to-usa",
        "/promise-day-gifts-to-usa",
        "/hug-day-gifts-to-usa",
        "/kiss-day-gifts-to-usa",
        "/valentines-day-gifts-to-usa",
      ]
    );
    assert.equal(valentineWeekShopHref("US"), "/valentines-day-gifts-to-usa");
  });

  it("names the nav item after the open special day", () => {
    assert.equal(valentineWeekNavLabel("/"), "Valentine's");
    assert.equal(valentineWeekNavLabel("/flowers-to-usa"), "Valentine's");
    assert.equal(valentineWeekNavLabel("/rose-day-gifts-to-usa"), "Rose Day");
    assert.equal(valentineWeekNavLabel("/propose-day-gifts-to-uk"), "Propose Day");
    assert.equal(valentineWeekNavLabel("/chocolate-day-gifts"), "Chocolate Day");
    assert.equal(valentineWeekNavLabel("/valentines-day-gifts-to-usa"), "Valentine's Day");
    assert.equal(valentineWeekDayFromPath("/kiss-day-gifts-to-australia")?.id, "kiss-day");
    assert.equal(valentineWeekDayFromPath("/special-days/hug-day")?.id, "hug-day");
  });
});
