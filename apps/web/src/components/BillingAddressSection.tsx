"use client";

import { useState } from "react";
import type { ShippingAddress } from "@blossompot/shared";

export function BillingAddressSection({ recipient }: { recipient: ShippingAddress }) {
  const [sameAsRecipient, setSameAsRecipient] = useState(true);
  const [billing, setBilling] = useState({
    name: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: recipient.country || "US",
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Billing address</h2>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={sameAsRecipient}
          onChange={(e) => setSameAsRecipient(e.target.checked)}
        />
        Billing address is the same as the recipient / shipping address
      </label>
      {sameAsRecipient ? (
        <p className="text-xs text-slate-500">
          We will use {recipient.name || "the recipient"} — {recipient.line1 || "the shipping street"} for the
          payment billing address.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Billing name"
            value={billing.name}
            onChange={(e) => setBilling({ ...billing, name: e.target.value })}
            required
          />
          <input
            className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Street address"
            value={billing.line1}
            onChange={(e) => setBilling({ ...billing, line1: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="City"
            value={billing.city}
            onChange={(e) => setBilling({ ...billing, city: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="State"
            value={billing.state}
            onChange={(e) => setBilling({ ...billing, state: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="ZIP / postal code"
            value={billing.postalCode}
            onChange={(e) => setBilling({ ...billing, postalCode: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase"
            placeholder="Country (US)"
            maxLength={2}
            value={billing.country}
            onChange={(e) => setBilling({ ...billing, country: e.target.value.toUpperCase() })}
            required
          />
        </div>
      )}
    </section>
  );
}
