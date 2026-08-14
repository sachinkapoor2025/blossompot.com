"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { useSessionId } from "@/lib/session";

export function CorporateQuoteForm() {
  const sessionId = useSessionId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const composed = [
        `Corporate gifting inquiry`,
        company ? `Company: ${company}` : null,
        quantity ? `Approximate quantity: ${quantity}` : null,
        message,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone.trim() || undefined,
          message: composed,
          sessionId: sessionId ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not send inquiry");
      }
      setSent(true);
      setName("");
      setEmail("");
      setCompany("");
      setPhone("");
      setQuantity("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send inquiry");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800">
        <p className="font-semibold mb-2">Inquiry received</p>
        <p className="text-sm">
          Thanks — our team will follow up at your email. You can also reach us at{" "}
          <a href={`mailto:${site.supportEmail}`} className="underline">
            {site.supportEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Work email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            required
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Approximate quantity</label>
        <input
          type="text"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          placeholder="e.g. 25 client gifts"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">What do you need?</label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          placeholder="Occasion, delivery cities, budget range, timeline…"
          required
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={loading} className="btn-cart px-8 disabled:opacity-50">
          {loading ? "Sending…" : "Request a quote"}
        </button>
        <a
          href={`mailto:${site.supportEmail}?subject=${encodeURIComponent("Corporate gifting inquiry")}`}
          className="text-sm text-nav hover:underline"
        >
          Or email {site.supportEmail}
        </a>
      </div>
    </form>
  );
}
