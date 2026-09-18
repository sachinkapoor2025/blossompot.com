"use client";

import type { ShippingAddress } from "@blossompot/shared";
import { LeadCaptureInput } from "@/components/LeadCaptureInput";
import { CountryRegionFields } from "@/components/CountryRegionFields";
import { regionOptionsForCountry } from "@/lib/checkout-regions";
import { useGboDeliveryCountries } from "@/lib/gbo-delivery-countries";

export function AddressFormFields({
  value,
  onChange,
}: {
  value: ShippingAddress;
  onChange: (value: ShippingAddress) => void;
}) {
  const { countries } = useGboDeliveryCountries();
  const update = (field: keyof ShippingAddress, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };
  const changeCountry = (iso: string) => {
    const next = iso.trim().toUpperCase();
    const regions = regionOptionsForCountry(next);
    const nextState = regions?.some((r) => r.code === value.state) ? value.state : "";
    onChange({ ...value, country: next, state: nextState });
  };

  return (
    <div className="space-y-4">
      <LeadCaptureInput
        label="Recipient name"
        value={value.name}
        onChange={(e) => update("name", e.target.value)}
        required
        autoComplete="name"
      />
      <LeadCaptureInput
        label="Email"
        type="email"
        value={value.email}
        onChange={(e) => update("email", e.target.value)}
        required
        autoComplete="email"
      />
      <LeadCaptureInput
        label="Phone (optional)"
        type="tel"
        value={value.phone ?? ""}
        onChange={(e) => update("phone", e.target.value)}
        autoComplete="tel"
      />
      <LeadCaptureInput
        label="Street address"
        value={value.line1}
        onChange={(e) => update("line1", e.target.value)}
        required
        autoComplete="address-line1"
      />
      <LeadCaptureInput
        label="Apartment, suite, etc. (optional)"
        value={value.line2 ?? ""}
        onChange={(e) => update("line2", e.target.value)}
        autoComplete="address-line2"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <LeadCaptureInput
          label="City"
          value={value.city}
          onChange={(e) => update("city", e.target.value)}
          required
          autoComplete="address-level2"
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
          <select
            value={value.country}
            onChange={(e) => changeCountry(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent bg-white"
          >
            {countries.map((c) => (
              <option key={c.countryCode} value={c.countryCode}>
                {c.countryName}
              </option>
            ))}
          </select>
        </div>
      </div>
      <CountryRegionFields
        countryIso={value.country}
        value={value}
        onChange={({ state, postalCode }) => onChange({ ...value, state, postalCode })}
      />
    </div>
  );
}
