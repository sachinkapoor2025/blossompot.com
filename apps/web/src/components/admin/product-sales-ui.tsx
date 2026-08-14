"use client";

import Link from "next/link";
import type { ProductGrowthLabel, ProductSalesRow } from "@blossompot/shared";
import { PRODUCT_GROWTH_LABEL_DISPLAY } from "@blossompot/shared";
import { formatMoney } from "@/lib/admin-utils";

export function ChangePct({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-slate-400">—</span>;
  const up = value > 0;
  const flat = value === 0;
  const color = flat ? "text-slate-500" : up ? "text-emerald-700" : "text-red-600";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {up ? "↑" : flat ? "" : "↓"} {Math.abs(value).toFixed(0)}%
    </span>
  );
}

export function InvBadge({ health }: { health: ProductSalesRow["inventoryHealth"] }) {
  const map = {
    critical: "bg-red-100 text-red-800",
    low: "bg-amber-100 text-amber-900",
    healthy: "bg-emerald-100 text-emerald-800",
    unknown: "bg-slate-100 text-slate-600",
  } as const;
  const label = { critical: "Critical", low: "Low", healthy: "Healthy", unknown: "—" }[health];
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${map[health]}`}>
      {label}
    </span>
  );
}

export function GrowthLabels({ labels }: { labels: ProductGrowthLabel[] }) {
  if (!labels.length) return null;
  const colors: Record<ProductGrowthLabel, string> = {
    high_potential: "bg-sky-100 text-sky-900",
    star_product: "bg-amber-100 text-amber-900",
    growing: "bg-emerald-100 text-emerald-800",
    needs_improvement: "bg-orange-100 text-orange-900",
    low_performer: "bg-slate-200 text-slate-700",
    high_profit: "bg-lime-100 text-lime-900",
    trending: "bg-rose-100 text-rose-900",
    inventory_risk: "bg-red-100 text-red-800",
  };
  return (
    <div className="flex flex-wrap gap-1">
      {labels.slice(0, 3).map((l) => (
        <span
          key={l}
          className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${colors[l]}`}
        >
          {PRODUCT_GROWTH_LABEL_DISPLAY[l]}
        </span>
      ))}
    </div>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-emerald-700" : score >= 45 ? "text-amber-700" : "text-red-600";
  return <span className={`font-semibold tabular-nums ${color}`}>{score}</span>;
}

export function ProductThumb({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  if (!image) {
    return (
      <div className="h-10 w-10 shrink-0 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
        N/A
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt={name} className="h-10 w-10 shrink-0 rounded object-cover bg-slate-100" />
  );
}

export function ProductLink({ slug, name }: { slug: string; name: string }) {
  return (
    <Link
      href={`/admin/product-sales/${encodeURIComponent(slug)}`}
      className="font-medium text-[#183a68] hover:underline"
    >
      {name}
    </Link>
  );
}

export function KpiCard({
  label,
  value,
  change,
  sub,
}: {
  label: string;
  value: string;
  change?: number | null;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {change !== undefined && <ChangePct value={change} />}
        {sub && <span className="text-[11px] text-slate-500 truncate">{sub}</span>}
      </div>
    </div>
  );
}

export function moneyOrDash(amount: number | null | undefined, currency = "USD") {
  if (amount == null) return "—";
  return formatMoney(amount, currency);
}

export const DATE_PRESETS: { id: string; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_7", label: "Last 7 days" },
  { id: "last_30", label: "Last 30 days" },
  { id: "last_90", label: "Last 90 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "this_year", label: "This year" },
  { id: "custom", label: "Custom" },
];
