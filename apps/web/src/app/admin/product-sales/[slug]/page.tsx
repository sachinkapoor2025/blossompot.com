"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useApiClient } from "@/lib/auth-context";
import type { ProductSalesIntelDetailResponse, TrendGranularity } from "@blossompot/shared";
import { AreaChart } from "@/components/admin/Charts";
import { formatMoney } from "@/lib/admin-utils";
import {
  DATE_PRESETS,
  GrowthLabels,
  InvBadge,
  KpiCard,
  ProductThumb,
  ScoreRing,
  moneyOrDash,
} from "@/components/admin/product-sales-ui";

function DetailInner() {
  const api = useApiClient();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = decodeURIComponent(String(params.slug ?? ""));

  const [preset, setPreset] = useState(searchParams.get("preset") || "last_30");
  const [granularity, setGranularity] = useState<TrendGranularity>("daily");
  const [data, setData] = useState<ProductSalesIntelDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ preset, granularity });
      const res = await api<ProductSalesIntelDetailResponse>(
        `/admin/analytics/product-sales/products/${encodeURIComponent(slug)}?${q}`
      );
      setData(res);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [api, slug, preset, granularity]);

  useEffect(() => {
    void load();
  }, [load]);

  const p = data?.product;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/product-sales" className="text-sm text-[#183a68] hover:underline">
          ← Product Sales Intelligence
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-500">
          Period
          <select
            className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            {DATE_PRESETS.filter((d) => d.id !== "custom").map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Trend
          <select
            className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as TrendGranularity)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-slate-500">Loading product performance…</p>}

      {!loading && p && data && (
        <>
          <div className="flex flex-wrap items-start gap-4">
            <ProductThumb image={p.image} name={p.name} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-slate-900">{p.name}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {p.sku ?? p.productSlug} · {p.vendorSlug}
                {p.categorySlug ? ` · ${p.categorySlug}` : ""}
                {p.sellingPrice != null
                  ? ` · ${formatMoney(p.sellingPrice, p.currency ?? "USD")}`
                  : ""}
                {p.costPrice != null ? ` · cost ${formatMoney(p.costPrice, "USD")}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-sm">
                  Growth score <ScoreRing score={p.growthScore} />
                </span>
                <GrowthLabels labels={p.labels} />
                <InvBadge health={p.inventoryHealth} />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Orders" value={String(p.orders)} change={p.periodChange.orders} />
            <KpiCard
              label="Units sold"
              value={String(p.unitsSold)}
              change={p.periodChange.unitsSold}
            />
            <KpiCard
              label="Net revenue"
              value={formatMoney(p.netSalesUSD, "USD")}
              change={p.periodChange.revenueUSD}
            />
            <KpiCard
              label="Est. profit"
              value={moneyOrDash(p.estimatedProfitUSD)}
              change={p.periodChange.profitUSD}
              sub={p.profitMarginPct != null ? `${p.profitMarginPct}% margin` : "Cost unavailable"}
            />
            <KpiCard
              label="Refunds (merch)"
              value={formatMoney(p.refundsUSD, "USD")}
              sub={
                p.refundRatePct != null
                  ? `${p.refundRatePct}% of units · ${p.refundOrders} orders`
                  : undefined
              }
            />
            <KpiCard
              label="Avg units / order"
              value={p.avgUnitsPerOrder != null ? String(p.avgUnitsPerOrder) : "—"}
            />
            <KpiCard
              label="Inventory"
              value={p.inventory != null ? String(p.inventory) : "—"}
              sub={
                p.daysOfInventoryRemaining != null
                  ? `~${Math.round(p.daysOfInventoryRemaining)} days left`
                  : p.salesVelocity != null
                    ? `${p.salesVelocity}/day velocity`
                    : undefined
              }
            />
            <KpiCard
              label="Customers"
              value={String(p.customerCount)}
              sub={
                p.ratingValue != null
                  ? `Rating ${p.ratingValue} (${p.reviewCount ?? 0})`
                  : "Rating unavailable"
              }
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold mb-3">Sales trend</h2>
            {data.trend.length ? (
              <AreaChart
                data={data.trend.map((t) => ({
                  label: t.label,
                  value: t.revenueUSD,
                  secondary: t.orders,
                }))}
                showSecondary
              />
            ) : (
              <p className="text-sm text-slate-500">No sales in this period.</p>
            )}
            <p className="mt-2 text-[11px] text-slate-500">
              Primary = net revenue USD · Secondary = orders. Profit series available when cost is
              known on all units.
            </p>
            {data.trend.some((t) => t.profitUSD != null) && (
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-600 mb-2">Estimated profit</p>
                <AreaChart
                  data={data.trend.map((t) => ({
                    label: t.label,
                    value: t.profitUSD ?? 0,
                  }))}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold mb-3">Product health</h2>
              <ul className="space-y-2 text-sm">
                {(
                  [
                    ["Sales decline", data.health.salesDecline],
                    ["Refund problems", data.health.refundProblems],
                    ["Inventory problems", data.health.inventoryProblems],
                    ["Pricing / margin issues", data.health.pricingIssues],
                    ["Review problems", data.health.reviewProblems],
                    ["Low demand", data.health.lowDemand],
                  ] as const
                ).map(([label, on]) => (
                  <li key={label} className="flex items-center justify-between">
                    <span>{label}</span>
                    <span
                      className={`text-xs font-semibold ${
                        on ? "text-red-700" : "text-emerald-700"
                      }`}
                    >
                      {on ? "Flagged" : "OK"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold mb-3">Order analysis</h2>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-slate-500">Avg qty / order</dt>
                <dd className="tabular-nums">{data.orderAnalysis.avgUnitsPerOrder ?? "—"}</dd>
                <dt className="text-slate-500">Unique customers</dt>
                <dd className="tabular-nums">{data.orderAnalysis.customerCount}</dd>
                <dt className="text-slate-500">Repeat purchase rate</dt>
                <dd className="text-slate-400">Unavailable</dd>
                <dt className="text-slate-500">Geographic / segments</dt>
                <dd className="text-slate-400">Unavailable</dd>
              </dl>
              <p className="mt-3 text-[11px] text-slate-500">
                Repeat rate and geo/segment breakdowns need deeper customer-history joins — reserved
                for a later release.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold mb-3">Intelligent recommendations</h2>
            {!data.recommendations.length ? (
              <p className="text-sm text-slate-500">No specific recommendations for this product.</p>
            ) : (
              <div className="space-y-3">
                {data.recommendations.map((r, i) => (
                  <div
                    key={`${r.category}-${i}`}
                    className={`rounded-md border p-3 ${
                      r.severity === "critical"
                        ? "border-red-200 bg-red-50/50"
                        : r.severity === "warning"
                          ? "border-amber-200 bg-amber-50/40"
                          : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <p className="font-medium text-slate-900">{r.title}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                      {r.category.replace(/_/g, " ")}
                    </p>
                    <dl className="mt-2 space-y-1 text-sm text-slate-700">
                      <div>
                        <span className="font-medium text-slate-500">Problem: </span>
                        {r.problem}
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Evidence: </span>
                        {r.evidence}
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Action: </span>
                        {r.action}
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Opportunity: </span>
                        {r.expectedOpportunity}
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold mb-3">Frequently bought together</h2>
            {!data.coPurchases.length ? (
              <p className="text-sm text-slate-500">No co-purchase pairs in this period.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.coPurchases.map((c) => (
                  <li key={c.slug} className="flex justify-between gap-2">
                    <Link
                      href={`/admin/product-sales/${encodeURIComponent(c.slug)}`}
                      className="text-[#183a68] hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span className="tabular-nums text-slate-600">{c.orderCount} orders</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold mb-2">Future signals (not available yet)</h2>
            <p className="text-xs text-slate-600">
              Page views, add-to-cart, conversion rate, ad spend and ROAS are reserved on the API
              (`external` fields) for Google Analytics / Meta / Google Ads integrations. They are
              shown as unavailable rather than estimated.
            </p>
            <ul className="mt-2 text-xs text-slate-500 grid sm:grid-cols-2 gap-1">
              <li>Page views: —</li>
              <li>Add to carts: —</li>
              <li>Conversion rate: —</li>
              <li>Ad spend / ROAS: —</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductSalesDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500 p-4">Loading…</p>}>
      <DetailInner />
    </Suspense>
  );
}
