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
  groupEligibleEvents,
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

const DRAFT_KEY = "blossompot.membership.draft.v2";

type GatewayPayment = {
  subscription: GiftingSubscription;
  clientSecret?: string;
  paymentIntentId?: string;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
};

type RazorpayCtor = new (opts: Record<string, unknown>) => {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
};

function waitForRazorpay(timeoutMs = 10000): Promise<RazorpayCtor> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const ctor = (globalThis as typeof globalThis & { Razorpay?: RazorpayCtor }).Razorpay;
      if (ctor) {
        resolve(ctor);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error("Razorpay checkout failed to load. Disable ad blockers or try another network, then retry."));
        return;
      }
      setTimeout(tick, 120);
    };
    tick();
  });
}

function isSimulatedGatewayPayment(payment: GatewayPayment, method: PaymentMethod): boolean {
  if (method === "razorpay") {
    const orderId = payment.razorpayOrderId ?? "";
    return !orderId || orderId.includes("_dev_") || orderId.includes("_loadtest_");
  }
  const secret = payment.clientSecret ?? payment.paymentIntentId ?? "";
  return !secret || secret.includes("_dev_") || secret.includes("_loadtest_");
}

function paymentMatchesMethod(payment: GatewayPayment, method: PaymentMethod): boolean {
  if (method === "razorpay") return Boolean(payment.razorpayOrderId) && !payment.clientSecret;
  return Boolean(payment.clientSecret);
}

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
  paymentMethod?: PaymentMethod;
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

