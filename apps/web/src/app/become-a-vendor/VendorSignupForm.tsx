"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { CURRENT_VENDOR_AGREEMENT_VERSION } from "@blossompot/shared";

const BUSINESS_TYPES = [
  { value: "florist", label: "Florist" },
  { value: "cake_shop", label: "Cake shop" },
  { value: "bakery", label: "Bakery" },
  { value: "gift_shop", label: "Gift shop" },
  { value: "chocolates", label: "Chocolates" },
  { value: "balloon_decor", label: "Balloon / decor" },
  { value: "personalized_gifts", label: "Personalized gifts" },
  { value: "other", label: "Other" },
] as const;

const CATEGORY_OPTIONS = [
  "flowers",
  "cakes",
  "chocolates",
  "gifts",
  "balloons",
  "plants",
  "personalized gifts",
  "hampers",
  "wedding",
  "anniversary",
  "birthday",
  "festival",
];

type FieldProps = {
  label: string;
  children: React.ReactNode;
  hint?: string;
};

function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function VendorSignupForm() {
  const [agreement, setAgreement] = useState<{ version: string; summary: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ vendorId: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(["flowers"]);
  const [sameDay, setSameDay] = useState(false);
  const [accept, setAccept] = useState(false);

  useEffect(() => {
    api<{ version: string; summary: string[] }>("/marketplace/vendor-agreement")
      .then((r) => setAgreement(r))
      .catch(() =>
        setAgreement({
          version: CURRENT_VENDOR_AGREEMENT_VERSION,
          summary: [
            "BlossomPot acquires customers and processes payments.",
            "You fulfill approved orders.",
            "Partner pricing helps us promote your products.",
          ],
        })
      );
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!accept) {
      setError("Please accept the vendor partnership agreement.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const deliveryZips = String(fd.get("deliveryZips") ?? "")
      .split(/[\s,]+/)
      .map((z) => z.trim())
      .filter(Boolean);

    const payload = {
      businessName: String(fd.get("businessName") ?? "").trim(),
      contactName: String(fd.get("contactName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      addressLine1: String(fd.get("addressLine1") ?? "").trim(),
      addressLine2: String(fd.get("addressLine2") ?? "").trim() || undefined,
      city: String(fd.get("city") ?? "").trim(),
      state: String(fd.get("state") ?? "").trim(),
      zip: String(fd.get("zip") ?? "").trim(),
      website: String(fd.get("website") ?? "").trim() || "",
      instagram: String(fd.get("instagram") ?? "").trim() || undefined,
      facebook: String(fd.get("facebook") ?? "").trim() || undefined,
      businessType: String(fd.get("businessType") ?? "other"),
      productCategories: categories,
      deliveryZips,
      sameDayAvailable: sameDay,
      businessHours: String(fd.get("businessHours") ?? "").trim() || undefined,
      yearsInBusiness: fd.get("yearsInBusiness")
        ? Number(fd.get("yearsInBusiness"))
        : undefined,
      taxId: String(fd.get("taxId") ?? "").trim() || undefined,
      paymentNotes: String(fd.get("paymentNotes") ?? "").trim() || undefined,
      minimumOrderValue: fd.get("minimumOrderValue")
        ? Number(fd.get("minimumOrderValue"))
        : undefined,
      deliveryFee: fd.get("deliveryFee") ? Number(fd.get("deliveryFee")) : undefined,
      leadTimeHours: fd.get("leadTimeHours") ? Number(fd.get("leadTimeHours")) : undefined,
      notes: String(fd.get("notes") ?? "").trim() || undefined,
      acceptAgreement: true as const,
      agreementVersion: agreement?.version ?? CURRENT_VENDOR_AGREEMENT_VERSION,
    };

    setSubmitting(true);
    try {
      const res = await api<{ vendorId: string; message: string }>("/marketplace/vendors/apply", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setDone(res);
      e.currentTarget.reset();
      setAccept(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-slate-800">
        <h3 className="font-display text-2xl font-semibold text-primary mb-2">Application received</h3>
        <p className="text-sm leading-relaxed">{done.message}</p>
        <p className="text-xs text-slate-500 mt-3">Reference: {done.vendorId}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" id="vendor-apply">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Business name">
          <input name="businessName" required className={inputClass} />
        </Field>
        <Field label="Owner / contact name">
          <input name="contactName" required className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Phone">
          <input name="phone" type="tel" required className={inputClass} />
        </Field>
        <Field label="Business address">
          <input name="addressLine1" required className={inputClass} />
        </Field>
        <Field label="Address line 2">
          <input name="addressLine2" className={inputClass} />
        </Field>
        <Field label="City">
          <input name="city" required className={inputClass} />
        </Field>
        <Field label="State">
          <input name="state" required className={inputClass} placeholder="CA" />
        </Field>
        <Field label="ZIP">
          <input name="zip" required className={inputClass} />
        </Field>
        <Field label="Business website">
          <input name="website" type="url" placeholder="https://" className={inputClass} />
        </Field>
        <Field label="Instagram">
          <input name="instagram" className={inputClass} placeholder="@yourshop" />
        </Field>
        <Field label="Facebook">
          <input name="facebook" className={inputClass} />
        </Field>
        <Field label="Business type">
          <select name="businessType" required className={inputClass} defaultValue="florist">
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Years in business">
          <input name="yearsInBusiness" type="number" min={0} className={inputClass} />
        </Field>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-800 mb-2">Product categories</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((c) => {
            const on = categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setCategories((prev) =>
                    on ? prev.filter((x) => x !== c) : [...prev, c]
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  on
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Delivery ZIP codes"
          hint="Comma or space separated. Customers in these ZIPs can receive your products."
        >
          <textarea name="deliveryZips" rows={3} className={inputClass} placeholder="92602, 92618, 92705" />
        </Field>
        <Field label="Business hours">
          <textarea name="businessHours" rows={3} className={inputClass} placeholder="Mon–Sat 9am–6pm" />
        </Field>
        <Field label="Minimum order value (USD)">
          <input name="minimumOrderValue" type="number" min={0} step="0.01" className={inputClass} />
        </Field>
        <Field label="Delivery fee (USD)">
          <input name="deliveryFee" type="number" min={0} step="0.01" className={inputClass} />
        </Field>
        <Field label="Typical lead time (hours)">
          <input name="leadTimeHours" type="number" min={0} className={inputClass} />
        </Field>
        <Field label="Tax / business ID">
          <input name="taxId" className={inputClass} />
        </Field>
        <Field label="Payment information" hint="How you prefer to receive payouts (ACH, PayPal, etc.).">
          <input name="paymentNotes" className={inputClass} />
        </Field>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={sameDay}
              onChange={(e) => setSameDay(e.target.checked)}
              className="rounded border-slate-300"
            />
            Same-day delivery available
          </label>
        </div>
      </div>

      <Field label="Notes for our partnerships team">
        <textarea name="notes" rows={3} className={inputClass} />
      </Field>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <h3 className="font-semibold text-primary">Vendor partnership agreement</h3>
        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
          {(agreement?.summary ?? []).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-xs text-slate-500">Version: {agreement?.version ?? CURRENT_VENDOR_AGREEMENT_VERSION}</p>
        <label className="flex items-start gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-1 rounded border-slate-300"
          />
          I accept the BlossomPot vendor terms, commission structure, fulfillment and payout policies.
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Become a BlossomPot Vendor"}
      </button>
    </form>
  );
}
