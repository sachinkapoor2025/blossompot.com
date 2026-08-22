"use client";

import { useState } from "react";
import type { GiftingChannel, GiftingSubscription, SubscriptionPlan } from "@blossompot/shared";
import { giftingApi } from "@/lib/gifting";
import { PlanCards } from "./PlanCards";

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
  const [reminderChannel, setReminderChannel] = useState<GiftingChannel>(channel);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const start = async (planId: string) => {
    setError("");
    setBusy(true);
    try {
      const started = await client.subscribe({ planId, reminderChannel, paymentMethod: "stripe" });
      const secret = started.payment.clientSecret ?? started.payment.paymentIntentId ?? "";
      const localPayment = !secret || secret.includes("_dev_") || secret.includes("_loadtest_");
      if (!localPayment && started.payment.clientSecret && window.location.origin) {
        setError("Card payment is required to activate this plan. Complete Stripe checkout, or use local/dev mode to activate without a live key.");
        return;
      }
      await client.confirm({
        subscriptionId: started.subscription.id,
        paymentIntentId: started.payment.paymentIntentId,
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start membership");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-primary">Membership</h2>
      {active && subscription ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-semibold text-emerald-900">{subscription.planName} is active</p>
          {subscription.expiresAt && (
            <p className="text-emerald-800 mt-1">
              Renews / ends {new Date(subscription.expiresAt).toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
          )}
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-red-700"
            onClick={() => void client.cancel().then(onChanged)}
          >
            Cancel membership
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          This is not a discount club. BlossomPot remembers the dates, reminds you, and helps you choose the gift.
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-700">Reminder channel</legend>
        {(["email", "whatsapp", "both"] as const).map((value) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="channel"
              checked={reminderChannel === value}
              onChange={() => {
                setReminderChannel(value);
                void client.updatePrefs({ reminderChannel: value });
              }}
            />
            {value === "both" ? "Email + WhatsApp" : value === "whatsapp" ? "WhatsApp (when configured)" : "Email"}
          </label>
        ))}
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!active && <PlanCards plans={plans} busy={busy} onSelect={start} />}
    </div>
  );
}
