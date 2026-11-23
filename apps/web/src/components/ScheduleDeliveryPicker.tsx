"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  SCHEDULE_DELIVERY_HORIZON_DAYS,
  calendarDaysUntilDelivery,
  deliveryDateShippingLabel,
  deliveryDateShippingTier,
  isScheduleDeliveryClosedDay,
  isValidScheduleDeliveryDate,
  quoteCartDeliveryDateShipping,
  scheduleDeliveryMaxDate,
  type DeliveryDateShippingTier,
} from "@blossompot/shared";
import { useCurrency } from "@/lib/currency-context";
import {
  loadPreferredDeliveryDate,
  preferredDeliveryDateBounds,
  savePreferredDeliveryDate,
} from "@/lib/preferred-delivery";

function parseUtc(dateYmd: string): Date {
  const [y, m, d] = dateYmd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

function formatLong(dateYmd: string): string {
  return parseUtc(dateYmd).toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatField(dateYmd: string): string {
  const [y, m, d] = dateYmd.split("-");
  return `${d}-${m}-${y}`;
}

function shiftDays(dateYmd: string, days: number): string {
  const next = parseUtc(dateYmd);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function monthKey(dateYmd: string): string {
  return dateYmd.slice(0, 7);
}

function lastOpenDate(min: string, max: string): string {
  let cursor = max;
  while (cursor >= min && isScheduleDeliveryClosedDay(cursor)) {
    cursor = shiftDays(cursor, -1);
  }
  return cursor;
}

function monthCells(viewMonth: string): { ymd: string; inMonth: boolean }[] {
  const [y, m] = viewMonth.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(y!, m! - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  const cells: { ymd: string; inMonth: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ ymd: shiftDays(`${viewMonth}-01`, i - firstWeekday), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      ymd: `${viewMonth}-${String(day).padStart(2, "0")}`,
      inMonth: true,
    });
  }
  while (cells.length % 7 !== 0) {
    const previous = cells[cells.length - 1]!.ymd;
    cells.push({ ymd: shiftDays(previous, 1), inMonth: false });
  }
  return cells;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const METHOD_ORDER: DeliveryDateShippingTier[] = [
  "same_day",
  "next_day",
  "within_3_days",
  "within_5_days",
];

function formatEarliest(dateYmd: string): string {
  const day = Number(dateYmd.slice(8, 10));
  const teen = day % 100;
  const suffix =
    teen >= 11 && teen <= 13
      ? "th"
      : day % 10 === 1
        ? "st"
        : day % 10 === 2
          ? "nd"
          : day % 10 === 3
            ? "rd"
            : "th";
  const month = parseUtc(dateYmd).toLocaleDateString(undefined, {
    month: "short",
    timeZone: "UTC",
  });
  return `${day}${suffix} ${month}`;
}

function deliveryMethods(min: string, max: string): Array<{ tier: DeliveryDateShippingTier; earliest: string }> {
  const found = new Map<DeliveryDateShippingTier, string>();
  let cursor = min;
  while (cursor <= max) {
    if (!isScheduleDeliveryClosedDay(cursor) && isValidScheduleDeliveryDate(cursor)) {
      const tier = deliveryDateShippingTier(calendarDaysUntilDelivery(cursor));
      if (!found.has(tier)) found.set(tier, cursor);
    }
    cursor = shiftDays(cursor, 1);
  }
  return METHOD_ORDER.filter((tier) => found.has(tier)).map((tier) => ({
    tier,
    earliest: found.get(tier)!,
  }));
}

/** Customer-selectable delivery date. Saturday and Sunday stay closed. */
export function ScheduleDeliveryPicker({
  className = "",
  compact = false,
  productNoun = "gift",
  onDateChange,
}: {
  className?: string;
  compact?: boolean;
  /** Dynamic noun from product category, e.g. flowers / cake / gift */
  productNoun?: string;
  /** Fired when the stored or newly chosen date changes. Empty when cleared. */
  onDateChange?: (dateYmd: string) => void;
}) {
  const { min, max } = preferredDeliveryDateBounds();
  const through = lastOpenDate(min, max);
  const { formatDisplay, displayCurrency, usdInrRate } = useCurrency();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => monthKey(min));
  const fieldId = useId();
  const titleId = useId();
  const methods = deliveryMethods(min, max);
  const selectedTier =
    value && isValidScheduleDeliveryDate(value)
      ? deliveryDateShippingTier(calendarDaysUntilDelivery(value))
      : null;

  const chargeFor = (dateYmd: string) => {
    const quote = quoteCartDeliveryDateShipping({
      items: [{ quantity: 1 }],
      deliveryDate: dateYmd,
      currency: displayCurrency,
      usdInrRate,
    });
    return quote.totalCharge <= 0 ? "Free" : formatDisplay(quote.totalCharge);
  };

  useEffect(() => {
    const stored = loadPreferredDeliveryDate();
    setValue(stored);
    if (stored) setViewMonth(monthKey(stored));
    onDateChange?.(stored);
  }, [onDateChange]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onChange = (next: string) => {
    if (next && !isValidScheduleDeliveryDate(next)) return;
    setValue(next);
    savePreferredDeliveryDate(next);
    onDateChange?.(next);
    if (next) setViewMonth(monthKey(next));
  };

  const minMonth = monthKey(min);
  const maxMonth = monthKey(max);
  const canPrev = viewMonth > minMonth;
  const canNext = viewMonth < maxMonth;

  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 ${className}`}>
      <label htmlFor={fieldId} className="block text-sm font-semibold text-primary mb-1">
        Schedule delivery
      </label>
      {!compact && (
        <p className="text-xs text-slate-600 mb-2">
          Choose when you want your {productNoun} delivered. Saturday and Sunday are unavailable.
          You can pick any weekday in the next {SCHEDULE_DELIVERY_HORIZON_DAYS} days (through{" "}
          <strong>{formatLong(through || scheduleDeliveryMaxDate())}</strong>).
        </p>
      )}
      <div className="relative max-w-xs">
        <button
          id={fieldId}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-nav"
        >
          <span className={value ? "" : "text-slate-400"}>{value ? formatField(value) : "dd-mm-yyyy"}</span>
          <svg className="h-5 w-5 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </button>
        {open &&
          createPortal(
            <div className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-6">
              <button
                type="button"
                aria-label="Close delivery options"
                className="absolute inset-0 bg-slate-900/45"
                onClick={() => setOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              >
                <div className="relative border-b border-slate-100 px-4 py-4">
                  <h2 id={titleId} className="text-center text-base font-semibold text-slate-900 sm:text-lg">
                    Select Delivery Method & Date
                  </h2>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    <span aria-hidden className="text-lg leading-none">×</span>
                  </button>
                </div>
                <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
                  <div className="space-y-1 overflow-y-auto p-4 sm:p-5">
                    {methods.map((method) => {
                      const selected = method.tier === selectedTier;
                      return (
                        <button
                          key={method.tier}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => onChange(method.earliest)}
                          className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left ${
                            selected ? "bg-[#f3f6e8]" : "hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              selected ? "border-[#3d8f4a] bg-[#3d8f4a]" : "border-slate-300 bg-white"
                            }`}
                            aria-hidden
                          >
                            {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                              <span className="font-semibold text-slate-900">
                                {deliveryDateShippingLabel(method.tier)}
                              </span>
                              <span className="shrink-0 font-semibold text-slate-900">{chargeFor(method.earliest)}</span>
                            </span>
                            <span className="mt-0.5 block text-sm text-slate-500">
                              Earliest Delivery {formatEarliest(method.earliest)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 bg-[#f7f6f2] p-4 sm:p-6 md:overflow-y-auto md:border-l md:border-t-0">
                    <div className="mx-auto w-full max-w-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <button
                          type="button"
                          aria-label="Previous month"
                          disabled={!canPrev}
                          onClick={() => canPrev && setViewMonth(shiftDays(`${viewMonth}-01`, -1).slice(0, 7))}
                          className="rounded px-2 py-1 text-lg text-slate-600 enabled:hover:bg-white disabled:text-slate-300"
                        >
                          ‹
                        </button>
                        <p className="text-base font-semibold text-slate-900">
                          {parseUtc(`${viewMonth}-01`).toLocaleDateString(undefined, {
                            month: "long",
                            year: "numeric",
                            timeZone: "UTC",
                          })}
                        </p>
                        <button
                          type="button"
                          aria-label="Next month"
                          disabled={!canNext}
                          onClick={() => canNext && setViewMonth(shiftDays(`${viewMonth}-01`, 32).slice(0, 7))}
                          className="rounded px-2 py-1 text-lg text-slate-600 enabled:hover:bg-white disabled:text-slate-300"
                        >
                          ›
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {WEEKDAYS.map((label, index) => (
                          <span
                            key={label}
                            className={
                              index === 0 || index === 6
                                ? "py-1 font-medium text-slate-300"
                                : "py-1 font-medium text-slate-500"
                            }
                          >
                            {label}
                          </span>
                        ))}
                        {monthCells(viewMonth).map((cell) => {
                          const closed = isScheduleDeliveryClosedDay(cell.ymd);
                          const outOfRange = cell.ymd < min || cell.ymd > max;
                          const disabled = !cell.inMonth || closed || outOfRange;
                          const selected = cell.ymd === value;
                          const reason = closed
                            ? "No delivery on Saturday or Sunday"
                            : outOfRange
                              ? "Outside the delivery window"
                              : undefined;
                          return (
                            <button
                              key={cell.ymd}
                              type="button"
                              disabled={disabled}
                              title={reason}
                              aria-label={reason ? `${formatLong(cell.ymd)}. ${reason}` : formatLong(cell.ymd)}
                              onClick={() => onChange(cell.ymd)}
                              className={`h-9 rounded-full text-sm ${
                                selected
                                  ? "bg-primary font-semibold text-white"
                                  : disabled
                                    ? "cursor-not-allowed text-slate-300"
                                    : "text-slate-800 hover:bg-white"
                              } ${cell.inMonth ? "" : "invisible"}`}
                            >
                              {Number(cell.ymd.slice(8, 10))}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-center text-xs text-slate-500">Saturday and Sunday are unavailable.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
      {value ? (
        <p className="text-xs text-green-700 mt-2 font-medium">
          Preferred delivery: {formatLong(value)}
          {selectedTier && selectedTier !== "later"
            ? ` · ${deliveryDateShippingLabel(selectedTier)} · ${chargeFor(value)}`
            : selectedTier === "later"
              ? ` · ${chargeFor(value)}`
              : ""}
        </p>
      ) : (
        <p className="text-xs text-slate-500 mt-2">Optional — you can also set this at checkout.</p>
      )}
    </div>
  );
}
