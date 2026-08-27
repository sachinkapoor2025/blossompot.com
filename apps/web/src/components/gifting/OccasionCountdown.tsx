"use client";

import type { UpcomingOccasionView } from "@blossompot/shared";

const ICONS: Record<string, string> = {
  birthday: "🎂",
  anniversary: "❤️",
  valentines: "💕",
  mothers_day: "🌷",
  fathers_day: "👔",
  rakhi: "🎁",
  christmas: "🎄",
  custom: "🌸",
};

export function OccasionCountdown({ occasions }: { occasions: UpcomingOccasionView[] }) {
  if (occasions.length === 0) {
    return <p className="text-sm text-slate-500">No upcoming dates yet. Add a birthday or a day you never want to forget.</p>;
  }

  return (
    <ul className="space-y-3">
      {occasions.map((item) => (
        <li
          key={item.key}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <div className="shrink-0 w-16 text-center">
            <p className="text-lg font-bold text-primary leading-none">{item.daysLeft}</p>
            <p className="text-[11px] text-slate-500 mt-1">{item.daysLeft === 1 ? "day left" : "days left"}</p>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">
              {ICONS[item.occasionType] ?? "🎁"} {item.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
