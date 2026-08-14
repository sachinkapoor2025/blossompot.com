"use client";

import { useEffect, useState } from "react";
import type { ShippingAddress } from "@blossompot/shared";
import { LeadCaptureInput } from "@/components/LeadCaptureInput";
import { PhoneInput, buildPhoneValue } from "@/components/PhoneInput";
import {
  DEFAULT_COUNTRY_ISO,
  orderedCountryDialCodes,
} from "@/lib/country-codes";
import { US_STATES } from "@/lib/shipping-address";

function splitPhone(phone: string): { iso: string; local: string } {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return { iso: DEFAULT_COUNTRY_ISO, local: "" };
  const countries = orderedCountryDialCodes();
  const byDialLen = [...countries].sort(
    (a, b) => b.dial.replace(/\D/g, "").length - a.dial.replace(/\D/g, "").length
  );
  for (const c of byDialLen) {
    const code = c.dial.replace(/\D/g, "");
    if (code && digits.startsWith(code) && digits.length > code.length) {
      return { iso: c.iso, local: digits.slice(code.length) };
    }
  }
  return { iso: DEFAULT_COUNTRY_ISO, local: digits };
}

type Props = {
  value: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
  title?: string;
};

/** Compact recipient-only address (sender fields come from the primary form). */
export function RecipientAddressFields({
  value,
  onChange,
  title = "Delivery address for this Rakhi",
}: Props) {
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY_ISO);
  const [phoneLocal, setPhoneLocal] = useState("");

  useEffect(() => {
    const incoming = value.phone ?? "";
    const current = buildPhoneValue(phoneCountry, phoneLocal);
    if (!incoming && !phoneLocal) return;
    if (incoming === current) return;
    const parts = splitPhone(incoming);
    setPhoneCountry(parts.iso);
    setPhoneLocal(parts.local);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.phone]);

  const update = (field: keyof ShippingAddress, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue, country: "US" });
  };

  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/40 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <LeadCaptureInput
        label="Recipient name"
        value={value.name}
        onChange={(e) => update("name", e.target.value)}
        placeholder="Brother's full name"
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
      <div>
        <PhoneInput
          label="Phone"
          countryIso={phoneCountry}
          localNumber={phoneLocal}
          onCountryChange={(iso) => {
            setPhoneCountry(iso);
            update("phone", buildPhoneValue(iso, phoneLocal));
          }}
          onLocalNumberChange={(local) => {
            setPhoneLocal(local);
            update("phone", buildPhoneValue(phoneCountry, local));
          }}
          required
          compact
          placeholder="Mobile number"
          className="text-sm"
          selectClassName="border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent"
          inputClassName="border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <LeadCaptureInput
        label="Street address"
        value={value.line1}
        onChange={(e) => update("line1", e.target.value)}
        required
        autoComplete="address-line1"
      />
      <LeadCaptureInput
        label="Apt / suite (optional)"
        value={value.line2 ?? ""}
        onChange={(e) => update("line2", e.target.value)}
        autoComplete="address-line2"
      />
      <div className="grid grid-cols-2 gap-3">
        <LeadCaptureInput
          label="City"
          value={value.city}
          onChange={(e) => update("city", e.target.value)}
          required
          autoComplete="address-level2"
        />
        <label className="block text-sm">
          <span className="font-medium text-slate-700">State</span>
          <select
            value={value.state}
            onChange={(e) => update("state", e.target.value)}
            required
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <LeadCaptureInput
        label="ZIP code"
        value={value.postalCode}
        onChange={(e) => update("postalCode", e.target.value)}
        required
        autoComplete="postal-code"
      />
    </div>
  );
}
