"use client";

import { useCallback, useEffect, useState } from "react";
import { resolveDefaultShoppingCountry } from "@blossompot/shared";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  GLOBAL_COUNTRY_REQUIRED_MESSAGE,
  applyStoredGlobalCountries,
  filterCountryChoices,
  formatDeliveryCountryList,
  globalCountrySaveRequest,
  toggleCountryChoice,
  type CountryChoice,
} from "@/lib/admin-country-management";

type GlobalCountryResponse = {
  source: "config" | "default";
  updatedAt: string | null;
  updatedBy?: string;
  defaultCountry?: string;
  countries: { countryCode: string; enabled: boolean; name: string | null }[];
};

export default function AdminCountriesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<CountryChoice[]>([]);
  const [defaultCountry, setDefaultCountry] = useState("US");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await api<GlobalCountryResponse>("/admin/catalog-countries", { token });
    const nextRows = applyStoredGlobalCountries(data.countries);
    setRows(nextRows);
    setDefaultCountry(
      resolveDefaultShoppingCountry(
        nextRows.map((row) => ({ countryCode: row.countryCode, enabled: row.selected })),
        data.defaultCountry
      ) ?? "US"
    );
    setSource(data.source);
    setLoaded(true);
  }, [token]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load countries"));
  }, [load]);

  const visible = filterCountryChoices(rows, query);
  const enabledCodes = rows.filter((row) => row.selected).map((row) => row.countryCode);
  const saveRequest = rows.length > 0 ? globalCountrySaveRequest(rows, defaultCountry) : null;
  const enabledRows = rows.filter((row) => row.selected);
  const saveBlocked = saveRequest != null && "error" in saveRequest;

  async function save() {
    if (!token || !saveRequest || "error" in saveRequest) {
      setError(saveRequest && "error" in saveRequest ? saveRequest.error : GLOBAL_COUNTRY_REQUIRED_MESSAGE);
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      await api(saveRequest.path, {
        method: saveRequest.method,
        token,
        body: JSON.stringify(saveRequest.body),
      });
      await load();
      setSaved("Saved. The storefront country selector is still United States only.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Global Target Countries</h1>
        <p className="mt-1 text-sm text-slate-600">
          Countries BlossomPot currently wants to offer to customers. This is separate from the
          countries a vendor can deliver to.
        </p>
      </div>

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        Saving here does not change vendor delivery countries, Orange County ZIP rules, or the
        customer country selector. The storefront stays United States only until a later phase.
      </p>

      {source === "default" ? (
        <p className="text-xs text-slate-500">Using the built-in default: United States enabled.</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <label className="block max-w-md text-sm">
        <span className="mb-1 block text-slate-600">Search countries</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="United Kingdom, Canada, Australia…"
          className="w-full rounded-lg border px-3 py-2"
        />
      </label>

      <p className="text-sm text-slate-600">
        Enabled: {enabledCodes.length > 0 ? formatDeliveryCountryList(enabledCodes) : "none"}
      </p>

      <label className="block max-w-md text-sm">
        <span className="mb-1 block text-slate-600">Homepage default country</span>
        <select
          value={enabledRows.some((row) => row.countryCode === defaultCountry) ? defaultCountry : ""}
          onChange={(event) => {
            setDefaultCountry(event.target.value);
            setSaved(null);
          }}
          className="w-full rounded-lg border px-3 py-2"
        >
          {enabledRows.map((row) => (
            <option key={row.countryCode} value={row.countryCode}>
              {row.countryName} ({row.countryCode})
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          Indexable homepage SEO uses this enabled country. A shopper&apos;s selected country still controls products.
        </span>
      </label>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">ISO</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.countryCode} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">{row.countryName}</td>
                <td className="px-4 py-3">{row.countryCode}</td>
                <td className="px-4 py-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(event) => {
                        const next = toggleCountryChoice(rows, row.countryCode, event.target.checked);
                        setRows(next);
                        setDefaultCountry(
                          resolveDefaultShoppingCountry(
                            next.map((choice) => ({
                              countryCode: choice.countryCode,
                              enabled: choice.selected,
                            })),
                            defaultCountry
                          ) ?? ""
                        );
                        setSaved(null);
                      }}
                    />
                    {row.selected ? "Enabled" : "Disabled"}
                  </label>
                </td>
              </tr>
            ))}
            {loaded && visible.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={3}>
                  No countries match that search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {saveBlocked ? <p className="text-sm text-red-600">{saveRequest.error}</p> : null}

      <button
        type="button"
        onClick={() => void save()}
        disabled={busy || !loaded || saveBlocked}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save"}
      </button>
      {saved ? <p className="text-sm text-green-700">{saved}</p> : null}
    </div>
  );
}
