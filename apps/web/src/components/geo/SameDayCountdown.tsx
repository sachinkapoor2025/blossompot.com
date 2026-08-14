"use client";

import { useEffect, useState } from "react";

type Props = {
  timezone: string;
  cutoffTimeLocal: string;
  placeLabel: string;
  /** SSR fallback text for crawlers / first paint */
  fallbackText: string;
};

/** Parse "1:00 PM" / "2:00 PM" into hours/minutes in 24h. */
function parseCutoff(cutoff: string): { hours: number; minutes: number } | null {
  const m = cutoff.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const mer = m[3]!.toUpperCase();
  if (mer === "PM" && hours < 12) hours += 12;
  if (mer === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

function zonedParts(timeZone: string, date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  ) as Record<string, string>;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Instant corresponding to a wall-clock time in `timeZone` (DST-aware via iterative offset). */
function zonedWallTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  // Guess UTC then correct using the zone offset at that instant
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 3; i++) {
    const p = zonedParts(timeZone, new Date(utc));
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const target = Date.UTC(year, month - 1, day, hour, minute, 0);
    utc += target - asUtc;
  }
  return new Date(utc);
}

function msUntilCutoff(timezone: string, cutoffTimeLocal: string): number | null {
  const parsed = parseCutoff(cutoffTimeLocal);
  if (!parsed) return null;
  const nowParts = zonedParts(timezone);
  let target = zonedWallTimeToUtc(
    timezone,
    nowParts.year,
    nowParts.month,
    nowParts.day,
    parsed.hours,
    parsed.minutes
  );
  if (target.getTime() <= Date.now()) {
    // tomorrow
    const tomorrow = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day + 1));
    const tp = zonedParts(timezone, tomorrow);
    // easier: add 24h to target and re-normalize
    target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
    // re-snap to wall clock tomorrow
    const np = zonedParts(timezone, new Date(Date.now() + 24 * 60 * 60 * 1000));
    target = zonedWallTimeToUtc(timezone, np.year, np.month, np.day, parsed.hours, parsed.minutes);
  }
  return target.getTime() - Date.now();
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0h 0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

export function SameDayCountdown({ timezone, cutoffTimeLocal, placeLabel, fallbackText }: Props) {
  const [text, setText] = useState(fallbackText);

  useEffect(() => {
    const tick = () => {
      const ms = msUntilCutoff(timezone, cutoffTimeLocal);
      if (ms == null) {
        setText(fallbackText);
        return;
      }
      if (ms <= 0) {
        setText(`Same-day window for ${placeLabel} is closed for today — standard USA delivery still available.`);
        return;
      }
      setText(`Order within ${formatRemaining(ms)} for same-day delivery in ${placeLabel}`);
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [timezone, cutoffTimeLocal, placeLabel, fallbackText]);

  return (
    <p className="font-semibold text-primary" suppressHydrationWarning>
      {text}
    </p>
  );
}
