"use client";

import { useState, type ReactNode } from "react";

/** Keeps extra copy in the page HTML and shows it after Read more. */
export function ReadMore({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div hidden={!open} className="space-y-8">
        {children}
      </div>
      <button
        type="button"
        className="mt-4 text-sm font-semibold text-nav hover:underline"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Read less" : "Read more"}
      </button>
    </div>
  );
}
