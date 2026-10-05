"use client";

import { useCallback, useEffect, useState } from "react";
import { CATALOG_INTEGRATION_LABELS, type CatalogIntegrationType } from "@blossompot/shared";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

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
    setSaved(null);
    setError(null);
  }

  async function save() {
    if (!token || !current) return;
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      await api(`/admin/catalog-vendors/${current.vendorSlug}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ enabled, deliveryCountries: ["US"] }),
      });
      await load();
      setSaved("Saved. Customer product lists are unchanged until vendor visibility is turned on.");
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
                  {vendor.deliveryCountries.length === 1 && vendor.deliveryCountries[0] === "US"
                    ? "United States"
                    : vendor.deliveryCountries.join(", ") || "—"}
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
        <section className="max-w-xl space-y-4 rounded-xl border bg-white p-4">
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

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked disabled readOnly />
            United States
          </label>
          <p className="text-xs text-slate-500">Additional countries are not available yet.</p>

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

          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
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
