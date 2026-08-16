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
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
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
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-xl p-5 sm:p-6"
      >
        <h2 id={titleId} className="text-xl font-bold text-primary">
          Where should we deliver?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          We use your delivery location to show products available in your area.
        </p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="block text-sm font-medium text-slate-800">
            Country
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
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
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
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
        </form>
      </div>
    </div>
  );
}
