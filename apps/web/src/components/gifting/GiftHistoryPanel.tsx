"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FEEDBACK_LABELS, type GiftHistoryEntry, type GiftRecipient, type GiftRecommendation } from "@blossompot/shared";
import { giftingApi } from "@/lib/gifting";

export function GiftHistoryPanel({
  token,
  sessionId,
  history,
  recipients,
  focusRecipientId,
  occasionType,
  onChanged,
}: {
  token: string;
  sessionId: string;
  history: GiftHistoryEntry[];
  recipients: GiftRecipient[];
  focusRecipientId?: string;
  occasionType?: string;
  onChanged: () => void;
}) {
  const client = giftingApi(token, sessionId);
  const [recs, setRecs] = useState<GiftRecommendation[]>([]);
  const [recipientId, setRecipientId] = useState(focusRecipientId ?? recipients[0]?.id ?? "");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (focusRecipientId) setRecipientId(focusRecipientId);
  }, [focusRecipientId]);

  useEffect(() => {
    if (!recipientId) return;
    const q = new URLSearchParams({ recipientId });
    if (occasionType) q.set("occasionType", occasionType);
    void client.recommend(q.toString()).then((data) => setRecs(data.recommendations)).catch(() => setRecs([]));
  }, [recipientId, occasionType, token, sessionId]);

  const person = recipients.find((r) => r.id === recipientId);
  const last = history.find((h) => h.recipientId === recipientId);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-primary">Gifts & recommendations</h2>
      <select className="w-full rounded-lg border border-slate-300 px-3 py-2.5" value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>
        {recipients.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {last && (
        <p className="text-sm text-slate-600 rounded-lg bg-rose-50 px-3 py-2">
          Last year you sent {person?.name ?? "them"} a {last.productName}
          {last.occasionTitle ? ` for ${last.occasionTitle}` : ""}.
        </p>
      )}

      {recs.length > 0 && (
        <section>
          <h3 className="font-semibold text-primary mb-3">
            Recommended{person ? ` for ${person.name}` : ""}
          </h3>
          <ul className="space-y-3">
            {recs.map((rec) => (
              <li key={rec.slug} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold">{rec.name}</p>
                <p className="text-sm text-slate-500">
                  {rec.currency} {rec.price.toFixed(0)} · {rec.reasons.join(" · ")}
                </p>
                <Link href={`/products/${rec.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-nav mt-2">
                  Choose this gift
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/forgot-occasion" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary mt-2">
            Surprise Me / last-minute options
          </Link>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold text-primary">Gift history</h3>
        {history.length === 0 && <p className="text-sm text-slate-500">No gifts recorded yet.</p>}
        {history.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
            <p className="font-semibold">{entry.productName}</p>
            <p className="text-sm text-slate-500">
              {entry.giftDate}
              {entry.occasionTitle ? ` · ${entry.occasionTitle}` : ""}
              {entry.amount != null ? ` · ${entry.currency ?? "USD"} ${entry.amount}` : ""}
            </p>
            {entry.message && <p className="text-sm italic text-slate-600">“{entry.message}”</p>}
            {entry.feedback ? (
              <p className="text-sm">{FEEDBACK_LABELS[entry.feedback]}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(["loved", "perfect", "okay", "not_suitable"] as const).map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                    onClick={() => void client.feedback(entry.id, { rating, rememberPreference: true, note }).then(onChanged)}
                  >
                    {FEEDBACK_LABELS[rating]}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
        <textarea
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          placeholder="Optional note when saving feedback"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </section>
    </div>
  );
}
