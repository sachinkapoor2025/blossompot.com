"use client";

import { useState } from "react";
import { GIFTING_OCCASION_TYPES, OCCASION_TYPE_LABELS } from "@blossompot/shared";
import type { GiftOccasion, GiftRecipient, UpcomingOccasionView } from "@blossompot/shared";
import { giftingApi } from "@/lib/gifting";
import { OccasionCountdown } from "./OccasionCountdown";

export function CalendarPanel({
  token,
  sessionId,
  upcoming,
  occasions,
  recipients,
  canEdit,
  onChanged,
}: {
  token: string;
  sessionId: string;
  upcoming: UpcomingOccasionView[];
  occasions: GiftOccasion[];
  recipients: GiftRecipient[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("custom");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [error, setError] = useState("");
  const client = giftingApi(token, sessionId);

  const add = async () => {
    setError("");
    try {
      await client.createOccasion({
        title,
        occasionType: type,
        month: Number(month),
        day: Number(day),
        recipientId: recipientId || undefined,
        recurring: true,
      });
      setTitle("");
      setMonth("");
      setDay("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add date");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary">Blossom Calendar</h2>
        <p className="text-sm text-slate-500 mt-1">Birthdays, anniversaries, and the dates that matter only to you.</p>
      </div>
      <OccasionCountdown occasions={upcoming} />

      <form
        className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <h3 className="font-semibold text-primary">Add a special date</h3>
        {!canEdit && <p className="text-sm text-amber-800">Membership required to save custom dates.</p>}
        <input required className="w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="The day we met" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2.5" value={type} onChange={(e) => setType(e.target.value)}>
          {GIFTING_OCCASION_TYPES.map((t) => (
            <option key={t} value={t}>
              {OCCASION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2.5" value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>
          <option value="">Not linked to one person</option>
          {recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input required className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Month" inputMode="numeric" value={month} onChange={(e) => setMonth(e.target.value)} />
          <input required className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Day" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={!canEdit} className="min-h-11 w-full rounded-lg bg-nav text-white font-semibold disabled:opacity-50">
          Save date
        </button>
      </form>

      {occasions.length > 0 && (
        <ul className="space-y-2">
          {occasions.map((o) => (
            <li key={o.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span>
                {o.title} · {o.month}/{o.day}
              </span>
              <button
                type="button"
                className="text-red-600 font-semibold"
                onClick={() => void client.deleteOccasion(o.id).then(onChanged)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
