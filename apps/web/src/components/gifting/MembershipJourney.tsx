"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  CUSTOM_PLAN_DURATION_MAX,
  CUSTOM_PLAN_DURATION_MIN,
  MEMBERSHIP_JOURNEY_STEPS,
  customPlanPrice,
  durationLabel,
  eligibleMembershipEvents,
  formatMembershipDate,
  membershipWindow,
  reminderChannelLabel,
  resolvePlanDurationMonths,
  todayIsoDate,
  toPersistedEvents,
  type EligibleMembershipEvent,
  type GiftingChannel,
  type GiftingSubscription,
  type MembershipSelectedEvent,
  type SubscriptionPlan,
} from "@blossompot/shared";
import { giftingApi } from "@/lib/gifting";
import { useLeadCapture } from "@/lib/session";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { PaymentMethodPicker, type PaymentMethod } from "@/components/PaymentMethodPicker";
import { PlanCards } from "./PlanCards";

const DRAFT_KEY = "blossompot.membership.draft.v1";

type Draft = {
  step: number;
  planId: string;
  customDurationMonths: number;
  startDate: string;
  selectedKeys: string[];
  customEvents: Array<{ title: string; month: number; day: number }>;
  reminderChannel: GiftingChannel;
  customized: boolean;
  confirmed: boolean;
  pendingSubscriptionId?: string;
};

function defaultDraft(channel: GiftingChannel): Draft {
  return {
    step: 1,
    planId: "",
    customDurationMonths: 12,
    startDate: todayIsoDate(),
    selectedKeys: [],
    customEvents: [],
    reminderChannel: channel,
    customized: false,
    confirmed: false,
  };
}