function defaultKeys(events: EligibleMembershipEvent[]) {
  return events.filter((event) => !event.needsDate).map((event) => event.key);
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
                current ? "bg-nav text-white" : done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {done ? "✓" : item.id}
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
  const appliedPlan = useRef(false);

  const [draft, setDraft] = useState<Draft>(() => loadDraft(channel));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [payment, setPayment] = useState<GatewayPayment | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(() => loadDraft(channel).paymentMethod ?? "stripe");
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [openingGateway, setOpeningGateway] = useState(false);
  const confirmingPay = useRef(false);

  useEffect(() => {
    if (draft.step !== 5 || method !== "razorpay") return;
    const host = globalThis as typeof globalThis & { Razorpay?: unknown };
    if (host.Razorpay) {
      setRazorpayReady(true);
      return;
    }
    const id = window.setInterval(() => {
      if ((globalThis as typeof globalThis & { Razorpay?: unknown }).Razorpay) {
        setRazorpayReady(true);
        window.clearInterval(id);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [draft.step, method]);

  const plan = plans.find((p) => p.id === draft.planId) ?? null;
  const durationMonths = plan ? resolvePlanDurationMonths(plan, draft.customDurationMonths) : 0;
  const price = plan ? (plan.isCustom ? customPlanPrice(durationMonths, plans) : plan.price) : 0;
  const membershipTerm = durationMonths ? membershipWindow(draft.startDate, durationMonths) : null;
  const customizingPlan = Boolean(plan?.isCustom && draft.step === 1);

  useEffect(() => {
    if (plan?.currency === "INR" && method !== "razorpay") {
      setMethod("razorpay");
      setPayment(null);
    }
  }, [plan?.currency, method]);

  const eligible = useMemo<EligibleMembershipEvent[]>(() => {
    if (!durationMonths) return [];
    return eligibleMembershipEvents({
      startDate: draft.startDate,
      durationMonths,
      customEvents: draft.customEvents,
    });
  }, [draft.startDate, draft.customEvents, durationMonths]);

  const grouped = useMemo(() => groupEligibleEvents(eligible), [eligible]);

  const selectedEvents: MembershipSelectedEvent[] = useMemo(() => {
    const chosen = draft.customized
      ? eligible.filter((event) => draft.selectedKeys.includes(event.key))
      : eligible.filter((event) => !event.needsDate);
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
      if (extra?.planId || draft.planId) params.set("plan", extra?.planId || draft.planId);
      router.replace(`/account?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, draft.planId]
  );

  useEffect(() => {
    const urlStep = Number(searchParams.get("step") || draft.step);
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
        await confirmMembershipPayment({ subscriptionId, paymentIntentId: paymentIntent });
      } catch (err) {
        confirmOnce.current = false;
        setError(err instanceof Error ? err.message : "Could not confirm membership payment");
      } finally {
        setBusy(false);
      }
    })();
  }, [searchParams, payment, draft.pendingSubscriptionId, client, onComplete]);

  const goEvents = (overrides?: Partial<Draft>) => {
    const next = { ...draft, ...overrides };
    const nextPlan = plans.find((item) => item.id === next.planId) ?? plan;
    if (!nextPlan) {
      setError("Select a membership plan to continue.");
      return;
    }
    if (
      nextPlan.isCustom &&
      (next.customDurationMonths < CUSTOM_PLAN_DURATION_MIN || next.customDurationMonths > CUSTOM_PLAN_DURATION_MAX)
    ) {
      setError(`Choose a custom length between ${CUSTOM_PLAN_DURATION_MIN} and ${CUSTOM_PLAN_DURATION_MAX} months.`);
      return;
    }
    const months = resolvePlanDurationMonths(nextPlan, next.customDurationMonths);
    const nextEligible = eligibleMembershipEvents({
      startDate: next.startDate,
      durationMonths: months,
      customEvents: next.customEvents,
    });
    syncStep(2, {
      ...overrides,
      selectedKeys: defaultKeys(nextEligible),
      customized: false,
    });
    setCustomizing(false);
    setError("");
  };

  useEffect(() => {
    if (appliedPlan.current) return;
    if (draft.step !== 1 || draft.planId) {
      if (draft.planId) appliedPlan.current = true;
      return;
    }
    const urlPlan = searchParams.get("plan");
    const nextPlan = urlPlan ? plans.find((item) => item.id === urlPlan) : undefined;
    if (!nextPlan) return;
    appliedPlan.current = true;
    if (nextPlan.isCustom) {
      setDraft((prev) => ({ ...prev, planId: nextPlan.id, customDurationMonths: 12 }));
      return;
    }
    goEvents({
      planId: nextPlan.id,
      customDurationMonths: nextPlan.durationMonths,
      startDate: draft.startDate || todayIsoDate(),
      confirmed: false,
    });
    // Deep-link a plan from /remember only once while still on step 1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, plans, draft.step, draft.planId]);

  const selectPlan = (planId: string) => {
    const nextPlan = plans.find((item) => item.id === planId);
    if (!nextPlan) return;
    setError("");
    void captureLead({ page: "/account?tab=membership", source: "browse" });
    if (nextPlan.isCustom) {
      syncStep(1, {
        planId,
        customDurationMonths: 12,
        confirmed: false,
      });
      return;
    }
    goEvents({
      planId,
      customDurationMonths: nextPlan.durationMonths,
      startDate: draft.startDate || todayIsoDate(),
      confirmed: false,
    });
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
    syncStep(5, { confirmed: true, paymentMethod: method });
  };

  const changeStartDate = (startDate: string) => {
    const nextEligible = eligibleMembershipEvents({
      startDate,
      durationMonths,
      customEvents: draft.customEvents,
    });
    setDraft((prev) => ({
      ...prev,
      startDate,
      selectedKeys: prev.customized
        ? prev.selectedKeys.filter((key) => nextEligible.some((event) => event.key === key))
        : defaultKeys(nextEligible),
    }));
  };

  const addCustomEvent = () => {
    const title = customTitle.trim();
    if (!title || !customDate) {
      setError("Add a name and date for your custom event.");
      return;
    }
    const [, month, day] = customDate.split("-").map(Number);
    if (!month || !day) return;
    const endIso = membershipTerm?.endIso;
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
    const extraKeys = nextEligible.filter((event) => event.source === "custom").map((event) => event.key);
    setDraft((prev) => ({
      ...prev,
      customEvents: nextCustom,
      customized: true,
      selectedKeys: Array.from(new Set([...prev.selectedKeys, ...extraKeys])),
    }));
    setCustomTitle("");
    setCustomDate("");
  };

  const changePaymentMethod = (next: PaymentMethod) => {
    setMethod(next);
    setPayment(null);
    setError("");
    setDraft((prev) => ({ ...prev, paymentMethod: next }));
  };

  const confirmMembershipPayment = async (body: {
    subscriptionId: string;
    paymentIntentId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) => {
    if (confirmingPay.current) return;
    confirmingPay.current = true;
    try {
      await client.confirm(body);
      sessionStorage.removeItem(DRAFT_KEY);
      onComplete();
    } catch (err) {
      confirmingPay.current = false;
      throw err;
    }
  };

  const openRazorpayCheckout = async (gateway: GatewayPayment) => {
    const orderId = gateway.razorpayOrderId;
    if (!orderId) {
      setError("Razorpay could not be started. Try again or pay with Stripe.");
      return;
    }
    if (isSimulatedGatewayPayment(gateway, "razorpay")) {
      await confirmMembershipPayment({
        subscriptionId: gateway.subscription.id,
        razorpayOrderId: orderId,
      });
      return;
    }
    const key = gateway.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) {
      setError("Razorpay is not configured.");
      return;
    }
    setOpeningGateway(true);
    setError("");
    try {
      const RazorpayCtor = await waitForRazorpay();
      await new Promise<void>((resolve, reject) => {
        const rzp = new RazorpayCtor({
          key,
          amount: Math.round(gateway.subscription.price * 100),
          currency: gateway.subscription.currency,
          name: "BlossomPot",
          description: gateway.subscription.planName,
          order_id: orderId,
          prefill: { email: gateway.subscription.email },
          notes: {
            type: "gifting_subscription",
            subscriptionId: gateway.subscription.id,
            planName: gateway.subscription.planName,
            reminderChannel: gateway.subscription.reminderChannel ?? "email",
          },
          theme: { color: "#C23A6B" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await confirmMembershipPayment({
                subscriptionId: gateway.subscription.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled. You can retry Razorpay when you are ready.")),
          },
        });
        rzp.on("payment.failed", (response) => {
          reject(new Error(response.error?.description ?? "Razorpay payment failed. You can retry."));
        });
        rzp.open();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open Razorpay checkout");
    } finally {
      setOpeningGateway(false);
    }
  };

  const startPayment = async () => {
    if (!plan) return;
    if (payment && paymentMatchesMethod(payment, method)) {
      if (method === "razorpay") await openRazorpayCheckout(payment);
      return;
    }
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
      const gateway: GatewayPayment = {
        subscription: started.subscription,
        clientSecret: started.payment.clientSecret,
        paymentIntentId: started.payment.paymentIntentId,
        razorpayOrderId: started.payment.razorpayOrderId,
        razorpayKeyId: started.payment.razorpayKeyId,
      };

      if (method === "razorpay" && !gateway.razorpayOrderId) {
        setError("Razorpay could not be started. Try again or choose Stripe.");
        return;
      }
      if (method === "stripe" && !gateway.clientSecret && !gateway.paymentIntentId) {
        setError("Stripe could not be started. Try again or choose Razorpay.");
        return;
      }
      if (method === "razorpay" && gateway.clientSecret && !gateway.razorpayOrderId) {
        setError("The selected method is Razorpay, but Stripe was started. Please retry.");
        return;
      }
      if (method === "stripe" && gateway.razorpayOrderId && !gateway.clientSecret) {
        setError("The selected method is Stripe, but Razorpay was started. Please retry.");
        return;
      }

      if (isSimulatedGatewayPayment(gateway, method)) {
        await confirmMembershipPayment({
          subscriptionId: started.subscription.id,
          paymentIntentId: started.payment.paymentIntentId,
          razorpayOrderId: started.payment.razorpayOrderId,
        });
        return;
      }

      setPayment(gateway);
      setDraft((prev) => ({
        ...prev,
        pendingSubscriptionId: started.subscription.id,
        confirmed: true,
        step: 5,
        paymentMethod: method,
      }));
      if (method === "razorpay") {
        await openRazorpayCheckout(gateway);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start membership payment");
    } finally {
      setBusy(false);
    }
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
      {plan && draft.step > 1 && (
        <p className="text-sm text-slate-600 -mt-3">
          {plan.isCustom ? "Custom Plan" : plan.name} · {durationLabel(durationMonths)} · ${price}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {draft.step === 1 && (
        <div className="space-y-5">
          {customizingPlan ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-primary">Custom Plan</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Choose a length from {CUSTOM_PLAN_DURATION_MIN} to {CUSTOM_PLAN_DURATION_MAX} months. Skip to use 1
                    year.
                  </p>
                </div>
                <button type="button" className="text-sm font-semibold text-nav" onClick={() => syncStep(1, { planId: "" })}>
                  Change plan
                </button>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Duration (months)
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
              <p className="text-sm text-slate-600">
                {durationLabel(durationMonths)} · ${price}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => goEvents()} className="min-h-11 rounded-full bg-nav px-5 text-white font-semibold">
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => goEvents({ customDurationMonths: 12, startDate: todayIsoDate() })}
                  className="min-h-11 rounded-full border border-slate-300 px-5 font-semibold"
                >
                  Skip
                </button>
              </div>
            </div>
          ) : (
            <PlanCards plans={plans} busy={busy} selectedPlanId={draft.planId} onSelect={selectPlan} />
          )}
        </div>
      )}

      {draft.step === 2 && membershipTerm && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <p className="text-sm text-slate-600">
              {durationMonths >= 12
                ? "All supported occasions in this membership are available."
                : "Only events that fall in your membership window are shown."}{" "}
              Window: {formatMembershipDate(draft.startDate)} – {formatMembershipDate(membershipTerm.endIso)}.
            </p>
            <label className="block text-sm font-medium text-slate-700 max-w-xs">
              Membership start date
              <input
                type="date"
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={draft.startDate}
                onChange={(e) => changeStartDate(e.target.value)}
              />
            </label>
          </div>
          {plan?.allowsEventCustomization !== false && (
            <button
              type="button"
              onClick={() => {
                setCustomizing(true);
                setDraft((prev) => ({
                  ...prev,
                  customized: true,
                  selectedKeys: prev.selectedKeys.length ? prev.selectedKeys : defaultKeys(eligible),
                }));
              }}
              className="min-h-10 rounded-full border border-slate-300 px-4 text-sm font-semibold"
            >
              Customize Events
            </button>
          )}
          {grouped.map((section) => (
            <div key={section.group}>
              <h3 className="text-sm font-bold text-slate-700 mb-2">{section.label}</h3>
              <ul className="space-y-2">
                {section.events.map((event) => {
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
                                  ? prev.selectedKeys.filter((key) => key !== event.key)
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
                          {event.date
                            ? formatMembershipDate(event.date)
                            : event.needsDate
                              ? "Add a date to include this"
                              : "Saved dates during membership"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
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
                max={membershipTerm.endIso}
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
                  selectedKeys: defaultKeys(eligible),
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
            {([
              { value: "email" as const, hint: "Occasion emails before each selected date." },
              { value: "whatsapp" as const, hint: "WhatsApp when your account is connected. Otherwise we use email." },
              { value: "both" as const, hint: "Email and WhatsApp for the same occasion." },
            ]).map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  draft.reminderChannel === option.value ? "border-primary bg-rose-50" : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="reminder-channel"
                  className="mt-1"
                  checked={draft.reminderChannel === option.value}
                  onChange={() => setDraft((prev) => ({ ...prev, reminderChannel: option.value }))}
                />
                <span>
                  <span className="font-semibold text-slate-800">{reminderChannelLabel(option.value)}</span>
                  <span className="block text-slate-500 mt-0.5">{option.hint}</span>
                </span>
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

      {draft.step === 4 && plan && membershipTerm && (
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
              <span className="text-slate-500">Ends:</span> {formatMembershipDate(membershipTerm.endIso)}
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
          {(searchParams.get("redirect_status") === "failed" || searchParams.get("redirect_status") === "canceled") && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Stripe payment was not completed. You can retry below — your membership is not active until payment is confirmed.
            </p>
          )}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-sm">
            <p className="font-semibold text-slate-900">
              Pay ${price} to activate {plan.isCustom ? "your custom plan" : plan.name}
            </p>
            <p className="text-slate-600">
              Selected method:{" "}
              <span className="font-semibold text-slate-900">{method === "razorpay" ? "Razorpay" : "Stripe"}</span>
              . Card and UPI details stay with the payment provider — we never store them.
            </p>
          </div>
          <PaymentMethodPicker
            value={method}
            onChange={changePaymentMethod}
            checkoutCurrency={plan.currency}
          />
          {method === "razorpay" && (
            <Script
              src="https://checkout.razorpay.com/v1/checkout.js"
              strategy="afterInteractive"
              onLoad={() => setRazorpayReady(true)}
              onError={() =>
                setError("Could not load Razorpay. Disable ad blockers or try another network, then retry.")
              }
            />
          )}
          <p className="text-xs text-slate-500">
            {method === "razorpay"
              ? razorpayReady || openingGateway
                ? "Razorpay checkout will open in a secure popup."
                : "Loading Razorpay checkout…"
              : "Stripe’s card form will appear after you continue."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setPayment(null);
                syncStep(4, { confirmed: false });
              }}
              className="min-h-11 rounded-full border border-slate-300 px-5 font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              disabled={busy || openingGateway || (method === "razorpay" && !razorpayReady && !payment)}
              onClick={() => void startPayment()}
              className="min-h-11 rounded-full bg-nav px-5 text-white font-semibold disabled:opacity-50"
            >
              {busy || openingGateway
                ? method === "razorpay"
                  ? "Opening Razorpay…"
                  : "Starting Stripe…"
                : payment && method === "razorpay"
                  ? "Retry Razorpay"
                  : method === "razorpay"
                    ? "Pay with Razorpay"
                    : payment
                      ? "Continue with Stripe"
                      : "Pay with Stripe"}
            </button>
          </div>
          {payment?.clientSecret && method === "stripe" && (
            <StripePaymentForm
              clientSecret={payment.clientSecret}
              returnUrl={`${typeof globalThis.location !== "undefined" ? globalThis.location.origin : ""}/account?tab=membership&step=5`}
              amountLabel={`$${price}`}
              onError={setError}
            />
          )}
        </div>
      )}
    </div>
  );
}
