"use client";

import {
  CUSTOMER_FULFILLMENT_TIMELINE,
  customerTimelineStepIndex,
} from "@blossompot/shared";

type Props = {
  status: string;
  className?: string;
};

/** Visual progress: Order Placed → … → Delivered (shared source of truth). */
export function OrderFulfillmentTimeline({ status, className = "" }: Props) {
  const current = customerTimelineStepIndex(status);
  if (current < 0) return null;

  return (
    <ol
      className={`flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 ${className}`}
      aria-label="Order progress"
    >
      {CUSTOMER_FULFILLMENT_TIMELINE.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <li key={step.key} className="flex sm:flex-1 items-start sm:flex-col sm:items-center gap-3 sm:gap-2 min-w-0">
            <div className="flex items-center sm:w-full sm:justify-center gap-0">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  active
                    ? "bg-nav text-white ring-2 ring-nav/30"
                    : done
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {i < CUSTOMER_FULFILLMENT_TIMELINE.length - 1 && (
                <span
                  className={`hidden sm:block flex-1 h-0.5 mx-1 ${
                    i < current ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-xs leading-snug sm:text-center ${
                active ? "font-bold text-nav" : done ? "font-medium text-slate-800" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
