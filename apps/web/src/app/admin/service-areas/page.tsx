"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SERVICE_SCOPES, SERVICE_RULE_TYPES, type VendorServiceArea } from "@blossompot/shared";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type Summary = {
  vendors: number;
  vendorsWithAreas: number;
  countries: number;
  states: number;
  postalCodeRules: number;
  prefixRules: number;
  totalRules: number;
};

type MarketplaceVendor = { vendorSlug: string; businessName: string; status: string };

const BUILTIN = [
  { vendorSlug: "blossompot", businessName: "BlossomPot (nationwide US default)" },
  { vendorSlug: "orange-county", businessName: "Orange County vendor" },
];

const emptyForm = {
  countryCode: "US",
  scope: "POSTAL_CODE" as (typeof SERVICE_SCOPES)[number],
  ruleType: "ALLOW" as (typeof SERVICE_RULE_TYPES)[number],
  stateCode: "",
  city: "",
  postalCode: "",
  postalPrefix: "",
  radius: "",
  radiusUnit: "mi" as "mi" | "km",
  isActive: true,
};

function AdminServiceAreasPageInner() {
  const { token } = useAuth();
  const search = useSearchParams();
  const [vendorSlug, setVendorSlug] = useState(search.get("vendor") ?? "blossompot");
  const [vendors, setVendors] = useState<MarketplaceVendor[]>([]);
  const [areas, setAreas] = useState<VendorServiceArea[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [testPostal, setTestPostal] = useState("90012");
  const [testCountry, setTestCountry] = useState("US");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([]);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [ruleFilter, setRuleFilter] = useState("");

  const vendorOptions = useMemo(
    () => [
      ...BUILTIN,
      ...vendors.map((v) => ({ vendorSlug: v.vendorSlug, businessName: `${v.businessName} (${v.status})` })),
    ],
    [vendors]
  );

  const load = useCallback(async () => {
    if (!token) return;
    const [areaRes, sumRes, vendorRes] = await Promise.all([
      api<{ areas: VendorServiceArea[] }>(`/admin/vendors/${encodeURIComponent(vendorSlug)}/service-areas`, {
        token,
      }),
      api<{ summary: Summary }>("/admin/serviceability/summary", { token }),
      api<{ vendors: MarketplaceVendor[] }>("/admin/marketplace/vendors", { token }).catch(() => ({
        vendors: [] as MarketplaceVendor[],
      })),
    ]);
    setAreas(areaRes.areas);
    setSummary(sumRes.summary);
    setVendors(vendorRes.vendors);
  }, [token, vendorSlug]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  const filtered = areas.filter((a) => {
    if (ruleFilter && a.ruleType !== ruleFilter) return false;
    if (!q) return true;
    const hay = `${a.countryCode} ${a.stateCode ?? ""} ${a.city ?? ""} ${a.postalCode ?? ""} ${a.postalPrefix ?? ""} ${a.scope}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const createArea = async () => {
    if (!token) return;
    setError(null);
    await api(`/admin/vendors/${encodeURIComponent(vendorSlug)}/service-areas`, {
      method: "POST",
      token,
      body: JSON.stringify({
        countryCode: form.countryCode,
        scope: form.scope,
        ruleType: form.ruleType,
        isActive: form.isActive,
        ...(form.stateCode ? { stateCode: form.stateCode } : {}),
        ...(form.city ? { city: form.city } : {}),
        ...(form.postalCode ? { postalCode: form.postalCode } : {}),
        ...(form.postalPrefix ? { postalPrefix: form.postalPrefix } : {}),
        ...(form.scope === "RADIUS" && form.radius
          ? { radius: Number(form.radius), radiusUnit: form.radiusUnit }
          : {}),
      }),
    });
    setForm(emptyForm);
    await load();
  };

  const toggleArea = async (area: VendorServiceArea) => {
    if (!token) return;
    await api(`/admin/vendors/${encodeURIComponent(vendorSlug)}/service-areas/${area.areaId}`, {
      method: "PUT",
      token,
      body: JSON.stringify({ isActive: !area.isActive }),
    });
    await load();
  };

  const deleteArea = async (areaId: string) => {
    if (!token || !confirm("Delete this service area?")) return;
    await api(`/admin/vendors/${encodeURIComponent(vendorSlug)}/service-areas/${areaId}`, {
      method: "DELETE",
      token,
    });
    await load();
  };

  const runTest = async () => {
    if (!token) return;
    setTestResult(null);
    const r = await api<{ serviceable: boolean; description: string; reason: string }>(
      "/admin/serviceability/test",
      {
        method: "POST",
        token,
        body: JSON.stringify({
          vendorSlug,
          countryCode: testCountry,
          postalCode: testPostal,
        }),
      }
    );
    setTestResult(
      r.serviceable
        ? `SERVICEABLE — ${r.description}`
        : `NOT SERVICEABLE — ${r.description || r.reason}`
    );
  };

  const parseCsv = () => {
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      setCsvPreview([]);
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = cols[i] ?? "";
      });
      return row;
    });
    setCsvPreview(rows);
    setImportResult(null);
  };

  const importCsv = async () => {
    if (!token || !csvPreview.length) return;
    const r = await api<{ imported: number; failed: number; errors: { row: number; error: string }[] }>(
      `/admin/vendors/${encodeURIComponent(vendorSlug)}/service-areas/import`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ rows: csvPreview }),
      }
    );
    setImportResult(`Imported ${r.imported}. Failed ${r.failed}.`);
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Vendor service areas</h1>
        <p className="text-sm text-slate-600 mt-1">
          Control which countries, states, cities, and postal codes each vendor can fulfill.
        </p>
      </div>

      {summary ? (
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ["Vendors", summary.vendors],
            ["With areas", summary.vendorsWithAreas],
            ["Countries", summary.countries],
            ["States", summary.states],
            ["ZIP rules", summary.postalCodeRules],
            ["Prefix rules", summary.prefixRules],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border bg-white p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <label className="block text-sm font-medium">
          Vendor
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={vendorSlug}
            onChange={(e) => setVendorSlug(e.target.value)}
          >
            {vendorOptions.map((v) => (
              <option key={v.vendorSlug} value={v.vendorSlug}>
                {v.businessName}
              </option>
            ))}
          </select>
        </label>

        <div className="grid sm:grid-cols-4 gap-2">
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Search areas"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="rounded border px-3 py-2 text-sm" value={ruleFilter} onChange={(e) => setRuleFilter(e.target.value)}>
            <option value="">All rules</option>
            <option value="ALLOW">Allow</option>
            <option value="DENY">Deny</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">Country</th>
                <th className="py-2 pr-3">State</th>
                <th className="py-2 pr-3">City</th>
                <th className="py-2 pr-3">Postal</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Rule</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.areaId} className="border-t">
                  <td className="py-2 pr-3">{a.countryCode}</td>
                  <td className="py-2 pr-3">{a.stateCode ?? "—"}</td>
                  <td className="py-2 pr-3">{a.city ?? "—"}</td>
                  <td className="py-2 pr-3">{a.postalCode ?? a.postalPrefix ?? "—"}</td>
                  <td className="py-2 pr-3">{a.scope}</td>
                  <td className="py-2 pr-3">{a.ruleType}</td>
                  <td className="py-2 pr-3">{a.isActive ? "Active" : "Off"}</td>
                  <td className="py-2 flex gap-2">
                    <button type="button" className="text-nav underline" onClick={() => toggleArea(a)}>
                      {a.isActive ? "Disable" : "Enable"}
                    </button>
                    <button type="button" className="text-red-600 underline" onClick={() => deleteArea(a.areaId)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? <p className="text-sm text-slate-500 py-3">No stored areas — defaults still apply until you add overrides.</p> : null}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Add service area</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm">
            Country
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.countryCode}
              onChange={(e) => setForm({ ...form, countryCode: e.target.value.toUpperCase() })}
            />
          </label>
          <label className="text-sm">
            Type
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value as typeof form.scope })}
            >
              {SERVICE_SCOPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Rule
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.ruleType}
              onChange={(e) => setForm({ ...form, ruleType: e.target.value as typeof form.ruleType })}
            >
              {SERVICE_RULE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {(form.scope === "STATE" || form.scope === "CITY" || form.scope === "POSTAL_CODE" || form.scope === "POSTAL_PREFIX") && (
            <label className="text-sm">
              State / province
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.stateCode}
                onChange={(e) => setForm({ ...form, stateCode: e.target.value.toUpperCase() })}
              />
            </label>
          )}
          {(form.scope === "CITY" || form.scope === "POSTAL_CODE") && (
            <label className="text-sm">
              City
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>
          )}
          {form.scope === "POSTAL_CODE" && (
            <label className="text-sm">
              Postal / ZIP
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              />
            </label>
          )}
          {form.scope === "POSTAL_PREFIX" && (
            <label className="text-sm">
              Postal prefix
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.postalPrefix}
                onChange={(e) => setForm({ ...form, postalPrefix: e.target.value })}
              />
            </label>
          )}
          {form.scope === "RADIUS" && (
            <>
              <label className="text-sm">
                Radius
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.radius}
                  onChange={(e) => setForm({ ...form, radius: e.target.value })}
                />
              </label>
              <label className="text-sm">
                Unit
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.radiusUnit}
                  onChange={(e) => setForm({ ...form, radiusUnit: e.target.value as "mi" | "km" })}
                >
                  <option value="mi">miles</option>
                  <option value="km">km</option>
                </select>
              </label>
            </>
          )}
        </div>
        <button type="button" className="rounded-full bg-primary px-5 py-2 text-sm text-white" onClick={() => createArea().catch((e) => setError(e.message))}>
          Add service area
        </button>
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Check vendor serviceability</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="rounded border px-3 py-2" value={testCountry} onChange={(e) => setTestCountry(e.target.value.toUpperCase())} />
          <input className="rounded border px-3 py-2" value={testPostal} onChange={(e) => setTestPostal(e.target.value)} placeholder="Postal / ZIP" />
          <button type="button" className="rounded-full border px-4 py-2 text-sm" onClick={() => runTest().catch((e) => setError(e.message))}>
            Check
          </button>
        </div>
        {testResult ? <p className="text-sm font-medium">{testResult}</p> : null}
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Bulk CSV upload</h2>
        <p className="text-xs text-slate-500">
          Headers: country_code,state_code,city,postal_code,postal_prefix,rule
        </p>
        <textarea
          className="w-full min-h-32 rounded border px-3 py-2 font-mono text-xs"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={"country_code,state_code,city,postal_code,rule\nUS,CA,Los Angeles,90001,ALLOW"}
        />
        <div className="flex gap-2">
          <button type="button" className="rounded-full border px-4 py-2 text-sm" onClick={parseCsv}>
            Preview
          </button>
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={!csvPreview.length}
            onClick={() => importCsv().catch((e) => setError(e.message))}
          >
            Import {csvPreview.length ? `(${csvPreview.length})` : ""}
          </button>
        </div>
        {csvPreview.length ? (
          <p className="text-xs text-slate-600">{csvPreview.length} rows ready. Invalid rows are reported after import; valid rows are saved.</p>
        ) : null}
        {importResult ? <p className="text-sm">{importResult}</p> : null}
      </div>
    </div>
  );
}

export default function AdminServiceAreasPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading service areas…</p>}>
      <AdminServiceAreasPageInner />
    </Suspense>
  );
}
