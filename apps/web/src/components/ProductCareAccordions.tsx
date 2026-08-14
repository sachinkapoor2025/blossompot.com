"use client";

import type { ReactNode } from "react";
import type { Product } from "@blossompot/shared";
import { productHasEatablesWithRakhi } from "@/lib/product-includes";

/** Care tips for Rakhi gifts that include chocolates, sweets, or dry fruits. */
const EATABLE_INSTRUCTIONS = [
  "Keep chocolates and other eatables in a sealed, airtight container at room temperature — away from direct sun and humidity.",
  "For the best taste and freshness, please enjoy them before the expiry date printed on the pack.",
];

/**
 * Shipping notes for every product (rewritten for BlossomPot — not a verbatim third-party copy).
 */
const SHIPPING_DELIVERY_POINTS = [
  "Courier partners handle these gifts, so the arrival window is an estimate rather than a guaranteed clock time.",
  "Your package may reach a little earlier or later than the preferred delivery date you selected.",
  "Courier parcels travel on their own route and are not combined with any hand-delivered gifts.",
  "Deliveries are paused on Sundays and U.S. national holidays.",
  "Carriers usually do not call before drop-off — please share an address where someone can receive the package.",
  "After dispatch, the delivery address cannot be redirected to a different location.",
  "Every order is carefully packed and shipped from our USA warehouse.",
  "Once your gift is on the way, you will receive a tracking number so you can follow the shipment.",
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function NotepadIcon() {
  return (
    <svg className="h-5 w-5 text-slate-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function ScooterIcon() {
  return (
    <svg className="h-5 w-5 text-slate-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
      />
    </svg>
  );
}

type AccordionProps = {
  title: string;
  icon: ReactNode;
  items: string[];
  defaultOpen?: boolean;
};

function InfoAccordion({ title, icon, items, defaultOpen = false }: AccordionProps) {
  return (
    <details
      className="group border-b border-slate-200 py-3 first:border-t first:border-slate-200"
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 select-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5 min-w-0">
          {icon}
          <span className="font-semibold text-slate-900 text-sm sm:text-base">{title}</span>
        </span>
        <span className="group-open:hidden">
          <ChevronIcon open={false} />
        </span>
        <span className="hidden group-open:inline">
          <ChevronIcon open />
        </span>
      </summary>
      <ul className="mt-3 space-y-2 pl-1 text-sm text-slate-600 leading-relaxed list-disc list-inside marker:text-slate-300">
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </details>
  );
}

type Props = {
  product: Pick<Product, "name" | "description" | "categorySlug" | "tags" | "slug"> & {
    additionalCategorySlugs?: string[];
  };
  className?: string;
};

/**
 * Collapsed care / shipping accordions on the product page.
 * - Instructions: only when the gift includes eatables with Rakhi
 * - Shipping & Delivery: every product
 */
export function ProductCareAccordions({ product, className = "" }: Props) {
  const showInstructions = productHasEatablesWithRakhi(product);

  return (
    <div className={`mb-5 ${className}`}>
      {showInstructions ? (
        <InfoAccordion
          title="Instructions"
          icon={<NotepadIcon />}
          items={EATABLE_INSTRUCTIONS}
          defaultOpen={false}
        />
      ) : null}
      <InfoAccordion
        title="Shipping & Delivery"
        icon={<ScooterIcon />}
        items={SHIPPING_DELIVERY_POINTS}
        defaultOpen={false}
      />
    </div>
  );
}
