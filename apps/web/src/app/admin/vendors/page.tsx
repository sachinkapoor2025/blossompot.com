"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CATALOG_INTEGRATION_LABELS, type CatalogIntegrationType } from "@blossompot/shared";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  VENDOR_COUNTRY_REQUIRED_MESSAGE,
  VENDOR_GLOBAL_COUNTRY_NOTE,
  applyVendorDeliveryCountries,
  filterCountryChoices,
  formatDeliveryCountryList,
  toggleCountryChoice,
  vendorCountrySaveRequest,
  type CountryChoice,
} from "@/lib/admin-country-management";

type CatalogVendorRow = {
  vendorSlug: string;
  vendorName: string;
  enabled: boolean;
  integrationType: CatalogIntegrationType;
  deliveryCountries: string[];
  updatedAt: string | null;
  updatedBy?: string;
  source: "config" | "default";
  productCount: number | null;
  shoppingAvailable: boolean;
  storefrontEnvEnabled: boolean | null;
  storefrontBlockReason: string | null;
};

type ListResponse = {
  vendors: CatalogVendorRow[];
  productCountAvailable: boolean;
  productCountNote: string;
};

export default function AdminCatalogVendorsPage() {
  const { token } = useAuth();
  const [vendors, setVendors] = useState<CatalogVendorRow[]>([]);
  const [countNote, setCountNote] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [deliveryRows, setDeliveryRows] = useState<CountryChoice[]>([]);
  const [countryQuery, setCountryQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await api<ListResponse>("/admin/catalog-vendors", { token });
    setVendors(data.vendors);
    setCountNote(data.productCountAvailable ? null : data.productCountNote);
  }, [token]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load vendors"));
  }, [load]);

  const current = vendors.find((vendor) => vendor.vendorSlug === selected) ?? null;

  function openManage(vendor: CatalogVendorRow) {
    setSelected(vendor.vendorSlug);
    setEnabled(vendor.enabled);
    setDeliveryRows(applyVendorDeliveryCountries(vendor.deliveryCountries));
    setCountryQuery("");
    setSaved(null);
    setError(null);
  }

  const visibleCountries = filterCountryChoices(deliveryRows, countryQuery);
  const selectedCodes = deliveryRows.filter((row) => row.selected).map((row) => row.countryCode);
  const saveRequest = current ? vendorCountrySaveRequest(current.vendorSlug, enabled, deliveryRows) : null;
  const saveBlocked = saveRequest != null && "error" in saveRequest;

  async function save() {
    if (!token || !current || !saveRequest || "error" in saveRequest) {
      setError(saveRequest && "error" in saveRequest ? saveRequest.error : VENDOR_COUNTRY_REQUIRED_MESSAGE);
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const savedVendor = await api<{ vendor: CatalogVendorRow }>(saveRequest.path, {
        method: saveRequest.method,
        token,
        body: JSON.stringify(saveRequest.body),
      });
      await load();
      setEnabled(savedVendor.vendor.enabled);
      setDeliveryRows(applyVendorDeliveryCountries(savedVendor.vendor.deliveryCountries));
      setSaved("Saved. This vendor's delivery countries are stored. Customers can still select only the United States.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Vendors</h1>
        <p className="mt-1 text-sm text-slate-600">
          Catalog sources for BlossomPot, Orange County, Gift Baskets Overseas, and FNP. Marketplace
          applications stay on Marketplace vendors.
        </p>
      </div>

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        Enable and disable controls new shopping. It does not change Orange County ZIP rules, existing
        orders, or the country selector.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Integration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Countries</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.vendorSlug} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">{vendor.vendorName}</td>
                <td className="px-4 py-3">{CATALOG_INTEGRATION_LABELS[vendor.integrationType]}</td>
                <td className="px-4 py-3">
                  <p>{vendor.enabled ? "Enabled" : "Disabled"}</p>
                  {vendor.vendorSlug === "gift-baskets-overseas" ? (
                    <p className="text-xs text-slate-500">
                      Catalog: {vendor.enabled ? "Enabled" : "Disabled"}
                      <br />
                      Storefront: {vendor.storefrontBlockReason ?? "Available"}
                    </p>
                  ) : null}
                  {vendor.source === "default" ? (
                    <p className="text-xs text-slate-500">Using built-in default</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {vendor.deliveryCountries.length > 0
                    ? formatDeliveryCountryList(vendor.deliveryCountries)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">{vendor.productCount ?? "—"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openManage(vendor)}
                    className="text-sm font-medium text-nav underline"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {countNote ? <p className="text-xs text-slate-500">{countNote}</p> : null}

      {current ? (
        <section className="max-w-2xl space-y-4 rounded-xl border bg-white p-4">
          <h2 className="text-lg font-semibold">{current.vendorName}</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Integration</dt>
            <dd>{CATALOG_INTEGRATION_LABELS[current.integrationType]}</dd>
            <dt className="text-slate-500">Slug</dt>
            <dd>{current.vendorSlug}</dd>
          </dl>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            {enabled ? "Enabled" : "Disabled"}
          </label>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Delivery Countries</h3>
            <p className="text-xs text-slate-500">
              Countries this vendor can deliver to. {VENDOR_GLOBAL_COUNTRY_NOTE}{" "}
              <Link href="/admin/countries" className="font-medium text-nav underline">
                Global Target Countries
              </Link>
            </p>
            <p className="text-sm text-slate-600">
              Selected: {selectedCodes.length > 0 ? formatDeliveryCountryList(selectedCodes) : "none"}
            </p>
            <label className="block text-sm">
              <span className="sr-only">Search delivery countries</span>
              <input
                type="search"
                value={countryQuery}
                onChange={(event) => setCountryQuery(event.target.value)}
                placeholder="Search countries"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border px-3 py-2">
              {visibleCountries.map((row) => (
                <label key={row.countryCode} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(event) => {
                      setDeliveryRows((currentRows) =>
                        toggleCountryChoice(currentRows, row.countryCode, event.target.checked)
                      );
                      setSaved(null);
                    }}
                  />
                  <span>
                    {row.countryName}{" "}
                    <span className="text-slate-500">{row.countryCode}</span>
                  </span>
                </label>
              ))}
              {visibleCountries.length === 0 ? (
                <p className="text-sm text-slate-500">No countries match that search.</p>
              ) : null}
            </div>
          </div>

          {current.vendorSlug === "gift-baskets-overseas" ? (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p>Catalog: {enabled ? "Enabled" : "Disabled"}</p>
              <p>
                Storefront: {current.storefrontBlockReason ?? "Available"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                The environment flag cannot be changed here. Saving Enabled is allowed while the
                storefront stays blocked.
              </p>
            </div>
          ) : null}

          {saveBlocked ? <p className="text-sm text-red-600">{saveRequest.error}</p> : null}

          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || saveBlocked}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          {saved ? <p className="text-sm text-green-700">{saved}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
