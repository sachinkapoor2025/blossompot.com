"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useApiClient } from "@/lib/auth-context";
import type {
  ProductSalesIntelListResponse,
  ProductSalesIntelSummaryResponse,
  ProductSalesRow,
} from "@blossompot/shared";
import { HorizontalBarChart } from "@/components/admin/Charts";
import { downloadCsv, formatMoney } from "@/lib/admin-utils";
import {
  ChangePct,
  DATE_PRESETS,
  GrowthLabels,
  InvBadge,
  KpiCard,
  ProductLink,
  ProductThumb,
  ScoreRing,
  moneyOrDash,
} from "@/components/admin/product-sales-ui";

type Tab =
  | "overview"
  | "products"
  | "rankings"
  | "opportunities"
  | "bundles"
  | "categories"
  | "compare"
  | "alerts";

function parseTab(raw: string | null): Tab {
  const allowed: Tab[] = [
    "overview",
    "products",
    "rankings",
    "opportunities",
    "bundles",
    "categories",
    "compare",
    "alerts",
  ];
  return allowed.includes(raw as Tab) ? (raw as Tab) : "overview";
}

function ProductSalesPageInner() {
  const api = useApiClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [preset, setPreset] = useState(searchParams.get("preset") || "last_30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [summary, setSummary] = useState<ProductSalesIntelSummaryResponse | null>(null);
  const [list, setList] = useState<ProductSalesIntelListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [performance, setPerformance] = useState("");
  const [sort, setSort] = useState("netSalesUSD");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareRows, setCompareRows] = useState<ProductSalesRow[]>([]);
  const [rebuilding, setRebuilding] = useState(false);

  const rangeQuery = useMemo(() => {
    const p = new URLSearchParams();
    p.set("preset", preset);
    if (preset === "custom" && customFrom && customTo) {
      p.set("from", customFrom);
      p.set("to", customTo);
    }
    return p.toString();
  }, [preset, customFrom, customTo]);

  const setTab = (next: Tab) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", next);
    router.replace(`/admin/product-sales?${p.toString()}`);
  };

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<ProductSalesIntelSummaryResponse>(
        `/admin/analytics/product-sales?${rangeQuery}`
      );
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setError(err instanceof Error ? err.message : "Failed to load product sales");
    } finally {
      setLoading(false);
    }
  }, [api, rangeQuery]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const p = new URLSearchParams(rangeQuery);
      p.set("page", String(page));
      p.set("pageSize", "25");
      p.set("sort", sort);
      p.set("dir", dir);
      if (search) p.set("q", search);
      if (vendor) p.set("vendor", vendor);
      if (category) p.set("category", category);
      if (performance) p.set("performance", performance);
      const data = await api<ProductSalesIntelListResponse>(
        `/admin/analytics/product-sales/products?${p}`
      );
      setList(data);
    } catch (err) {
      setList(null);
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setListLoading(false);
    }
  }, [api, rangeQuery, page, sort, dir, search, vendor, category, performance]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (tab === "products" || tab === "compare") void loadList();
  }, [tab, loadList]);

  const toggleSelect = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= 5 ? prev : [...prev, slug]
    );
  };

  const runCompare = async () => {
    if (selected.length < 2) return;
    const data = await api<{ products: ProductSalesRow[] }>(
      `/admin/analytics/product-sales/compare?${rangeQuery}&slugs=${selected.join(",")}`
    );
    setCompareRows(data.products);
    setTab("compare");
  };

  const exportCsv = async () => {
    const p = new URLSearchParams(rangeQuery);
    if (search) p.set("q", search);
    if (vendor) p.set("vendor", vendor);
    if (category) p.set("category", category);
    if (performance) p.set("performance", performance);
    p.set("sort", sort);
    p.set("dir", dir);
    const data = await api<{ products: ProductSalesRow[]; range: { label: string } }>(
      `/admin/analytics/product-sales/export?${p}`
    );
    downloadCsv(`product-sales-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Product Sales Intelligence Report"],
      ["Period", data.range.label],
      [],
      [
        "Name",
        "Slug",
        "SKU",
        "Category",
        "Vendor",
        "Orders",
        "Units",
        "Gross USD",
        "Discounts USD",
        "Refunds USD",
        "Net USD",
        "Profit USD",
        "Margin %",
        "Inventory",
        "Growth Score",
        "Order Change %",
        "Refund Rate %",
        "Last Order",
      ],
      ...data.products.map((r) => [
        r.name,
        r.productSlug,
        r.sku ?? "",
        r.categorySlug ?? "",
        r.vendorSlug,
        String(r.orders),
        String(r.unitsSold),
        r.grossSalesUSD.toFixed(2),
        r.discountsUSD.toFixed(2),
        r.refundsUSD.toFixed(2),
        r.netSalesUSD.toFixed(2),
        r.estimatedProfitUSD?.toFixed(2) ?? "",
        r.profitMarginPct?.toFixed(1) ?? "",
        r.inventory != null ? String(r.inventory) : "",
        String(r.growthScore),
        r.periodChange.orders != null ? String(r.periodChange.orders) : "",
        r.refundRatePct != null ? String(r.refundRatePct) : "",
        r.lastOrderAt ?? "",
      ]),
    ]);
  };

  const rebuild = async () => {
    setRebuilding(true);
    try {
      await api(`/admin/analytics/product-sales/rebuild?${rangeQuery}`, { method: "POST" });
      await loadSummary();
      if (tab === "products") await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rebuild failed");
    } finally {
      setRebuilding(false);
    }
  };

  const s = summary?.summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Product Sales Intelligence</h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Performance & growth center — decide what to promote, improve, restock, bundle, or
            discontinue. Insights use paid order line data (not invented metrics).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void exportCsv()}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            disabled={rebuilding}
            onClick={() => void rebuild()}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {rebuilding ? "Rebuilding…" : "Rebuild rollups"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <label className="text-xs text-slate-500">
          Period
          <select
            className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        {preset === "custom" && (
          <>
            <label className="text-xs text-slate-500">
              From
              <input
                type="date"
                className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-500">
              To
              <input
                type="date"
                className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </label>
          </>
        )}
        {summary && (
          <p className="text-xs text-slate-500 pb-1.5">
            {summary.range.label} vs {summary.previousRange.label}
            {summary.source !== "rollups" ? ` · source: ${summary.source}` : ""}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-px">
        {(
          [
            ["overview", "Overview"],
            ["products", "All products"],
            ["rankings", "Rankings"],
            ["opportunities", "Opportunity center"],
            ["bundles", "Bundles & cross-sell"],
            ["categories", "Category & vendor"],
            ["compare", "Compare"],
            ["alerts", "Smart alerts"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-t px-3 py-2 text-sm ${
              tab === id
                ? "bg-white border border-b-white border-slate-200 font-medium text-[#183a68]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && !summary ? (
        <p className="text-sm text-slate-500">Loading product performance…</p>
      ) : !summary ? (
        <p className="text-sm text-slate-500">No data yet.</p>
      ) : (
        <>
          {tab === "overview" && s && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <KpiCard
                  label="Products sold"
                  value={String(s.totalProductsSold)}
                />
                <KpiCard
                  label="Orders"
                  value={String(s.totalOrders)}
                  change={s.periodChange.orders}
                />
                <KpiCard
                  label="Units sold"
                  value={String(s.unitsSold)}
                  change={s.periodChange.unitsSold}
                />
                <KpiCard
                  label="Net revenue (USD)"
                  value={formatMoney(s.revenueUSD, "USD")}
                  change={s.periodChange.revenueUSD}
                  sub={s.revenueINR > 0 ? `+ ${formatMoney(s.revenueINR, "INR")}` : undefined}
                />
                <KpiCard
                  label="Est. profit (USD)"
                  value={moneyOrDash(s.estimatedProfitUSD)}
                  change={s.periodChange.profitUSD}
                  sub="When vendor cost known"
                />
                <KpiCard
                  label="AOV (USD merch)"
                  value={moneyOrDash(s.averageOrderValueUSD)}
                />
                <KpiCard
                  label="Best seller"
                  value={s.bestSellingProduct?.name ?? "—"}
                  sub={
                    s.bestSellingProduct
                      ? `${s.bestSellingProduct.orders} orders`
                      : undefined
                  }
                />
                <KpiCard
                  label="Fastest growing"
                  value={s.fastestGrowingProduct?.name ?? "—"}
                  change={s.fastestGrowingProduct?.growthPct}
                />
                <KpiCard
                  label="Highest profit"
                  value={s.highestProfitProduct?.name ?? "—"}
                  sub={
                    s.highestProfitProduct
                      ? formatMoney(s.highestProfitProduct.profitUSD, "USD")
                      : "Cost data needed"
                  }
                />
                <KpiCard
                  label="Needs attention"
                  value={String(s.productsNeedingAttention)}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="text-sm font-semibold text-slate-800 mb-3">Top by orders</h2>
                  <HorizontalBarChart
                    items={summary.rankings.byOrders.map((r) => ({
                      label: r.name,
                      value: r.orders,
                      sub: `${r.unitsSold} units`,
                    }))}
                  />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="text-sm font-semibold text-slate-800 mb-3">Top by profit</h2>
                  {summary.rankings.byProfit.length ? (
                    <HorizontalBarChart
                      items={summary.rankings.byProfit.map((r) => ({
                        label: r.name,
                        value: r.estimatedProfitUSD ?? 0,
                        sub: r.profitMarginPct != null ? `${r.profitMarginPct}% margin` : undefined,
                      }))}
                      color="#15803d"
                    />
                  ) : (
                    <p className="text-sm text-slate-500">
                      Profit rankings unavailable — vendor cost missing on most lines.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">How metrics are calculated</h2>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>{summary.definitions.grossRevenue}</li>
                  <li>{summary.definitions.netRevenue}</li>
                  <li>{summary.definitions.estimatedProfit}</li>
                  <li>{summary.definitions.refunds}</li>
                  <li>{summary.definitions.excludedOrders}</li>
                </ul>
              </div>
            </div>
          )}

          {tab === "products" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm min-w-[180px]"
                  placeholder="Search name / SKU / slug"
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                />
                <select
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={vendor}
                  onChange={(e) => {
                    setPage(1);
                    setVendor(e.target.value);
                  }}
                >
                  <option value="">All vendors</option>
                  {(summary.vendors ?? []).map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={category}
                  onChange={(e) => {
                    setPage(1);
                    setCategory(e.target.value);
                  }}
                >
                  <option value="">All categories</option>
                  {(summary.categories ?? []).map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={performance}
                  onChange={(e) => {
                    setPage(1);
                    setPerformance(e.target.value);
                  }}
                >
                  <option value="">All performance</option>
                  <option value="sellers">With sales</option>
                  <option value="no_sales">No sales</option>
                  <option value="attention">Needs attention</option>
                  <option value="growing">Growing</option>
                </select>
                <select
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {[
                    ["netSalesUSD", "Net revenue"],
                    ["orders", "Orders"],
                    ["unitsSold", "Units"],
                    ["estimatedProfitUSD", "Profit"],
                    ["profitMarginPct", "Margin"],
                    ["growthScore", "Growth score"],
                    ["inventory", "Inventory"],
                    ["periodChangeOrders", "Order growth %"],
                    ["refundRatePct", "Refund rate"],
                    ["name", "Name"],
                  ].map(([v, l]) => (
                    <option key={v} value={v}>
                      Sort: {l}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                  onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
                >
                  {dir === "asc" ? "Asc" : "Desc"}
                </button>
                {selected.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => void runCompare()}
                    className="rounded bg-[#183a68] text-white px-3 py-1.5 text-sm"
                  >
                    Compare ({selected.length})
                  </button>
                )}
              </div>

              {listLoading && <p className="text-sm text-slate-500">Loading…</p>}
              {!listLoading && list && list.products.length === 0 && (
                <p className="text-sm text-slate-500">No products match filters.</p>
              )}
              {list && list.products.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-2" />
                        <th className="p-2">Product</th>
                        <th className="p-2">Orders</th>
                        <th className="p-2">Units</th>
                        <th className="p-2">Net USD</th>
                        <th className="p-2">Profit</th>
                        <th className="p-2">Margin</th>
                        <th className="p-2">Δ Orders</th>
                        <th className="p-2">Score</th>
                        <th className="p-2">Stock</th>
                        <th className="p-2">Labels</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.products.map((r) => (
                        <tr key={r.productSlug} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={selected.includes(r.productSlug)}
                              onChange={() => toggleSelect(r.productSlug)}
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2 min-w-[200px]">
                              <ProductThumb image={r.image} name={r.name} />
                              <div>
                                <ProductLink slug={r.productSlug} name={r.name} />
                                <p className="text-[10px] text-slate-500">
                                  {r.sku ?? r.productSlug} · {r.vendorSlug}
                                  {r.categorySlug ? ` · ${r.categorySlug}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 tabular-nums">{r.orders}</td>
                          <td className="p-2 tabular-nums">{r.unitsSold}</td>
                          <td className="p-2 tabular-nums">{formatMoney(r.netSalesUSD, "USD")}</td>
                          <td className="p-2 tabular-nums">{moneyOrDash(r.estimatedProfitUSD)}</td>
                          <td className="p-2 tabular-nums">
                            {r.profitMarginPct != null ? `${r.profitMarginPct}%` : "—"}
                          </td>
                          <td className="p-2">
                            <ChangePct value={r.periodChange.orders} />
                          </td>
                          <td className="p-2">
                            <ScoreRing score={r.growthScore} />
                          </td>
                          <td className="p-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="tabular-nums">{r.inventory ?? "—"}</span>
                              <InvBadge health={r.inventoryHealth} />
                            </div>
                          </td>
                          <td className="p-2">
                            <GrowthLabels labels={r.labels} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {list && list.total > list.pageSize && (
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    disabled={page <= 1}
                    className="rounded border px-2 py-1 disabled:opacity-40"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <span className="text-slate-600">
                    Page {list.page} / {Math.ceil(list.total / list.pageSize)} ({list.total} products)
                  </span>
                  <button
                    type="button"
                    disabled={page * list.pageSize >= list.total}
                    className="rounded border px-2 py-1 disabled:opacity-40"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "rankings" && (
            <div className="grid gap-4 lg:grid-cols-2">
              {(
                [
                  ["Top by orders", summary.rankings.byOrders, "orders"],
                  ["Top by units", summary.rankings.byUnits, "unitsSold"],
                  ["Top by revenue", summary.rankings.byRevenue, "netSalesUSD"],
                  ["Top by profit", summary.rankings.byProfit, "estimatedProfitUSD"],
                  ["Top by margin", summary.rankings.byMargin, "profitMarginPct"],
                  ["Needs attention", summary.rankings.needingAttention, "growthScore"],
                ] as const
              ).map(([title, rows, metric]) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="text-sm font-semibold mb-3">{title}</h2>
                  {!rows.length ? (
                    <p className="text-sm text-slate-500">No products in this ranking.</p>
                  ) : (
                    <ul className="space-y-2">
                      {rows.map((r, i) => (
                        <li key={r.productSlug} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-400 w-4">{i + 1}</span>
                            <ProductLink slug={r.productSlug} name={r.name} />
                          </span>
                          <span className="tabular-nums text-slate-700 shrink-0">
                            {metric === "orders" && r.orders}
                            {metric === "unitsSold" && r.unitsSold}
                            {metric === "netSalesUSD" && formatMoney(r.netSalesUSD, "USD")}
                            {metric === "estimatedProfitUSD" && moneyOrDash(r.estimatedProfitUSD)}
                            {metric === "profitMarginPct" &&
                              (r.profitMarginPct != null ? `${r.profitMarginPct}%` : "—")}
                            {metric === "growthScore" && <ScoreRing score={r.growthScore} />}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "opportunities" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Estimated opportunities only — not guaranteed revenue. Based on category averages,
                prior-period recovery, and stockout risk.
              </p>
              {!summary.opportunities.length ? (
                <p className="text-sm text-slate-500">No clear opportunities in this period.</p>
              ) : (
                summary.opportunities.map((o) => (
                  <div
                    key={`${o.kind}:${o.productSlug}`}
                    className="rounded-lg border border-amber-200 bg-amber-50/40 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <Link
                        href={`/admin/product-sales/${encodeURIComponent(o.productSlug)}`}
                        className="font-medium text-[#183a68] hover:underline"
                      >
                        {o.productName}
                      </Link>
                      <span className="text-[10px] uppercase tracking-wide text-amber-800 font-semibold">
                        {o.estimateLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{o.rationale}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      {o.estimatedAdditionalOrders != null && (
                        <>~{o.estimatedAdditionalOrders} orders · </>
                      )}
                      {o.estimatedAdditionalRevenueUSD != null && (
                        <>~{formatMoney(o.estimatedAdditionalRevenueUSD, "USD")} revenue</>
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "bundles" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Frequently bought together from paid orders in this period. Use for combos, cart
                recommendations, and bundle pricing tests.
              </p>
              {!summary.coPurchases.length ? (
                <p className="text-sm text-slate-500">
                  Not enough multi-product orders to recommend bundles yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600">
                      <tr>
                        <th className="p-3 text-left">Product A</th>
                        <th className="p-3 text-left">Product B</th>
                        <th className="p-3 text-right">Orders together</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.coPurchases.map((c) => (
                        <tr key={`${c.productSlug}:${c.otherSlug}`} className="border-t">
                          <td className="p-3">
                            <ProductLink slug={c.productSlug} name={c.productName} />
                          </td>
                          <td className="p-3">
                            <ProductLink slug={c.otherSlug} name={c.otherName} />
                          </td>
                          <td className="p-3 text-right tabular-nums">{c.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "categories" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4 overflow-x-auto">
                <h2 className="text-sm font-semibold mb-3">Category performance</h2>
                <table className="min-w-full text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="text-left py-1">Category</th>
                      <th className="text-right py-1">Orders</th>
                      <th className="text-right py-1">Units</th>
                      <th className="text-right py-1">Revenue</th>
                      <th className="text-right py-1">Profit</th>
                      <th className="text-right py-1">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.categories.map((c) => (
                      <tr key={c.key} className="border-t border-slate-100">
                        <td className="py-1.5">{c.label}</td>
                        <td className="py-1.5 text-right tabular-nums">{c.orders}</td>
                        <td className="py-1.5 text-right tabular-nums">{c.unitsSold}</td>
                        <td className="py-1.5 text-right tabular-nums">
                          {formatMoney(c.revenueUSD, "USD")}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {moneyOrDash(c.profitUSD)}
                        </td>
                        <td className="py-1.5 text-right">
                          <ChangePct value={c.growthOrdersPct} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 overflow-x-auto">
                <h2 className="text-sm font-semibold mb-3">Vendor performance</h2>
                <table className="min-w-full text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="text-left py-1">Vendor</th>
                      <th className="text-right py-1">Orders</th>
                      <th className="text-right py-1">Revenue</th>
                      <th className="text-right py-1">Profit</th>
                      <th className="text-right py-1">Refund %</th>
                      <th className="text-right py-1">SKUs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.vendors.map((v) => (
                      <tr key={v.key} className="border-t border-slate-100">
                        <td className="py-1.5">{v.label}</td>
                        <td className="py-1.5 text-right tabular-nums">{v.orders}</td>
                        <td className="py-1.5 text-right tabular-nums">
                          {formatMoney(v.revenueUSD, "USD")}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {moneyOrDash(v.profitUSD)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {v.refundRatePct != null ? `${v.refundRatePct}%` : "—"}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">{v.productCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "compare" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Select 2–5 products on the All products tab, then compare. Or use the button after
                selecting.
              </p>
              {selected.length >= 2 && compareRows.length === 0 && (
                <button
                  type="button"
                  onClick={() => void runCompare()}
                  className="rounded bg-[#183a68] text-white px-3 py-1.5 text-sm"
                >
                  Load comparison
                </button>
              )}
              {compareRows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left">Metric</th>
                        {compareRows.map((r) => (
                          <th key={r.productSlug} className="p-2 text-left">
                            <ProductLink slug={r.productSlug} name={r.name} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        [
                          ["Orders", (r: ProductSalesRow) => String(r.orders)],
                          ["Units", (r) => String(r.unitsSold)],
                          ["Net revenue", (r) => formatMoney(r.netSalesUSD, "USD")],
                          ["Est. profit", (r) => moneyOrDash(r.estimatedProfitUSD)],
                          [
                            "Margin",
                            (r) => (r.profitMarginPct != null ? `${r.profitMarginPct}%` : "—"),
                          ],
                          [
                            "Order growth",
                            (r) =>
                              r.periodChange.orders != null
                                ? `${r.periodChange.orders}%`
                                : "—",
                          ],
                          [
                            "Refund rate",
                            (r) => (r.refundRatePct != null ? `${r.refundRatePct}%` : "—"),
                          ],
                          ["Inventory", (r) => String(r.inventory ?? "—")],
                          ["Growth score", (r) => String(r.growthScore)],
                          [
                            "Rating",
                            (r) =>
                              r.ratingValue != null
                                ? `${r.ratingValue} (${r.reviewCount ?? 0})`
                                : "—",
                          ],
                        ] as [string, (r: ProductSalesRow) => string][]
                      ).map(([label, fn]) => (
                        <tr key={label} className="border-t">
                          <td className="p-2 font-medium text-slate-600">{label}</td>
                          {compareRows.map((r) => (
                            <td key={r.productSlug} className="p-2 tabular-nums">
                              {fn(r)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "alerts" && (
            <div className="space-y-2">
              {!summary.alerts.length ? (
                <p className="text-sm text-slate-500">No smart alerts for this period.</p>
              ) : (
                summary.alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      a.severity === "critical"
                        ? "border-red-200 bg-red-50 text-red-900"
                        : a.severity === "warning"
                          ? "border-amber-200 bg-amber-50 text-amber-950"
                          : "border-sky-200 bg-sky-50 text-sky-950"
                    }`}
                  >
                    <Link
                      href={`/admin/product-sales/${encodeURIComponent(a.productSlug)}`}
                      className="font-medium hover:underline"
                    >
                      {a.productName}
                    </Link>
                    <span className="mx-2 text-[10px] uppercase opacity-70">{a.type}</span>
                    <p className="mt-0.5">{a.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductSalesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500 p-4">Loading…</p>}>
      <ProductSalesPageInner />
    </Suspense>
  );
}
