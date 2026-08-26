"use client";

import { useState } from "react";
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
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h2 className="text-lg font-bold text-emerald-900">Membership confirmed</h2>
            <p className="text-sm text-emerald-800 mt-1">
              {subscription.planName} is active. We’ll remind you before the occasions you selected.
            </p>
          </div>
        )}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-semibold text-emerald-900">{subscription.planName} is active</p>
          {subscription.membershipStartDate && (
            <p className="text-emerald-800 mt-1">Starts {formatMembershipDate(subscription.membershipStartDate)}</p>
          )}
          {subscription.expiresAt && (
            <p className="text-emerald-800 mt-1">
              Renews / ends{" "}
              {new Date(subscription.expiresAt).toLocaleDateString("en-US", { dateStyle: "long" })}
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
