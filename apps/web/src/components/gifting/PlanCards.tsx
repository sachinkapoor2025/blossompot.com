"use client";

import { useState } from "react";
import {
  durationLabel,
  type SubscriptionPlan,
} from "@blossompot/shared";

function planLength(plan: SubscriptionPlan) {
  if (plan.isCustom) return "Choose your length";
  return durationLabel(plan.durationMonths);
}

export function PlanCards({
  plans,
  busy,
  selectedPlanId,
  onSelect,
  teaser,
}: {
  plans: SubscriptionPlan[];
  busy?: boolean;
  selectedPlanId?: string;
  onSelect?: (planId: string) => void;
  teaser?: boolean;
}) {
  const [benefitsPlan, setBenefitsPlan] = useState<SubscriptionPlan | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const popular = Boolean(plan.recommended);
          const selected = selectedPlanId === plan.id;
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-5 ${
                selected
                  ? "border-primary bg-rose-50 shadow-md ring-1 ring-primary/20"
                  : popular
                    ? "border-primary/40 bg-white shadow-sm"
                    : "border-slate-200 bg-white"
              }`}
            >
              {popular && (
                <p className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                  Most Popular
                </p>
              )}
              <h3 className="text-lg font-bold text-primary pr-4">{plan.isCustom ? "Custom Plan" : plan.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{planLength(plan)}</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {plan.isCustom ? (
                  <span className="text-xl">Priced to your length</span>
                ) : (
                  <>
                    ${plan.price}
                    {plan.compareAtPrice ? (
                      <span className="ml-2 text-base font-medium text-slate-400 line-through">
                        ${plan.compareAtPrice}
                      </span>
                    ) : null}
                  </>
                )}
              </p>
              <p className="mt-3 text-sm text-slate-600 line-clamp-2">{plan.benefits[0]}</p>
              <div className="mt-auto pt-5 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setBenefitsPlan(plan)}
                  className="min-h-11 w-full rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-800"
                >
                  View Benefits
                </button>
                {onSelect && !teaser && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSelect(plan.id)}
                    className="min-h-11 w-full rounded-full bg-nav text-white font-semibold disabled:opacity-50"
                  >
                    {selected ? "Selected" : "Select Plan"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {benefitsPlan && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-benefits-title"
          onClick={() => setBenefitsPlan(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="plan-benefits-title" className="text-xl font-bold text-primary">
              {benefitsPlan.isCustom ? "Custom Plan" : benefitsPlan.name}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{planLength(benefitsPlan)}</p>
            {!benefitsPlan.isCustom && (
              <p className="mt-3 text-2xl font-bold text-slate-900">${benefitsPlan.price}</p>
            )}
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {benefitsPlan.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              {onSelect && !teaser && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    onSelect(benefitsPlan.id);
                    setBenefitsPlan(null);
                  }}
                  className="min-h-11 flex-1 rounded-full bg-nav text-white font-semibold disabled:opacity-50"
                >
                  Select Plan
                </button>
              )}
              <button
                type="button"
                onClick={() => setBenefitsPlan(null)}
                className="min-h-11 flex-1 rounded-full border border-slate-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
