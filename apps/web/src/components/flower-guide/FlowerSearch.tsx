"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { trackFlowerGuideSearch } from "@/lib/flower-guide-track";
import { searchFlowerKnowledge } from "@/lib/content/flower-guide/search";

export function FlowerSearch({
  initialQuery = "",
  variant = "hero",
}: {
  initialQuery?: string;
  variant?: "hero" | "inline";
}) {
  const id = useId();
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  const submit = (value: string) => {
    const query = value.trim();
    if (!query) {
      router.push("/flower-guide/flowers-a-z");
      return;
    }
    const results = searchFlowerKnowledge(query);
    trackFlowerGuideSearch(query, results.length);
    router.push(`/flower-guide/flowers-a-z?q=${encodeURIComponent(query)}`);
  };

  return (
    <form
      role="search"
      className={variant === "hero" ? "w-full max-w-xl" : "w-full"}
      onSubmit={(e) => {
        e.preventDefault();
        submit(q);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search flowers
      </label>
      <div className="flex overflow-hidden rounded-full border border-white/40 bg-white shadow-lg">
        <input
          id={id}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search flowers… Rose, tulip, peony, anniversary"
          className="min-w-0 flex-1 px-5 py-3 text-sm text-slate-800 outline-none"
        />
        <button
          type="submit"
          className="bg-primary px-5 text-sm font-semibold text-white hover:bg-[#9e2d55]"
        >
          Search
        </button>
      </div>
    </form>
  );
}
