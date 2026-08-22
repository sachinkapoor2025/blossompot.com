"use client";

import type { SubscriptionPlan } from "@blossompot/shared";

export function PlanCards({
  plans,
  busy,
  onSelect,
}: {
  plans: SubscriptionPlan[];
  busy?: boolean;
  onSelect?: (planId: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {plans.map((plan) => {
        const popular = Boolean(plan.recommended);
        return (
          <article
            key={plan.id}
            className={`relative rounded-2xl border p-5 ${
              popular ? "border-primary bg-rose-50 shadow-md" : "border-slate-200 bg-white"
            }`}
          >
            {popular && (
              <p className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                Most Popular
              </p>
            )}
            <h3 className="text-lg font-bold text-primary pr-16">{plan.name}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {plan.durationMonths === 12 ? "1 year" : plan.durationMonths === 24 ? "2 years" : `${plan.durationMonths} months`}
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              ${plan.price}
              {plan.compareAtPrice ? (
                <span className="ml-2 text-base font-medium text-slate-400 line-through">${plan.compareAtPrice}</span>
              ) : null}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              {plan.benefits.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
            {onSelect && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onSelect(plan.id)}
                className="mt-5 min-h-11 w-full rounded-full bg-nav text-white font-semibold disabled:opacity-50"
              >
                {popular ? "Start Remembering" : "Choose plan"}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