function loadDraft(channel: GiftingChannel): Draft {
  if (typeof window === "undefined") return defaultDraft(channel);
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return defaultDraft(channel);
    return { ...defaultDraft(channel), ...(JSON.parse(raw) as Draft) };
  } catch {
    return defaultDraft(channel);
  }
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="grid grid-cols-5 gap-1 sm:gap-2 mb-6">
      {MEMBERSHIP_JOURNEY_STEPS.map((item) => {
        const done = step > item.id;
        const current = step === item.id;
        return (
          <li key={item.id} className="text-center">
            <p
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                current
                  ? "bg-nav text-white"
                  : done
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {item.id}
            </p>
            <p className={`mt-1 text-[11px] sm:text-xs font-semibold ${current ? "text-primary" : "text-slate-500"}`}>
              {item.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function MembershipJourney({
  token,
  sessionId,
  plans,
  channel,
  onComplete,
}: {
  token: string;
  sessionId: string;
  plans: SubscriptionPlan[];
  channel: GiftingChannel;
  onComplete: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useMemo(() => giftingApi(token, sessionId), [token, sessionId]);
  const captureLead = useLeadCapture(sessionId);
  const confirmOnce = useRef(false);

  const [draft, setDraft] = useState<Draft>(() => loadDraft(channel));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [payment, setPayment] = useState<{
    subscription: GiftingSubscription;
    clientSecret?: string;
    paymentIntentId?: string;
    razorpayOrderId?: string;
    razorpayKeyId?: string;
  } | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("stripe");

  const plan = plans.find((p) => p.id === draft.planId) ?? null;
  const durationMonths = plan ? resolvePlanDurationMonths(plan, draft.customDurationMonths) : 0;
  const price = plan
    ? plan.isCustom
      ? customPlanPrice(durationMonths, plans)
      : plan.price
    : 0;
  const window = durationMonths ? membershipWindow(draft.startDate, durationMonths) : null;

  const eligible = useMemo<EligibleMembershipEvent[]>(() => {
    if (!durationMonths) return [];
    return eligibleMembershipEvents({
      startDate: draft.startDate,
      durationMonths,
      customEvents: draft.customEvents,
    });
  }, [draft.startDate, draft.customEvents, durationMonths]);

  const selectedEvents: MembershipSelectedEvent[] = useMemo(() => {
    const chosen = draft.customized
      ? eligible.filter((e) => draft.selectedKeys.includes(e.key))
      : eligible.filter((e) => !e.needsDate);
    return toPersistedEvents(chosen);
  }, [draft.customized, draft.selectedKeys, eligible]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  const syncStep = useCallback(
    (step: number, extra?: Partial<Draft>) => {
      setDraft((prev) => ({ ...prev, ...extra, step }));
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "membership");
      params.set("step", String(step));
      router.replace(`/account?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const urlStep = Number(searchParams.get("step") ?? draft.step);
    if (urlStep >= 2 && !draft.planId) {
      syncStep(1);
      return;
    }
    if (urlStep >= 5 && !draft.confirmed) {
      syncStep(4);
      return;
    }
    if (urlStep !== draft.step && urlStep >= 1 && urlStep <= 5) {
      setDraft((prev) => ({ ...prev, step: urlStep }));
    }
  }, [searchParams, draft.planId, draft.confirmed, draft.step, syncStep]);

  useEffect(() => {
    const redirectStatus = searchParams.get("redirect_status");
    const paymentIntent = searchParams.get("payment_intent");
    const subscriptionId = payment?.subscription.id ?? draft.pendingSubscriptionId;
    if (confirmOnce.current || redirectStatus !== "succeeded" || !paymentIntent || !subscriptionId) return;
    confirmOnce.current = true;
    void (async () => {
      setBusy(true);
      try {
        await client.confirm({
          subscriptionId,
          paymentIntentId: paymentIntent,
        });
        sessionStorage.removeItem(DRAFT_KEY);
        onComplete();
      } catch (err) {
        confirmOnce.current = false;
        setError(err instanceof Error ? err.message : "Could not confirm membership payment");
      } finally {
        setBusy(false);
      }
    })();
  }, [searchParams, payment, draft.pendingSubscriptionId, client, onComplete]);

  const selectPlan = (planId: string) => {
    const nextPlan = plans.find((p) => p.id === planId);
    setError("");
    void captureLead({ page: "/account?tab=membership", source: "browse" });
    syncStep(1, {
      planId,
      customDurationMonths: nextPlan?.isCustom ? 12 : nextPlan?.durationMonths ?? 12,
      confirmed: false,
    });
  };

  const goEvents = (overrides?: Partial<Draft>) => {
    const next = { ...draft, ...overrides };
    const nextPlan = plans.find((p) => p.id === next.planId) ?? plan;
    if (!nextPlan) {
      setError("Select a membership plan to continue.");
      return;
    }
    if (nextPlan.isCustom && (next.customDurationMonths < CUSTOM_PLAN_DURATION_MIN || next.customDurationMonths > CUSTOM_PLAN_DURATION_MAX)) {
      setError(`Choose a custom length between ${CUSTOM_PLAN_DURATION_MIN} and ${CUSTOM_PLAN_DURATION_MAX} months.`);
      return;
    }
    const nextEligible = eligibleMembershipEvents({
      startDate: next.startDate,
      durationMonths: resolvePlanDurationMonths(nextPlan, next.customDurationMonths),
      customEvents: next.customEvents,
    });
    syncStep(2, {
      ...overrides,
      selectedKeys: nextEligible.filter((e) => !e.needsDate).map((e) => e.key),
      customized: false,
    });
    setCustomizing(false);
    setError("");
  };

  const goReminders = () => {
    if (selectedEvents.length === 0) {
      setError("Select at least one event, or tap Skip to keep the suggested occasions.");
      return;
    }
    setError("");
    syncStep(3);
  };

  const goReview = () => {
    if (!draft.reminderChannel) {
      setError("Choose how you want to receive reminders.");
      return;
    }
    setError("");
    syncStep(4);
  };

  const goPayment = () => {
    setError("");
    syncStep(5, { confirmed: true });
  };

  const addCustomEvent = () => {
    const title = customTitle.trim();
    if (!title || !customDate) {
      setError("Add a name and date for your custom event.");
      return;
    }
    const [, month, day] = customDate.split("-").map(Number);
    if (!month || !day) return;
    const endIso = window?.endIso;
    if (endIso && (customDate < draft.startDate || customDate > endIso)) {
      setError("Custom event dates must fall inside your membership window.");
      return;
    }
    setError("");
    const nextCustom = [...draft.customEvents, { title, month, day }];
    const nextEligible = eligibleMembershipEvents({
      startDate: draft.startDate,
      durationMonths,
      customEvents: nextCustom,
    });
    const extraKeys = nextEligible.filter((e) => e.source === "custom").map((e) => e.key);
    setDraft((prev) => ({
      ...prev,
      customEvents: nextCustom,
      customized: true,
      selectedKeys: Array.from(new Set([...prev.selectedKeys, ...extraKeys])),
    }));
    setCustomTitle("");
    setCustomDate("");
  };

  const startPayment = async () => {
    if (!plan) return;
    setBusy(true);
    setError("");
    try {
      const started = await client.subscribe({
        planId: plan.id,
        paymentMethod: method,
        reminderChannel: draft.reminderChannel,
        membershipStartDate: draft.startDate,
        customDurationMonths: plan.isCustom ? draft.customDurationMonths : undefined,
        selectedEvents,
        skipEvents: !draft.customized,
      });
      const secret = started.payment.clientSecret ?? started.payment.paymentIntentId ?? "";
      const localPayment =
        !secret || secret.includes("_dev_") || secret.includes("_loadtest_") || (started.payment.razorpayOrderId ?? "").includes("_dev_");
      if (localPayment) {
        await client.confirm({
          subscriptionId: started.subscription.id,
          paymentIntentId: started.payment.paymentIntentId,
          razorpayOrderId: started.payment.razorpayOrderId,
        });
        sessionStorage.removeItem(DRAFT_KEY);
        onComplete();
        return;
      }
      setPayment({
        subscription: started.subscription,
        clientSecret: started.payment.clientSecret,
        paymentIntentId: started.payment.paymentIntentId,
        razorpayOrderId: started.payment.razorpayOrderId,
        razorpayKeyId: started.payment.razorpayKeyId,
      });
      setDraft((prev) => ({ ...prev, pendingSubscriptionId: started.subscription.id, confirmed: true, step: 5 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start membership payment");
    } finally {
      setBusy(false);
    }
  };

  const payRazorpay = async () => {
    if (!payment?.razorpayOrderId || !payment.subscription) return;
    const key = payment.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) {
      setError("Razorpay is not configured.");
      return;
    }
    const RazorpayCtor = (window as unknown as { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay;
    if (!RazorpayCtor) {
      setError("Razorpay checkout failed to load. Refresh and try again.");
      return;
    }
    const rzp = new RazorpayCtor({
      key,
      amount: Math.round(payment.subscription.price * 100),
      currency: payment.subscription.currency,
      name: "BlossomPot",
      description: payment.subscription.planName,
      order_id: payment.razorpayOrderId,
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await client.confirm({
            subscriptionId: payment.subscription.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          sessionStorage.removeItem(DRAFT_KEY);
          onComplete();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not confirm Razorpay payment");
        }
      },
    });
    rzp.open();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-primary">Start your membership</h2>
        <p className="text-sm text-slate-600 mt-1">
          One decision at a time — plan, events, reminders, review, then payment.
        </p>
      </div>
      <Stepper step={draft.step} />
      {error && <p className="text-sm text-red-600">{error}</p>}

      {draft.step === 1 && (
        <div className="space-y-5">
          <PlanCards plans={plans} busy={busy} selectedPlanId={draft.planId} onSelect={selectPlan} />
          {plan && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">
                {plan.isCustom ? "Customize your plan" : "Membership start date"}
              </p>
              {plan.isCustom && (
                <label className="block text-sm">
                  Duration (1–24 months)
                  <input
                    type="number"
                    min={CUSTOM_PLAN_DURATION_MIN}
                    max={CUSTOM_PLAN_DURATION_MAX}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={draft.customDurationMonths}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, customDurationMonths: Number(e.target.value) }))
                    }
                  />
                </label>
              )}
              <label className="block text-sm">
                Start date
                <input
                  type="date"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={draft.startDate}
                  onChange={(e) => setDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </label>
              {plan.isCustom && (
                <p className="text-sm text-slate-600">
                  {durationLabel(durationMonths)} · ${price}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={goEvents} className="min-h-11 rounded-full bg-nav px-5 text-white font-semibold">
                  Next
                </button>
                <button
                  type="button"
                  onClick={() =>
                    goEvents({
                      startDate: todayIsoDate(),
                      customDurationMonths: plan.isCustom ? 12 : draft.customDurationMonths,
                    })
                  }
                  className="min-h-11 rounded-full border border-slate-300 px-5 font-semibold"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {draft.step === 2 && window && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Occasions from {formatMembershipDate(draft.startDate)} to {formatMembershipDate(window.endIso)}
            {durationMonths >= 12
              ? " — all supported events in this membership are available."
              : " — only events that fall in your membership window are shown."}
          </p>
          <div className="flex flex-wrap gap-2">
            {plan?.allowsEventCustomization !== false && (
              <button
                type="button"
                onClick={() => {
                  setCustomizing(true);
                  setDraft((prev) => ({
                    ...prev,
                    customized: true,
                    selectedKeys: prev.selectedKeys.length ? prev.selectedKeys : eligible.filter((e) => !e.needsDate).map((e) => e.key),
                  }));
                }}
                className="min-h-10 rounded-full border border-slate-300 px-4 text-sm font-semibold"
              >
                Customize Events
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {eligible.map((event) => {
              const checked = draft.customized ? draft.selectedKeys.includes(event.key) : !event.needsDate;
              return (
                <li key={event.key} className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-start gap-3">
                  {customizing ? (
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={() => {
                        setDraft((prev) => {
                          const has = prev.selectedKeys.includes(event.key);
                          return {
                            ...prev,
                            customized: true,
                            selectedKeys: has
                              ? prev.selectedKeys.filter((k) => k !== event.key)
                              : [...prev.selectedKeys, event.key],
                          };
                        });
                      }}
                    />
                  ) : (
                    <span className="mt-1 text-emerald-600">{checked ? "✓" : "–"}</span>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">{event.title}</p>
                    <p className="text-sm text-slate-500">
                      {event.date ? formatMembershipDate(event.date) : event.needsDate ? "Add a date to include this" : "Saved dates during membership"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {customizing && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 space-y-3">
              <p className="text-sm font-semibold">Add a custom date in this window</p>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. The day we met"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={customDate}
                min={draft.startDate}
                max={window.endIso}
                onChange={(e) => setCustomDate(e.target.value)}
              />
              <button type="button" onClick={addCustomEvent} className="min-h-10 rounded-full bg-slate-800 px-4 text-sm text-white font-semibold">
                Add event
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => syncStep(1)} className="min-h-11 rounded-full border border-slate-300 px-5 font-semibold">
              Back
            </button>
            <button type="button" onClick={goReminders} className="min-h-11 rounded-full bg-nav px-5 text-white font-semibold">
              Next
            </button>
            <button
              type="button"
              onClick={() => {
                syncStep(3, {
                  customized: false,
                  selectedKeys: eligible.filter((e) => !e.needsDate).map((e) => e.key),
                });
              }}
              className="min-h-11 rounded-full border border-slate-300 px-5 font-semibold"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {draft.step === 3 && (
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-slate-700">How should we remind you?</legend>
            {(["email", "whatsapp", "both"] as const).map((value) => (
              <label key={value} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <input
                  type="radio"
                  name="reminder-channel"
                  checked={draft.reminderChannel === value}
                  onChange={() => setDraft((prev) => ({ ...prev, reminderChannel: value }))}
                />
                {reminderChannelLabel(value)}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => syncStep(2)} className="min-h-11 rounded-full border border-slate-300 px-5 font-semibold">
              Back
            </button>
            <button type="button" onClick={goReview} className="min-h-11 rounded-full bg-nav px-5 text-white font-semibold">
              Next
            </button>
          </div>
        </div>
      )}

      {draft.step === 4 && plan && window && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-slate-500">Plan</p>
                <p className="font-semibold text-slate-900">{plan.isCustom ? "Custom Plan" : plan.name}</p>
              </div>
              <button type="button" className="text-nav font-semibold" onClick={() => syncStep(1)}>
                Edit
              </button>
            </div>
            <p>
              <span className="text-slate-500">Duration:</span> {durationLabel(durationMonths)}
            </p>
            <p>
              <span className="text-slate-500">Starts:</span> {formatMembershipDate(draft.startDate)}
            </p>
            <p>
              <span className="text-slate-500">Ends:</span> {formatMembershipDate(window.endIso)}
            </p>
            <p>
              <span className="text-slate-500">Price:</span> ${price}
            </p>
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-slate-500">Reminders</p>
                <p className="font-semibold">{reminderChannelLabel(draft.reminderChannel)}</p>
              </div>
              <button type="button" className="text-nav font-semibold" onClick={() => syncStep(3)}>
                Edit
              </button>
            </div>
            <div>
              <div className="flex justify-between gap-3">
                <p className="text-slate-500">Selected events</p>
                <button type="button" className="text-nav font-semibold" onClick={() => syncStep(2)}>
                  Edit
                </button>
              </div>
              <ul className="mt-2 space-y-1">
                {selectedEvents.map((event) => (
                  <li key={event.key}>
                    {event.title}
                    {event.date ? ` — ${formatMembershipDate(event.date)}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => syncStep(3)} className="min-h-11 rounded-full border border-slate-300 px-5 font-semibold">
              Back
            </button>
            <button type="button" onClick={goPayment} className="min-h-11 rounded-full bg-nav px-5 text-white font-semibold">
              Confirm
            </button>
          </div>
        </div>
      )}

      {draft.step === 5 && plan && (
        <div className="space-y-4">
          {searchParams.get("redirect_status") === "succeeded" && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {busy ? "Confirming your membership payment…" : "Payment received. Finishing your membership…"}
            </p>
          )}
          <p className="text-sm text-slate-600">
            Pay ${price} to activate {plan.isCustom ? "your custom plan" : plan.name}. Card details are processed by Stripe or Razorpay — we never store them.
          </p>
          <PaymentMethodPicker value={method} onChange={setMethod} checkoutCurrency={plan.currency} />
          {method === "razorpay" && (
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
          )}
          {!payment && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => syncStep(4)} className="min-h-11 rounded-full border border-slate-300 px-5 font-semibold">
                Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void startPayment()}
                className="min-h-11 rounded-full bg-nav px-5 text-white font-semibold disabled:opacity-50"
              >
                {busy ? "Starting…" : "Continue to payment"}
              </button>
            </div>
          )}
          {payment?.clientSecret && method === "stripe" && (
            <StripePaymentForm
              clientSecret={payment.clientSecret}
              returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/account?tab=membership&step=5`}
              amountLabel={`$${price}`}
              onError={setError}
            />
          )}
          {payment?.razorpayOrderId && method === "razorpay" && (
            <button
              type="button"
              onClick={() => void payRazorpay()}
              className="min-h-11 w-full rounded-full bg-nav text-white font-semibold"
            >
              Pay with Razorpay
            </button>
          )}
        </div>
      )}
    </div>
  );
}
