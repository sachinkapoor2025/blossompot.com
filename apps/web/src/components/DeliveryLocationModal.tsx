"use client";

import { useEffect, useId, useState } from "react";
import { formatPostalDisplay, isValidPostal } from "@blossompot/shared";
import { useDeliveryLocation } from "@/lib/delivery-location-context";
import {
  deliveryCountryOptions,
  dismissLocationPrompt,
  postalLabelFor,
} from "@/lib/delivery-location";

export function DeliveryLocationModal() {
  const { location, selectorOpen, closeSelector, setLocation } = useDeliveryLocation();
  const titleId = useId();
  const [countryCode, setCountryCode] = useState(location?.countryCode ?? "US");
  const [postalCode, setPostalCode] = useState(location?.postalCode ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const countries = deliveryCountryOptions();
  const postalLabel = postalLabelFor(countryCode);

  useEffect(() => {
    if (!selectorOpen) return;
    setCountryCode(location?.countryCode ?? "US");
    setPostalCode(location?.postalCode ?? "");
    setError("");
  }, [selectorOpen, location]);

  useEffect(() => {
    if (!selectorOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectorOpen]);

  if (!selectorOpen) return null;

  const close = () => {
    dismissLocationPrompt();
    closeSelector();
  };

  const submit = async () => {
    setError("");
    if (!isValidPostal(countryCode, postalCode)) {
      setError(`Enter a valid ${postalLabel.toLowerCase()}`);
      return;
    }
    setBusy(true);
    try {
      await setLocation({
        countryCode,
        postalCode: postalCode.trim(),
        postalDisplay: formatPostalDisplay(countryCode, postalCode),
      });
      closeSelector();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check this location");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close delivery location"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex w-full max-w-md min-h-0 max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        style={{ maxHeight: "calc(100svh - 1.5rem)" }}
      >
        <div className="relative shrink-0 border-b border-slate-100 px-5 pb-3 pt-5 pr-14 sm:px-6">
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <h2 id={titleId} className="text-xl font-bold text-primary pr-2">
            Where should we deliver?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            We use your delivery location to show products available in your area.
          </p>
        </div>
        <form
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4 sm:px-6 sm:py-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-800">
              Country
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="mt-1 w-full max-w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                {countries.map((c) => (
                  <option key={c.countryCode} value={c.countryCode}>
                    {c.countryName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-800">
              {postalLabel}
              <input
                autoComplete="postal-code"
                inputMode={["US", "AU", "AE", "DE", "FR", "IT", "ES"].includes(countryCode) ? "numeric" : "text"}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder={countries.find((c) => c.countryCode === countryCode)?.postalPlaceholder}
                className="mt-1 w-full max-w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg bg-primary text-white font-semibold py-2.5 text-sm disabled:opacity-50"
              >
                {busy ? "Checking…" : "Check availability"}
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                Not now
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
