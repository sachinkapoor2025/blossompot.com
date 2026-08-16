"use client";

import { useEffect, useState } from "react";
import type { ShippingAddress } from "@blossompot/shared";
import { LeadCaptureInput } from "@/components/LeadCaptureInput";
import { PhoneInput, buildPhoneValue } from "@/components/PhoneInput";
import {
  DEFAULT_COUNTRY_ISO,
  orderedCountryDialCodes,
} from "@/lib/country-codes";
import {
  US_STATES,
  emptyShippingAddress,
  loadSavedAddresses,
  saveShippingAddress,
  deleteSavedAddress,
  formatAddressLine,
  type SavedShippingAddress,
} from "@/lib/shipping-address";

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

interface Props {
  value: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
  onFieldLeadCapture?: (field: string, value: string) => void;
  saveForLater: boolean;
  onSaveForLaterChange: (checked: boolean) => void;
}

export function ShippingAddressForm({
  value,
  onChange,
  onFieldLeadCapture,
  saveForLater,
  onSaveForLaterChange,
}: Props) {
  const [saved, setSaved] = useState<SavedShippingAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY_ISO);
  const [phoneLocal, setPhoneLocal] = useState("");

  useEffect(() => {
    const addresses = loadSavedAddresses();
    setSaved(addresses);
  }, []);

  // Resync country/local boxes when phone is set from a saved address / prefills.
  useEffect(() => {
    const incoming = value.phone ?? "";
    const current = buildPhoneValue(phoneCountry, phoneLocal);
    if (!incoming && !phoneLocal) {
      if (phoneCountry !== DEFAULT_COUNTRY_ISO) setPhoneCountry(DEFAULT_COUNTRY_ISO);
      return;
    }
    if (incoming === current) return;
    const parts = splitPhone(incoming);
    setPhoneCountry(parts.iso);
    setPhoneLocal(parts.local);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to external phone changes
  }, [value.phone]);

  useEffect(() => {
    if (!saved.length || !value.line1) return;
    const match = saved.find(
      (a) =>
        a.line1 === value.line1 &&
        a.city === value.city &&
        a.postalCode === value.postalCode &&
        a.name === value.name
    );
    if (match) setSelectedId(match.id);
  }, [saved, value.line1, value.city, value.postalCode, value.name]);

  const update = (field: keyof ShippingAddress, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
    if (onFieldLeadCapture && (field === "name" || field === "email" || field === "phone")) {
      onFieldLeadCapture(field, fieldValue);
    }
  };

  const useSaved = (address: SavedShippingAddress) => {
    setSelectedId(address.id);
    onChange({
      name: address.name,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: "US",
      phone: address.phone,
      email: address.email,
      // Keep sister/sender details across address picks
      senderName: value.senderName || address.senderName,
      senderMessage: value.senderMessage || address.senderMessage,
    });
  };

  const startNewAddress = () => {
    setSelectedId(null);
    onChange({
      ...emptyShippingAddress(),
      email: value.email,
      phone: value.phone,
      senderName: value.senderName,
      senderMessage: value.senderMessage,
    });
  };

  const handleDeleteSaved = (id: string) => {
    deleteSavedAddress(id);
    const next = loadSavedAddresses();
    setSaved(next);
    if (selectedId === id) {
      setSelectedId(null);
      onChange(emptyShippingAddress());
    }
  };

  const handleSaveCurrent = () => {
    const entry = saveShippingAddress(value);
    setSaved(loadSavedAddresses());
    setSelectedId(entry.id);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Shipping Address</h2>
        <p className="text-sm text-slate-600 mt-1">
          Enter the US delivery address for your brother or recipient. We ship domestically within all 50 states.
        </p>
      </div>

      {saved.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700">Saved addresses</p>
            <button
              type="button"
              onClick={startNewAddress}
              className="text-sm text-nav font-medium hover:underline"
            >
              + Add new
            </button>
          </div>
          <ul className="space-y-2">
            {saved.map((address) => {
              const active = selectedId === address.id;
              return (
                <li
                  key={address.id}
                  className={`rounded-lg border p-3 text-sm transition ${
                    active ? "border-nav bg-violet-50/50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => useSaved(address)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="font-semibold text-slate-900">{address.label}</p>
                      <p className="text-slate-600 truncate">{address.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{formatAddressLine(address)}</p>
                    </button>
                    <div className="flex shrink-0 gap-2">
                      {!active && (
                        <button
                          type="button"
                          onClick={() => useSaved(address)}
                          className="text-xs text-nav font-medium hover:underline"
                        >
                          Use
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(address.id)}
                        className="text-xs text-red-500 hover:underline"
                        aria-label={`Delete ${address.label}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="space-y-4 pt-1">
        {saved.length > 0 && selectedId === null && value.line1 && (
          <p className="text-sm font-medium text-slate-700">Delivery address</p>
        )}
        {saved.length > 0 && selectedId === null && !value.line1 && (
          <p className="text-sm text-slate-500">Select a saved address or enter a new one below.</p>
        )}

        <LeadCaptureInput
            label="Sender name (your name)"
            value={value.senderName ?? ""}
            onChange={(e) => update("senderName", e.target.value)}
            placeholder="So the recipient knows who sent this gift"
            required
            autoComplete="nickname"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message for your brother
            </label>
            <textarea
              value={value.senderMessage ?? ""}
              onChange={(e) => update("senderMessage", e.target.value)}
              required
              rows={4}
              maxLength={500}
              placeholder="Write a personal note — it will appear on the shipping label"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm leading-relaxed"
            />
            <p className="text-xs text-slate-500 mt-1">
              Printed on the shipping label · {(value.senderMessage ?? "").length}/500
            </p>
          </div>
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
            <p className="text-xs text-slate-500 mt-1">
              United States (+1) is selected by default. Country code is for contact; coupons match
              the mobile number.
            </p>
          </div>
          <LeadCaptureInput
            label="Street address"
            value={value.line1}
            onChange={(e) => update("line1", e.target.value)}
            placeholder="House number and street"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <select
                value={value.state}
                onChange={(e) => update("state", e.target.value)}
                required
                autoComplete="address-level1"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent bg-white"
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <LeadCaptureInput
              label="ZIP code"
              value={value.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
              required
              autoComplete="postal-code"
              inputMode="numeric"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
              <select
                value="US"
                disabled
                aria-label="Country"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-600 cursor-not-allowed"
              >
                <option value="US">United States</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={saveForLater}
                onChange={(e) => onSaveForLaterChange(e.target.checked)}
                className="rounded border-slate-300 text-nav focus:ring-accent"
              />
              Save this address for future orders
            </label>
            <button
              type="button"
              onClick={handleSaveCurrent}
              className="text-sm text-nav font-medium hover:underline"
            >
              Save now
            </button>
          </div>
        </div>
    </section>
  );
}
