"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { CATALOG_INTEGRATION_TYPES, CATALOG_STORAGE_LABEL, type CatalogIntegrationType } from "@blossompot/shared";
import * as XLSX from "xlsx";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  applyVendorDeliveryCountries,
  filterCountryChoices,
  toggleCountryChoice,
  type CountryChoice,
} from "@/lib/admin-country-management";
import {
  ADD_PRODUCT_METHOD_LABELS,
  ADD_PRODUCT_METHODS,
  VENDOR_DEFAULT_INVENTORY_HELP,
  VENDOR_DELIVERY_HELP,
  VENDOR_SLUG_HELP,
  VENDOR_STATUS_HELP,
  VENDOR_STORAGE_HELP,
  integrationSettingsNote,
  productImportJsonTemplate,
  productImportWorkbookSheets,
  slugifyVendorName,
  type AddProductMethod,
} from "@/lib/admin-vendor-management";

type Vendor = {
  vendorSlug: string;
  vendorName: string;
  enabled: boolean;
  integrationType: CatalogIntegrationType;
  deliveryCountries?: string[];
  defaultInventory?: number;
  trashedAt?: string;
};

type ImportPreview = {
  ok: boolean;
  writes: false;
  batchErrors: string[];
  rows: Array<{ row: number; errors: string[]; name?: string; slug?: string; sku?: string; published?: boolean }>;
  imageValidation?: string;
};

const NEW_VENDOR = "__new__";

