"use client";

import type { ShippingAddress } from "@blossompot/shared";
import { LeadCaptureInput } from "@/components/LeadCaptureInput";
import {
  postalFieldLabel,
  postalInputMode,
  postalPlaceholder,
  regionFieldLabel,
  regionOptionsForCountry,
} from "@/lib/checkout-regions";

export function CountryRegionFields({
  countryIso,
  value,
  onChange,
}: {
  countryIso: string;
  value: ShippingAddress;
  onChange: (next: Pick<ShippingAddress, "state" | "postalCode">) => void;
}) {
  const regions = regionOptionsForCountry(countryIso);
  const regionLabel = regionFieldLabel(countryIso);
  const zipLabel = postalFieldLabel(countryIso);

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{regionLabel}</label>
        {regions ? (
          <select
            value={value.state}
            onChange={(e) => onChange({ state: e.target.value, postalCode: value.postalCode })}
            required
            autoComplete="address-level1"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent bg-white"
          >
            <option value="">Select {regionLabel.toLowerCase()}</option>
            {regions.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={value.state}
            onChange={(e) => onChange({ state: e.target.value, postalCode: value.postalCode })}
            required
            autoComplete="address-level1"
            placeholder={regionLabel}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        )}
      </div>
      <LeadCaptureInput
        label={zipLabel}
        value={value.postalCode}
        onChange={(e) => onChange({ state: value.state, postalCode: e.target.value })}
        required
        autoComplete="postal-code"
        inputMode={postalInputMode(countryIso)}
        placeholder={postalPlaceholder(countryIso)}
      />
    </div>
  );
}
