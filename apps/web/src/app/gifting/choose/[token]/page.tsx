"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { GiftRecommendation } from "@blossompot/shared";
import { chooseReminder, fetchReminder } from "@/lib/gifting";

export default function ChooseGiftPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("");
  const [remainingMs, setRemainingMs] = useState(0);
  const [expired, setExpired] = useState(false);
  const [recs, setRecs] = useState<GiftRecommendation[]>([]);
  const [hint, setHint] = useState("");
  const [lastGift, setLastGift] = useState("");
  const [lastMessage, setLastMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    void fetchReminder(token)
      .then((data) => {
        setTitle(data.reminder.occasionTitle);
        setRecipient(data.recipient?.name ?? "");
        setRemainingMs(data.remainingMs);
        setExpired(data.expired);
        setRecs(data.recommendations);
        setLastGift(data.lastGift?.productName ?? "");
        setLastMessage(data.lastMessage ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Reminder not found"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (remainingMs <= 0) return;
    const id = window.setInterval(() => setRemainingMs((ms) => Math.max(0, ms - 1000)), 1000);
    return () => window.clearInterval(id);
  }, [remainingMs > 0]);

  const clock = useMemo(() => {
    const total = Math.max(0, Math.floor(remainingMs / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remainingMs]);

  const pick = async (action: string, slug?: string) => {
    try {
      const result = await chooseReminder(token, { action, productSlug: slug });
      setRecs(result.recommendations);
      setHint(result.checkoutHint);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your choice");
    }
  };

  if (loading) return <div className="p-16 text-center text-slate-500">Loading reminder…</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-primary">{title || "Choose a gift"}</h1>
      {recipient && <p className="mt-2 text-slate-600">Would you like to send something special to {recipient}?</p>}
      {!expired && remainingMs > 0 && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-primary">
          Choose a gift within the next {clock}
        </p>
      )}
      {expired && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          The choice window ended. Review the recommendation below — we will not charge you until you approve checkout.
        </p>
      )}
      {lastGift && (
        <p className="mt-3 text-sm text-slate-600">
          Last year you sent {recipient || "them"} a {lastGift}.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-2">
        {[
          ["flowers", "Flowers"],
          ["cake", "Cake"],
          ["combo", "Gift Combo"],
          ["surprise_me", "Surprise Me"],
        ].map(([action, label]) => (
          <button
            key={action}
            type="button"
            onClick={() => void pick(action)}
            className="min-h-12 rounded-xl bg-nav text-white font-semibold"
          >
            {label}
          </button>
        ))}
      </div>
      {lastGift && (
        <div className="mt-3 flex gap-2">
          <button type="button" className="min-h-11 flex-1 rounded-xl border border-slate-300 text-sm font-semibold" onClick={() => void pick("send_same")}>
            Send the same
          </button>
          <button type="button" className="min-h-11 flex-1 rounded-xl border border-slate-300 text-sm font-semibold" onClick={() => void pick("try_something_new")}>
            Try something new
          </button>
        </div>
      )}
      {lastMessage && (
        <p className="mt-4 text-sm text-slate-500">Last year&apos;s message: “{lastMessage}”</p>
      )}
      {hint && <p className="mt-4 text-sm text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">{hint}</p>}
      <ul className="mt-6 space-y-3">
        {recs.map((rec) => (
          <li key={rec.slug} className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold">{rec.name}</p>
            <p className="text-sm text-slate-500">
              {rec.currency} {rec.price.toFixed(0)} · {rec.reasons.join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <button type="button" className="text-sm font-semibold text-nav" onClick={() => void pick("approve_recommendation", rec.slug)}>
                Approve this gift
              </button>
              <Link href={`/products/${rec.slug}`} className="text-sm font-semibold text-primary">
                Checkout
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
