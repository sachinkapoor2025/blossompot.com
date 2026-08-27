"use client";

import { useState } from "react";
import {
  RELATIONSHIP_LABELS,
  GIFTING_RELATIONSHIPS,
  GIFTING_GIFT_CATEGORIES,
  formatMonthDay,
  type GiftRecipient,
} from "@blossompot/shared";
import { giftingApi } from "@/lib/gifting";

const emptyForm = {
  name: "",
  relationship: "friend" as GiftRecipient["relationship"],
  birthdayMonth: "",
  birthdayDay: "",
  anniversaryMonth: "",
  anniversaryDay: "",
  customLabel: "",
  customMonth: "",
  customDay: "",
  email: "",
  phone: "",
  favouriteFlower: "",
  favouriteColour: "",
  favouriteCakeFlavour: "",
  preferredGiftCategory: "",
  budgetMin: "",
  budgetMax: "",
  notes: "",
};

export function PeopleManager({
  token,
  sessionId,
  recipients,
  canEdit,
  onChanged,
}: {
  token: string;
  sessionId: string;
  recipients: GiftRecipient[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const client = giftingApi(token, sessionId);

  const set = (key: keyof typeof emptyForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const startEdit = (person: GiftRecipient) => {
    setEditingId(person.id);
    setOpen(true);
    setForm({
      ...emptyForm,
      name: person.name,
      relationship: person.relationship,
      birthdayMonth: person.birthday ? String(person.birthday.month) : "",
      birthdayDay: person.birthday ? String(person.birthday.day) : "",
      anniversaryMonth: person.anniversary ? String(person.anniversary.month) : "",
      anniversaryDay: person.anniversary ? String(person.anniversary.day) : "",
      email: person.email ?? "",
      phone: person.phone ?? "",
      favouriteFlower: person.preferences?.favouriteFlower ?? "",
      favouriteColour: person.preferences?.favouriteColour ?? "",
      favouriteCakeFlavour: person.preferences?.favouriteCakeFlavour ?? "",
      preferredGiftCategory: person.preferences?.preferredGiftCategory ?? "",
      budgetMin: person.preferences?.budgetMin != null ? String(person.preferences.budgetMin) : "",
      budgetMax: person.preferences?.budgetMax != null ? String(person.preferences.budgetMax) : "",
      notes: person.preferences?.notes ?? "",
    });
  };

  const payload = () => ({
    name: form.name,
    relationship: form.relationship,
    birthday: form.birthdayMonth && form.birthdayDay
      ? { month: Number(form.birthdayMonth), day: Number(form.birthdayDay) }
      : undefined,
    anniversary: form.anniversaryMonth && form.anniversaryDay
      ? { month: Number(form.anniversaryMonth), day: Number(form.anniversaryDay) }
      : undefined,
    customDates:
      form.customLabel && form.customMonth && form.customDay
        ? [{ label: form.customLabel, month: Number(form.customMonth), day: Number(form.customDay) }]
        : undefined,
    email: form.email || undefined,
    phone: form.phone || undefined,
    preferences: {
      favouriteFlower: form.favouriteFlower || undefined,
      favouriteColour: form.favouriteColour || undefined,
      favouriteCakeFlavour: form.favouriteCakeFlavour || undefined,
      preferredGiftCategory: form.preferredGiftCategory || undefined,
      budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      notes: form.notes || undefined,
    },
  });

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      if (editingId) await client.updateRecipient(editingId, payload());
      else await client.createRecipient(payload());
      setForm(emptyForm);
      setEditingId(null);
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this person and their dates?")) return;
    try {
      await client.deleteRecipient(id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-primary">My People</h2>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setOpen(true);
          }}
          className="min-h-11 rounded-full bg-nav px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add person
        </button>
      </div>
      {!canEdit && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Start a membership to save people and their special dates.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="space-y-3">
        {recipients.map((person) => (
          <li key={person.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{person.name}</p>
                <p className="text-sm text-slate-500">{RELATIONSHIP_LABELS[person.relationship]}</p>
                <p className="text-sm text-slate-600 mt-2">
                  {person.birthday ? `Birthday: ${formatMonthDay(person.birthday.month, person.birthday.day)}` : null}
                  {person.birthday && person.anniversary ? " · " : null}
                  {person.anniversary
                    ? `Anniversary: ${formatMonthDay(person.anniversary.month, person.anniversary.day)}`
                    : null}
                </p>
                {person.preferences?.favouriteFlower && (
                  <p className="text-sm text-slate-500 mt-1">Favourite: {person.preferences.favouriteFlower}</p>
                )}
                {(person.preferences?.budgetMin != null || person.preferences?.budgetMax != null) && (
                  <p className="text-sm text-slate-500">
                    Budget: ${person.preferences.budgetMin ?? 0}–${person.preferences.budgetMax ?? "∞"}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" className="text-sm font-semibold text-nav" onClick={() => startEdit(person)}>
                  Edit
                </button>
                <button type="button" className="text-sm font-semibold text-red-600" onClick={() => void remove(person.id)}>
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <form
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h3 className="font-semibold text-primary">{editingId ? "Edit person" : "Add a person"}</h3>
          <input
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            placeholder="Name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            value={form.relationship}
            onChange={(e) => set("relationship", e.target.value as GiftRecipient["relationship"])}
          >
            {GIFTING_RELATIONSHIPS.map((rel) => (
              <option key={rel} value={rel}>
                {RELATIONSHIP_LABELS[rel]}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Birthday month" inputMode="numeric" value={form.birthdayMonth} onChange={(e) => set("birthdayMonth", e.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Birthday day" inputMode="numeric" value={form.birthdayDay} onChange={(e) => set("birthdayDay", e.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Anniversary month" inputMode="numeric" value={form.anniversaryMonth} onChange={(e) => set("anniversaryMonth", e.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Anniversary day" inputMode="numeric" value={form.anniversaryDay} onChange={(e) => set("anniversaryDay", e.target.value)} />
          </div>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Custom date label (The day we met)" value={form.customLabel} onChange={(e) => set("customLabel", e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Custom month" inputMode="numeric" value={form.customMonth} onChange={(e) => set("customMonth", e.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Custom day" inputMode="numeric" value={form.customDay} onChange={(e) => set("customDay", e.target.value)} />
          </div>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Email (optional)" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="WhatsApp / mobile (optional)" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Favourite flower" value={form.favouriteFlower} onChange={(e) => set("favouriteFlower", e.target.value)} />
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Favourite colour" value={form.favouriteColour} onChange={(e) => set("favouriteColour", e.target.value)} />
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Favourite cake / flavour" value={form.favouriteCakeFlavour} onChange={(e) => set("favouriteCakeFlavour", e.target.value)} />
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2.5" value={form.preferredGiftCategory} onChange={(e) => set("preferredGiftCategory", e.target.value)}>
            <option value="">Preferred gift category</option>
            {GIFTING_GIFT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Budget min $" inputMode="decimal" value={form.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Budget max $" inputMode="decimal" value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} />
          </div>
          <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Notes / preferences" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="min-h-11 flex-1 rounded-lg bg-nav text-white font-semibold disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="min-h-11 px-4 rounded-lg border border-slate-300" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
