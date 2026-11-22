"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  SCHEDULE_DELIVERY_HORIZON_DAYS,
  isScheduleDeliveryClosedDay,
  isValidScheduleDeliveryDate,
  scheduleDeliveryMaxDate,
} from "@blossompot/shared";
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

/** Customer-selectable delivery date. Saturday and Sunday stay closed. */
export function ScheduleDeliveryPicker({
  className = "",
  compact = false,
  productNoun = "gift",
}: {
  className?: string;
  compact?: boolean;
  /** Dynamic noun from product category, e.g. flowers / cake / gift */
  productNoun?: string;
}) {
  const { min, max } = preferredDeliveryDateBounds();
  const through = lastOpenDate(min, max);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => monthKey(min));
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();

  useEffect(() => {
    const stored = loadPreferredDeliveryDate();
    setValue(stored);
    if (stored) setViewMonth(monthKey(stored));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onChange = (next: string) => {
    if (next && !isValidScheduleDeliveryDate(next)) return;
    setValue(next);
    savePreferredDeliveryDate(next);
    if (next) setOpen(false);
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
      <div ref={rootRef} className="relative max-w-xs">
        <button
          id={fieldId}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-nav"
        >
          <span className={value ? "" : "text-slate-400"}>{value ? formatField(value) : "dd-mm-yyyy"}</span>
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </button>
        {open && (
          <div
            role="dialog"
            aria-label="Choose a delivery date"
            className="absolute z-40 mt-1 w-[17.5rem] rounded-md border border-slate-200 bg-white p-3 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                disabled={!canPrev}
                onClick={() => canPrev && setViewMonth(shiftDays(`${viewMonth}-01`, -1).slice(0, 7))}
                className="rounded px-2 py-1 text-sm text-slate-600 enabled:hover:bg-slate-100 disabled:text-slate-300"
              >
                ‹
              </button>
              <p className="text-sm font-semibold text-slate-800">
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
                className="rounded px-2 py-1 text-sm text-slate-600 enabled:hover:bg-slate-100 disabled:text-slate-300"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {WEEKDAYS.map((label, index) => (
                <span
                  key={label}
                  className={index === 0 || index === 6 ? "py-1 font-medium text-slate-300" : "py-1 font-medium text-slate-500"}
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
                    className={`h-8 rounded-full text-sm ${
                      selected
                        ? "bg-primary font-semibold text-white"
                        : disabled
                          ? "cursor-not-allowed text-slate-300"
                          : "text-slate-800 hover:bg-slate-100"
                    } ${cell.inMonth ? "" : "invisible"}`}
                  >
                    {Number(cell.ymd.slice(8, 10))}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">Saturday and Sunday are unavailable.</p>
            <button
              type="button"
              onClick={() => onChange("")}
              className="mt-1 text-xs font-semibold text-nav underline underline-offset-2"
            >
              Clear
            </button>
          </div>
        )}
      </div>
      {value ? (
        <p className="text-xs text-green-700 mt-2 font-medium">
          Preferred delivery: {formatLong(value)}
        </p>
      ) : (
        <p className="text-xs text-slate-500 mt-2">Optional — you can also set this at checkout.</p>
      )}
    </div>
  );
}