export default function AddProductPage() {
  const { token } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorCount, setVendorCount] = useState(0);
  const [vendorSlug, setVendorSlug] = useState("");
  const [creatingVendor, setCreatingVendor] = useState(false);
  const [method, setMethod] = useState<AddProductMethod>("manual");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importRows, setImportRows] = useState<Record<string, unknown>[]>([]);
  const [enabledCountries, setEnabledCountries] = useState<Array<{ countryCode: string; countryName: string }>>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [manual, setManual] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    currency: "USD",
    categorySlug: "",
    inventory: "",
    published: false,
    imageUrl: "",
  });
  const [draft, setDraft] = useState({
    vendorName: "",
    vendorSlug: "",
    integrationType: "owned" as CatalogIntegrationType,
    enabled: true,
    sourceName: "",
    defaultInventory: "200",
    displayPosition: "",
  });
  const [deliveryRows, setDeliveryRows] = useState<CountryChoice[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const [data, countries] = await Promise.all([
      api<{ vendors: Vendor[] }>("/admin/catalog-vendors", { token }),
      api<{ countries: Array<{ countryCode: string; countryName?: string; enabled: boolean }> }>("/admin/catalog-countries", { token }),
    ]);
    const active = data.vendors.filter((vendor) => !vendor.trashedAt);
    setVendorCount(data.vendors.length);
    setVendors(active);
    setEnabledCountries(
      countries.countries
        .filter((country) => country.enabled)
        .map((country) => ({ countryCode: country.countryCode, countryName: country.countryName || country.countryCode }))
    );
    setDeliveryRows(applyVendorDeliveryCountries(["US"]));
    setVendorSlug((current) => current || active[0]?.vendorSlug || "");
  }, [token]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load vendors"));
  }, [load]);

  const selected = vendors.find((vendor) => vendor.vendorSlug === vendorSlug) ?? null;
  const coveredKey = (selected?.deliveryCountries ?? []).join(",");
  const countryChoices = useMemo(() => {
    const covered = new Set(coveredKey.split(",").filter(Boolean).map((code) => code.toUpperCase()));
    return enabledCountries.filter((country) => covered.has(country.countryCode.toUpperCase()));
  }, [coveredKey, enabledCountries]);

  useEffect(() => {
    setSelectedCountries(countryChoices.map((country) => country.countryCode));
    setPreview(null);
    setImportRows([]);
  }, [countryChoices]);

  function chooseVendor(value: string) {
    setPreview(null);
    setMessage(null);
    if (value === NEW_VENDOR) {
      setCreatingVendor(true);
      setVendorSlug("");
      return;
    }
    setCreatingVendor(false);
    setVendorSlug(value);
    const vendor = vendors.find((row) => row.vendorSlug === value);
    if (vendor?.defaultInventory != null) {
      setManual((current) => ({ ...current, inventory: current.inventory || String(vendor.defaultInventory) }));
    }
  }

  async function createVendor() {
    if (!token) return;
    const slug = draft.vendorSlug || slugifyVendorName(draft.vendorName);
    const countries = deliveryRows.filter((row) => row.selected).map((row) => row.countryCode);
    setBusy(true);
    setError(null);
    try {
      const created = await api<{ vendor: Vendor }>("/admin/catalog-vendors", {
        method: "POST",
        token,
        body: JSON.stringify({
          vendorName: draft.vendorName,
          vendorSlug: slug,
          integrationType: draft.integrationType,
          deliveryCountries: countries,
          enabled: draft.enabled,
          sourceName: draft.sourceName || undefined,
          defaultInventory: draft.defaultInventory.trim() === "" ? undefined : Number(draft.defaultInventory),
          ...(draft.displayPosition ? { displayPosition: Number(draft.displayPosition) } : {}),
        }),
      });
      await load();
      setVendorSlug(created.vendor.vendorSlug);
      setCreatingVendor(false);
      setMessage(`${created.vendor.vendorName} was created and selected.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the vendor");
    } finally {
      setBusy(false);
    }
  }

  async function previewRows(rows: Record<string, unknown>[]) {
    if (!token || !selected) return;
    if (selectedCountries.length === 0) {
      setError("Select at least one delivery country for this vendor.");
      return;
    }
    setBusy(true);
    setError(null);
    setImportRows(rows);
    try {
      const result = await api<ImportPreview>("/admin/imports/products/preview", {
        method: "POST",
        token,
        body: JSON.stringify({
          vendorSlug: selected.vendorSlug,
          deliveryCountries: selectedCountries,
          rows,
        }),
      });
      setPreview(result);
      setMessage(null);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Could not preview the batch");
    } finally {
      setBusy(false);
    }
  }

  async function createManual(event: FormEvent) {
    event.preventDefault();
    const inventory = manual.inventory.trim() === "" ? undefined : Number(manual.inventory);
    await previewRows([
      {
        name: manual.name,
        description: manual.description,
        sku: manual.sku,
        price: Number(manual.price),
        currency: manual.currency,
        categorySlug: manual.categorySlug,
        ...(inventory != null ? { inventory } : {}),
        published: manual.published,
        ...(manual.imageUrl ? { imageUrls: manual.imageUrl } : {}),
      },
    ]);
  }

  async function readFile(file: File) {
    if (!selected) return;
    const buffer = await file.arrayBuffer();
    let records: Record<string, unknown>[] = [];
    if (file.name.endsWith(".json")) {
      const parsed = JSON.parse(new TextDecoder().decode(buffer)) as { products?: Record<string, unknown>[] } | Record<string, unknown>[];
      records = Array.isArray(parsed) ? parsed : parsed.products ?? [];
    } else {
      const book = XLSX.read(buffer, { type: "array" });
      const sheet = book.Sheets["Product Upload"] ?? book.Sheets[book.SheetNames[0] ?? ""];
      records = sheet ? (XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]) : [];
    }
    await previewRows(records);
  }

  function downloadTemplate(kind: "excel" | "json") {
    if (kind === "json") {
      const sample = productImportJsonTemplate();
      const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "blossompot-products.json";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    const sheets = productImportWorkbookSheets();
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(sheets.productUpload), "Product Upload");
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(sheets.instructions), "Instructions");
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(sheets.allowedValues), "Allowed Values");
    XLSX.writeFile(book, "blossompot-products.xlsx");
  }

  async function commitImport() {
    if (!token || !selected || !preview?.ok) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ created: number }>("/admin/imports/products/commit", {
        method: "POST",
        token,
        body: JSON.stringify({
          vendorSlug: selected.vendorSlug,
          deliveryCountries: selectedCountries,
          rows: importRows,
        }),
      });
      setMessage(`Imported ${result.created} unpublished product${result.created === 1 ? "" : "s"} for ${selected.vendorName}.`);
      setPreview(null);
      setImportRows([]);
      setManual({ name: "", sku: "", description: "", price: "", currency: "USD", categorySlug: "", inventory: "", published: false, imageUrl: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import was not saved");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm text-nav underline">
          All Products
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Add Product</h1>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">1. Select vendor</h2>
        <select value={creatingVendor ? NEW_VENDOR : vendorSlug} onChange={(event) => chooseVendor(event.target.value)} className="w-full rounded-lg border px-3 py-2">
          {vendors.map((vendor) => (
            <option key={vendor.vendorSlug} value={vendor.vendorSlug}>
              {vendor.vendorName}
            </option>
          ))}
          <option value={NEW_VENDOR}>+ Add New Vendor</option>
        </select>
        {creatingVendor ? (
          <div className="space-y-3">
            <label className="block text-sm">
              Vendor Name
              <input
                value={draft.vendorName}
                onChange={(event) => {
                  const vendorName = event.target.value;
                  setDraft((current) => ({ ...current, vendorName, vendorSlug: slugifyVendorName(vendorName) }));
                }}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Vendor Slug
              <input value={draft.vendorSlug} onChange={(event) => setDraft({ ...draft, vendorSlug: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              <span className="mt-1 block text-xs text-slate-500">{VENDOR_SLUG_HELP}</span>
            </label>
            <label className="block text-sm">
              Integration Type
              <select
                value={draft.integrationType}
                onChange={(event) => setDraft({ ...draft, integrationType: event.target.value as CatalogIntegrationType })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                {CATALOG_INTEGRATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === "owned" ? "Manual" : type === "partner-api" ? "API" : type === "excel" ? "Excel" : "JSON/Bundle"}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <p className="text-sm font-medium">Delivery Countries</p>
              <p className="text-xs text-slate-500">{VENDOR_DELIVERY_HELP}</p>
              <div className="mt-2 grid max-h-40 grid-cols-2 gap-2 overflow-auto text-sm">
                {filterCountryChoices(deliveryRows, "").map((country) => (
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
              Display order
              <select
                value={draft.displayPosition}
                onChange={(event) => setDraft({ ...draft, displayPosition: event.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                <option value="">At the end</option>
                {Array.from({ length: vendorCount + 1 }, (_, index) => (
                  <option key={index + 1} value={String(index + 1)}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
              Status: {draft.enabled ? "Enabled" : "Disabled"}
            </label>
            <p className="text-xs text-slate-500">{VENDOR_STATUS_HELP}</p>
            <label className="block text-sm">
              Default Inventory
              <input value={draft.defaultInventory} onChange={(event) => setDraft({ ...draft, defaultInventory: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              <span className="mt-1 block text-xs text-slate-500">{VENDOR_DEFAULT_INVENTORY_HELP}</span>
            </label>
            <label className="block text-sm">
              Source
              <input value={draft.sourceName} onChange={(event) => setDraft({ ...draft, sourceName: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="block text-sm">
              Storage
              <input value={CATALOG_STORAGE_LABEL} readOnly className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2" />
              <span className="mt-1 block text-xs text-slate-500">{VENDOR_STORAGE_HELP}</span>
            </label>
            <button type="button" disabled={busy || !draft.vendorName} onClick={() => void createVendor()} className="rounded-lg bg-nav px-4 py-2 text-sm text-white">
              Create vendor and continue
            </button>
          </div>
        ) : null}
      </section>

      {selected ? (
        <section className="space-y-3 rounded-xl border bg-white p-4">
          <h2 className="font-semibold">2. Delivery countries for {selected.vendorName}</h2>
          <p className="text-xs text-slate-500">
            Only countries that are globally enabled and already on this vendor are listed. This selection cannot add a country the vendor does not deliver to.
          </p>
          {countryChoices.length === 0 ? (
            <p className="text-sm text-red-600">This vendor has no globally enabled delivery country.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {countryChoices.map((country) => (
                <label key={country.countryCode} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCountries.includes(country.countryCode)}
                    onChange={(event) => {
                      setPreview(null);
                      setSelectedCountries((current) =>
                        event.target.checked
                          ? [...current, country.countryCode]
                          : current.filter((code) => code !== country.countryCode)
                      );
                    }}
                  />
                  {country.countryName} ({country.countryCode})
                </label>
              ))}
            </div>
          )}
          <h2 className="font-semibold">3. Add products for {selected.vendorName}</h2>
          <div className="flex flex-wrap gap-2">
            {ADD_PRODUCT_METHODS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMethod(item);
                  setPreview(null);
                }}
                className={`rounded-lg px-3 py-2 text-sm ${method === item ? "bg-nav text-white" : "border"}`}
              >
                {ADD_PRODUCT_METHOD_LABELS[item]}
              </button>
            ))}
          </div>

          {method === "manual" ? (
            <form onSubmit={(event) => void createManual(event)} className="space-y-3">
              <input required placeholder="Name" value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} className="w-full rounded-lg border px-3 py-2" />
              <input required placeholder="SKU" value={manual.sku} onChange={(event) => setManual({ ...manual, sku: event.target.value })} className="w-full rounded-lg border px-3 py-2" />
              <textarea required placeholder="Description" value={manual.description} onChange={(event) => setManual({ ...manual, description: event.target.value })} className="w-full rounded-lg border px-3 py-2" />
              <input required placeholder="Price" value={manual.price} onChange={(event) => setManual({ ...manual, price: event.target.value })} className="w-full rounded-lg border px-3 py-2" />
              <input required placeholder="Category slug" value={manual.categorySlug} onChange={(event) => setManual({ ...manual, categorySlug: event.target.value })} className="w-full rounded-lg border px-3 py-2" />
              <input placeholder={selected.defaultInventory != null ? `Inventory (default ${selected.defaultInventory})` : "Inventory"} value={manual.inventory} onChange={(event) => setManual({ ...manual, inventory: event.target.value })} className="w-full rounded-lg border px-3 py-2" />
              <input required placeholder="Image URL" value={manual.imageUrl} onChange={(event) => setManual({ ...manual, imageUrl: event.target.value })} className="w-full rounded-lg border px-3 py-2" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={manual.published} onChange={(event) => setManual({ ...manual, published: event.target.checked })} />
                Published
              </label>
              <p className="text-xs text-slate-500">Vendor slug {selected.vendorSlug} is applied by this form.</p>
              <button type="submit" disabled={busy || selectedCountries.length === 0} className="rounded-lg bg-nav px-4 py-2 text-sm text-white">
                Preview product
              </button>
            </form>
          ) : null}

          {method === "api" ? <p className="text-sm text-slate-700">{integrationSettingsNote(selected.integrationType)}</p> : null}

          {method === "excel" || method === "json" ? (
            <div className="space-y-3 text-sm">
              <p>Upload a file for {selected.vendorName}. Vendor and countries come from this page. A conflicting value in the file is rejected.</p>
              <button type="button" className="rounded-lg border px-3 py-2" onClick={() => downloadTemplate(method === "excel" ? "excel" : "json")}>
                Download {method === "excel" ? "Excel" : "JSON"} template
              </button>
              <input
                type="file"
                accept={method === "excel" ? ".xlsx,.xls" : ".json"}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readFile(file).catch((err) => setError(err instanceof Error ? err.message : "Could not read the file"));
                }}
              />
            </div>
          ) : null}
          {preview && method !== "api" ? (
            <div className="space-y-2 text-sm">
              <p>
                {preview.ok
                  ? `${preview.rows.length} valid. Nothing is written until you approve.`
                  : "The batch is blocked. Fix every error before import."}
              </p>
              {preview.imageValidation ? <p className="text-xs text-slate-500">{preview.imageValidation}</p> : null}
              <ul className="max-h-48 space-y-1 overflow-auto">
                {preview.batchErrors.map((error) => (
                  <li key={error}>Batch: {error}</li>
                ))}
                {preview.rows.map((row) => (
                  <li key={row.row}>
                    Row {row.row}: {row.errors.length ? row.errors.join("; ") : row.name}
                  </li>
                ))}
              </ul>
              <button type="button" disabled={busy || !preview.ok} onClick={() => void commitImport()} className="rounded-lg bg-nav px-4 py-2 text-white">
                Approve and import {preview.rows.length} products
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
