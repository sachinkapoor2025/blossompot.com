"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CATALOG_INTEGRATION_TYPES, CATALOG_STORAGE_LABEL, type CatalogIntegrationType } from "@blossompot/shared";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  VENDOR_COUNTRY_REQUIRED_MESSAGE,
  applyVendorDeliveryCountries,
  filterCountryChoices,
  toggleCountryChoice,
  vendorCountrySaveRequest,
  type CountryChoice,
} from "@/lib/admin-country-management";
import {
  VENDOR_DEFAULT_INVENTORY_HELP,
  VENDOR_DELIVERY_HELP,
  VENDOR_SLUG_HELP,
  VENDOR_STATUS_HELP,
  VENDOR_STORAGE_HELP,
  integrationSettingsNote,
} from "@/lib/admin-vendor-management";

type Vendor = {
  vendorSlug: string;
  vendorName: string;
  enabled: boolean;
  integrationType: CatalogIntegrationType;
  deliveryCountries: string[];
  sourceName?: string;
  defaultInventory?: number;
  trashedAt?: string;
  productCount: number;
  storage: string;
};

export default function AdminVendorManagePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { token } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [integrationType, setIntegrationType] = useState<CatalogIntegrationType>("owned");
  const [sourceName, setSourceName] = useState("");
  const [defaultInventory, setDefaultInventory] = useState("");
  const [deliveryRows, setDeliveryRows] = useState<CountryChoice[]>([]);
  const [countryQuery, setCountryQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !slug) return;
    const data = await api<{ vendor: Vendor }>(`/admin/catalog-vendors/${slug}`, { token });
    setVendor(data.vendor);
    setName(data.vendor.vendorName);
    setEnabled(data.vendor.enabled);
    setIntegrationType(data.vendor.integrationType);
    setSourceName(data.vendor.sourceName ?? "");
    setDefaultInventory(data.vendor.defaultInventory == null ? "" : String(data.vendor.defaultInventory));
    setDeliveryRows(applyVendorDeliveryCountries(data.vendor.deliveryCountries));
  }, [slug, token]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load vendor"));
  }, [load]);

  const visibleCountries = filterCountryChoices(deliveryRows, countryQuery);
  const saveRequest = vendor ? vendorCountrySaveRequest(vendor.vendorSlug, enabled, deliveryRows) : null;

  async function save() {
    if (!token || !vendor || !saveRequest || "error" in saveRequest) {
      setError(saveRequest && "error" in saveRequest ? saveRequest.error : VENDOR_COUNTRY_REQUIRED_MESSAGE);
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const inventory = defaultInventory.trim() === "" ? null : Number(defaultInventory);
      await api(saveRequest.path, {
        method: "PUT",
        token,
        body: JSON.stringify({
          ...saveRequest.body,
          vendorName: name,
          integrationType,
          sourceName,
          defaultInventory: inventory,
        }),
      });
      await load();
      setSaved("Saved. Existing product inventory and vendor slugs were not changed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!vendor) {
    return <p className="text-sm text-slate-600">{error ?? "Loading vendor…"}</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/vendors" className="text-sm text-nav underline">
          Vendor Management
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-primary">{vendor.vendorName}</h1>
      </div>
      {vendor.trashedAt ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          This vendor is in Trash and stays disabled until you restore it.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saved ? <p className="text-sm text-green-700">{saved}</p> : null}

      <section className="space-y-4 rounded-xl border bg-white p-4">
        <label className="block text-sm">
          Vendor Name
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Vendor Slug
          <input value={vendor.vendorSlug} readOnly className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2" />
          <span className="mt-1 block text-xs text-slate-500">{VENDOR_SLUG_HELP}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            disabled={Boolean(vendor.trashedAt)}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Status: {enabled ? "Enabled" : "Disabled"}
        </label>
        <p className="text-xs text-slate-500">{VENDOR_STATUS_HELP}</p>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Delivery Countries</h2>
          <p className="text-xs text-slate-500">{VENDOR_DELIVERY_HELP}</p>
          <input
            value={countryQuery}
            onChange={(event) => setCountryQuery(event.target.value)}
            placeholder="Search countries"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <div className="grid max-h-48 grid-cols-2 gap-2 overflow-auto text-sm">
            {visibleCountries.map((country) => (
              <label key={country.countryCode} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={country.selected}
                  onChange={(event) => setDeliveryRows(toggleCountryChoice(deliveryRows, country.countryCode, event.target.checked))}
                />
                {country.countryName}
              </label>
            ))}
          </div>
        </div>

        <label className="block text-sm">
          Integration Type / Method
          <select
            value={integrationType}
            onChange={(event) => setIntegrationType(event.target.value as CatalogIntegrationType)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            {CATALOG_INTEGRATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === "owned" ? "Manual" : type === "partner-api" ? "API" : type === "excel" ? "Excel" : "JSON/Bundle"}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Source
          <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Storage
          <input value={vendor.storage || CATALOG_STORAGE_LABEL} readOnly className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2" />
          <span className="mt-1 block text-xs text-slate-500">{VENDOR_STORAGE_HELP}</span>
        </label>
        <p className="text-sm">
          Product Count: <span className="font-semibold">{vendor.productCount}</span>
        </p>
        <label className="block text-sm">
          Default Inventory
          <input
            value={defaultInventory}
            onChange={(event) => setDefaultInventory(event.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
          <span className="mt-1 block text-xs text-slate-500">{VENDOR_DEFAULT_INVENTORY_HELP}</span>
        </label>
        <p className="text-sm">
          <Link href={`/admin/products?vendor=${vendor.vendorSlug}`} className="font-medium text-nav underline">
            View Products
          </Link>
        </p>
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <h2 className="font-semibold">Integration Settings</h2>
          <p className="mt-1">{integrationSettingsNote(integrationType)}</p>
          {integrationType === "partner-api" ? (
            <p className="mt-2">
              <Link href="/admin/vendor-management?tab=gbo" className="text-nav underline">
                GBO API
              </Link>
              {" · "}
              <Link href="/admin/vendor-management?tab=api" className="text-nav underline">
                Vendor API
              </Link>
            </p>
          ) : null}
        </div>
        <button type="button" disabled={busy} onClick={() => void save()} className="rounded-lg bg-nav px-4 py-2 text-sm text-white">
          Save
        </button>
      </section>
    </div>
  );
}
