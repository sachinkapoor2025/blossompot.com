"use client";

import { useCallback, useState } from "react";
import { useApiClient } from "@/lib/auth-context";

const PUBLIC_GBO_BASE = "https://gbo.blossompot.com";

type ProxyResponse = {
  action: string;
  publicBaseUrl?: string;
  gboPath?: string;
  tokenConfigured?: boolean;
  statusCode?: number;
  body?: unknown;
  result?: unknown;
  orderId?: string;
  orderNumber?: string;
};

type ResultState = {
  label: string;
  ok: boolean;
  data: ProxyResponse | null;
  error: string;
  at: string;
};

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function GboApiPanel() {
  const api = useApiClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);

  const [country, setCountry] = useState("US");
  const [category, setCategory] = useState("");
  const [productId, setProductId] = useState("");
  const [gboOrderId, setGboOrderId] = useState("");
  const [blossompotOrderId, setBlossompotOrderId] = useState("");

  const run = useCallback(
    async (label: string, path: string, options: RequestInit = {}) => {
      setBusy(label);
      setResult(null);
      try {
        const data = await api<ProxyResponse>(path, options);
        setResult({
          label,
          ok: true,
          data,
          error: "",
          at: new Date().toISOString(),
        });
      } catch (err) {
        setResult({
          label,
          ok: false,
          data: null,
          error: err instanceof Error ? err.message : "Request failed",
          at: new Date().toISOString(),
        });
      } finally {
        setBusy(null);
      }
    },
    [api]
  );

  const iso = country.trim().toUpperCase() || "US";
  const vendorStatus = result?.data?.statusCode ?? 0;
  const statusClass =
    !result
      ? ""
      : !result.ok
        ? "text-red-300"
        : vendorStatus >= 400
          ? "text-amber-300"
          : "text-emerald-300";

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Gift Baskets Overseas API</h2>
        <p className="mt-1 text-sm text-slate-600">
          Exercise the GBO partner catalog and order APIs from Admin. The partner token stays on
          the server. Dedicated wrapper base URL (for integrations):{" "}
          <code className="font-mono text-nav">{PUBLIC_GBO_BASE}</code>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">A — Health</h2>
          <p className="mt-1 text-xs text-slate-500">Checks GBO_API_TOKEN and lists countries</p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run("Health", "/admin/gbo/health")}
            className="mt-3 w-full rounded-lg bg-nav px-3 py-2.5 text-sm font-semibold text-white hover:bg-nav/90 disabled:opacity-50"
          >
            {busy === "Health" ? "Running…" : "Run Health"}
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">B — Countries</h2>
          <p className="mt-1 text-xs text-slate-500">GET /countries</p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run("Countries", "/admin/gbo/countries")}
            className="mt-3 w-full rounded-lg bg-nav px-3 py-2.5 text-sm font-semibold text-white hover:bg-nav/90 disabled:opacity-50"
          >
            {busy === "Countries" ? "Running…" : "List countries"}
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">C — Categories &amp; gifts</h2>
          <label className="mt-3 block text-xs text-slate-600">
            Destination country (ISO-2)
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              maxLength={2}
            />
          </label>
          <label className="mt-3 block text-xs text-slate-600">
            Category code (optional)
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Gourmet-Gift-Baskets"
            />
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                void run("Categories", `/admin/gbo/categories?country=${encodeURIComponent(iso)}`)
              }
              className="flex-1 rounded-lg bg-nav px-3 py-2.5 text-sm font-semibold text-white hover:bg-nav/90 disabled:opacity-50"
            >
              {busy === "Categories" ? "Running…" : "List categories"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                const qs = new URLSearchParams({ country: iso });
                if (category.trim()) qs.set("category", category.trim());
                void run("Gifts", `/admin/gbo/gifts?${qs.toString()}`);
              }}
              className="flex-1 rounded-lg bg-nav px-3 py-2.5 text-sm font-semibold text-white hover:bg-nav/90 disabled:opacity-50"
            >
              {busy === "Gifts" ? "Running…" : "List gifts"}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">D — Gift details</h2>
          <label className="mt-3 block text-xs text-slate-600">
            GBO product id
            <input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="10215"
            />
          </label>
          <button
            type="button"
            disabled={busy !== null || !productId.trim()}
            onClick={() =>
              void run(
                "Gift detail",
                `/admin/gbo/gifts/${encodeURIComponent(productId.trim())}?country=${encodeURIComponent(iso)}`
              )
            }
            className="mt-3 w-full rounded-lg bg-nav px-3 py-2.5 text-sm font-semibold text-white hover:bg-nav/90 disabled:opacity-50"
          >
            {busy === "Gift detail" ? "Running…" : "Get gift"}
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">E — GBO order details</h2>
          <label className="mt-3 block text-xs text-slate-600">
            Partner order id (numeric we sent GBO)
            <input
              value={gboOrderId}
              onChange={(e) => setGboOrderId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="110001"
            />
          </label>
          <button
            type="button"
            disabled={busy !== null || !gboOrderId.trim()}
            onClick={() =>
              void run("Get GBO order", `/admin/gbo/orders/${encodeURIComponent(gboOrderId.trim())}`)
            }
            className="mt-3 w-full rounded-lg bg-nav px-3 py-2.5 text-sm font-semibold text-white hover:bg-nav/90 disabled:opacity-50"
          >
            {busy === "Get GBO order" ? "Running…" : "Get GBO order"}
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">F — BlossomPot order → GBO</h2>
          <p className="mt-1 text-xs text-slate-500">
            Place or sync a paid BlossomPot order that contains Gift Baskets Overseas lines (`gbo:US:123` SKUs).
          </p>
          <label className="mt-3 block text-xs text-slate-600">
            BlossomPot order id or US##### / OC#####
            <input
              value={blossompotOrderId}
              onChange={(e) => setBlossompotOrderId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="US10042"
            />
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={busy !== null || !blossompotOrderId.trim()}
              onClick={() =>
                void run(
                  "Place with GBO",
                  `/admin/gbo/orders/${encodeURIComponent(blossompotOrderId.trim())}/place`,
                  { method: "POST" }
                )
              }
              className="flex-1 rounded-lg bg-nav px-3 py-2.5 text-sm font-semibold text-white hover:bg-nav/90 disabled:opacity-50"
            >
              {busy === "Place with GBO" ? "Running…" : "Place with GBO"}
            </button>
            <button
              type="button"
              disabled={busy !== null || !blossompotOrderId.trim()}
              onClick={() =>
                void run(
                  "Sync GBO tracking",
                  `/admin/gbo/orders/${encodeURIComponent(blossompotOrderId.trim())}/sync`,
                  { method: "POST" }
                )
              }
              className="flex-1 rounded-lg bg-nav px-3 py-2.5 text-sm font-semibold text-white hover:bg-nav/90 disabled:opacity-50"
            >
              {busy === "Sync GBO tracking" ? "Running…" : "Sync tracking"}
            </button>
          </div>
        </section>
      </div>

      {result && (
        <pre className={`mt-6 overflow-auto rounded-xl bg-slate-900 p-4 text-xs ${statusClass || "text-slate-100"}`}>
          {result.error ? result.error : pretty(result.data)}
        </pre>
      )}
    </div>
  );
}
