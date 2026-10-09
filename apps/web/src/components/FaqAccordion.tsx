"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: string };

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((faq, index) => {
        const expanded = open === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;
        return (
          <div key={faq.q} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left font-semibold text-primary"
                onClick={() => setOpen(expanded ? null : index)}
              >
                <span>{faq.q}</span>
                <span className="text-xl leading-none text-slate-400" aria-hidden>
                  {expanded ? "−" : "+"}
                </span>
              </button>
            </h3>
            {expanded ? (
              <p id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-4 text-slate-600 leading-relaxed">
                {faq.a}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
