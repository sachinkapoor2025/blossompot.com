"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GiftRecommendation } from "@blossompot/shared";
import { fetchEmergencyGifts } from "@/lib/gifting";

const CATS = [
  { id: "", label: "All last-minute" },
  { id: "flowers", label: "Same-day flowers" },
  { id: "cake", label: "Cake" },
  { id: "combo", label: "Gift combos" },
];

export default function ForgotOccasionPage() {
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<GiftRecommendation[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    void fetchEmergencyGifts(category || undefined)
      .then((data) => setItems(data.recommendations))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load options"));
  }, [category]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <p className="text-sm font-semibold text-red-600">Forgot a special occasion?</p>
      <h1 className="text-3xl font-bold text-primary mt-2">Don&apos;t worry. We&apos;ve got you.</h1>
      <p className="text-slate-600 mt-3">
        Last-minute flowers, cakes, and combos scored from live inventory — not a random list.
      </p>
      <div className="flex flex-wrap gap-2 mt-6">
        {CATS.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
              category === cat.id ? "bg-nav text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.slug} className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold">{item.name}</p>
            <p className="text-sm text-slate-500">
              {item.currency} {item.price.toFixed(0)} · {item.reasons.join(" · ")}
            </p>
            <Link href={`/products/${item.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-nav">
              Send this now
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
