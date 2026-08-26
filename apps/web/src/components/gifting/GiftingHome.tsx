"use client";

import Link from "next/link";
import type { GiftingDashboard } from "@/lib/gifting";
import { OccasionCountdown } from "./OccasionCountdown";

export function GiftingHome({
  data,
  onAddPeople,
}: {
  data: GiftingDashboard;
  onAddPeople: () => void;
}) {
  const next = data.nextOccasion;
  const streak = data.streak.giftCount;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-primary via-[#9e2d55] to-accent text-white p-5 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">Your next special moment</p>
        {next ? (
          <>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight">{next.title}</h2>
            <p className="mt-2 text-white/90">
              {new Date(`${next.date}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              {" · "}
              {next.daysLeft === 0 ? "Today" : `${next.daysLeft} day${next.daysLeft === 1 ? "" : "s"} remaining`}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={
                  next.recipientId
                    ? `/account?tab=gifts&recipientId=${next.recipientId}&occasionType=${next.occasionType}`
                    : "/products"
                }
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary"
              >
                Choose a Gift
              </Link>
              <Link
                href={`/forgot-occasion${next.recipientId ? `?recipientId=${next.recipientId}` : ""}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/70 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Forgot? Send now
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold">Never forget a special occasion again</h2>
            <p className="mt-2 text-white/90">Add the people you love. BlossomPot remembers the dates and helps you choose.</p>
            <button
              type="button"
              onClick={onAddPeople}
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary"
            >
              Add your people
            </button>
          </>
        )}
      </section>

      {!data.subscriptionActive && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Start a BlossomPot membership to save people, dates, and reminders.{" "}
          <Link href="/account?tab=membership" className="font-semibold underline">
            Choose a plan
          </Link>
        </div>
      )}

      {data.openChoice && (
        <Link
          href={`/gifting/choose/${data.openChoice.token}`}
          className="block rounded-xl border border-primary/20 bg-rose-50 px-4 py-3 text-sm text-primary"
        >
          A gift choice window is open for {data.openChoice.occasionTitle}. Tap to choose before it expires.
        </Link>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["People", String(data.stats.peopleCount)],
          ["Upcoming", String(data.stats.upcomingCount)],
          ["Gifts sent", String(data.stats.giftsSent)],
          ["Blossom Points", String(data.stats.points)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-primary">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {streak > 0 && (
        <p className="text-sm text-slate-600">
          You&apos;ve made {streak} special moment{streak === 1 ? "" : "s"} unforgettable! 🌸
        </p>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-primary">Upcoming occasions</h3>
          <Link href="/account?tab=calendar" className="text-sm text-nav font-semibold">
            Calendar
          </Link>
        </div>
        <OccasionCountdown occasions={data.upcoming.slice(0, 6)} />
      </section>
    </div>
  );
}
