"use client";

import { useState } from "react";
import Link from "next/link";
import {
  durationLabel,
  formatMembershipDate,
  reminderChannelLabel,
  type GiftingChannel,
  type GiftingSubscription,
  type SubscriptionPlan,
} from "@blossompot/shared";
import { giftingApi } from "@/lib/gifting";
import { MembershipJourney } from "./MembershipJourney";

export function MembershipPanel({
  token,
  sessionId,
  subscription,
  active,
  plans,
  channel,
  onChanged,
}: {
  token: string;
  sessionId: string;
  subscription: GiftingSubscription | null;
  active: boolean;
  plans: SubscriptionPlan[];
  channel: GiftingChannel;
  onChanged: () => void;
}) {
  const client = giftingApi(token, sessionId);
  const [cancelling, setCancelling] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  if (active && subscription) {
    return (
      <div className="space-y-5">
        {justJoined && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-semibold">Membership confirmed</p>
            <h2 className="text-xl font-bold text-emerald-950 mt-1">You’re all set</h2>
            <p className="text-sm text-emerald-800 mt-2">
              {subscription.planName} is active. We’ll remind you by{" "}
              {reminderChannelLabel(subscription.reminderChannel ?? channel).toLowerCase()} before the occasions you
              selected. Gifts are never charged automatically.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/account?tab=people"
                className="inline-flex min-h-11 items-center rounded-full bg-nav px-5 text-sm font-semibold text-white"
              >
                Add your people
              </Link>
              <Link
                href="/account?tab=calendar"
                className="inline-flex min-h-11 items-center rounded-full border border-emerald-300 px-5 text-sm font-semibold text-emerald-900"
              >
                View calendar
              </Link>
            </div>
          </div>
        )}
        <div className="rounded-xl border border-emerald-200 bg-white p-4 text-sm">
          <p className="font-semibold text-emerald-900">{subscription.planName} is active</p>
          {subscription.membershipStartDate && (
            <p className="text-emerald-800 mt-1">Starts {formatMembershipDate(subscription.membershipStartDate)}</p>
          )}
          {subscription.expiresAt && (
            <p className="text-emerald-800 mt-1">
              Renews / ends {new Date(subscription.expiresAt).toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
          )}
          <p className="text-emerald-800 mt-1">
            {durationLabel(subscription.durationMonths)} ·{" "}
            {reminderChannelLabel(subscription.reminderChannel ?? channel)}
          </p>
          <button
            type="button"
            disabled={cancelling}
            className="mt-3 text-sm font-semibold text-red-700 disabled:opacity-50"
            onClick={() => {
              setCancelling(true);
              void client.cancel().then(onChanged).finally(() => setCancelling(false));
            }}
          >
            Cancel membership
          </button>
        </div>
        {(subscription.selectedEvents?.length ?? 0) > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-primary">Reminder events</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {subscription.selectedEvents?.map((event) => (
                <li key={event.key}>
                  {event.title}
                  {event.date ? ` — ${formatMembershipDate(event.date)}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <MembershipJourney
      token={token}
      sessionId={sessionId}
      plans={plans}
      channel={channel}
      onComplete={() => {
        setJustJoined(true);
        onChanged();
      }}
    />
  );
}
