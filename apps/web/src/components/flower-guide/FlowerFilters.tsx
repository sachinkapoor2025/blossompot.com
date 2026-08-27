"use client";

import { useRouter, useSearchParams } from "next/navigation";

const COLOURS = ["red", "pink", "white", "yellow", "orange", "purple", "blue", "green", "peach", "mixed"];
const SEASONS = ["spring", "summer", "autumn", "winter", "year-round"];
const OCCASIONS = ["birthday", "anniversary", "wedding", "romantic", "sympathy", "thank-you"];
const FRAGRANCE = ["none", "light", "moderate", "strong"];
const LONGEVITY = ["short", "medium", "long"];

function Select({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (name: string, value: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace(/-/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FlowerFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    const qs = next.toString();
    router.replace(qs ? `/flower-guide/flowers-a-z?${qs}` : "/flower-guide/flowers-a-z");
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 rounded-2xl border border-[#eadfd8] bg-white p-4">
      <Select label="Colour" name="colour" value={params.get("colour") ?? ""} options={COLOURS} onChange={update} />
      <Select label="Season" name="season" value={params.get("season") ?? ""} options={SEASONS} onChange={update} />
      <Select label="Occasion" name="occasion" value={params.get("occasion") ?? ""} options={OCCASIONS} onChange={update} />
      <Select label="Fragrance" name="fragrance" value={params.get("fragrance") ?? ""} options={FRAGRANCE} onChange={update} />
      <Select label="Longevity" name="longevity" value={params.get("longevity") ?? ""} options={LONGEVITY} onChange={update} />
      <label className="flex items-end gap-2 text-sm text-slate-700 pb-2">
        <input
          type="checkbox"
          checked={params.get("petFriendly") === "1"}
          onChange={(e) => update("petFriendly", e.target.checked ? "1" : "")}
        />
        Pet-friendly listings
      </label>
    </div>
  );
}
