"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDeliveryCountryList } from "@/lib/admin-country-management";
import { VENDOR_STATUS_HELP } from "@/lib/admin-vendor-management";

type CatalogVendorRow = {
  vendorSlug: string;
  vendorName: string;
  enabled: boolean;
  integrationType: string;
  deliveryCountries: string[];
  sourceName?: string;
  trashedAt?: string;
  trashExpiresAt?: string;
  source: "config" | "default";
  productCount: number;
  storage: string;
  method: string;
  shoppingAvailable: boolean;
  storefrontBlockReason: string | null;
};

type ListResponse = { vendors: CatalogVendorRow[] };

export default function AdminCatalogVendorsPage() {
  const { token } = useAuth();
  const [vendors, setVendors] = useState<CatalogVendorRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CatalogVendorRow | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await api<ListResponse>("/admin/catalog-vendors", { token });
    setVendors(data.vendors);
  }, [token]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load vendors"));
  }, [load]);

  const active = vendors.filter((vendor) => !vendor.trashedAt);
  const trashed = vendors.filter((vendor) => vendor.trashedAt);

  async function trashVendor() {
    if (!token || !pendingDelete) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/catalog-vendors/${pendingDelete.vendorSlug}/trash`, {
        method: "POST",
        token,
        body: JSON.stringify({ confirmName }),
      });
      setPendingDelete(null);
      setConfirmName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move this vendor to Trash");
    } finally {
      setBusy(false);
    }
  }

  async function restore(vendor: CatalogVendorRow) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/catalog-vendors/${vendor.vendorSlug}/restore`, { method: "POST", token, body: "{}" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore this vendor");
    } finally {
      setBusy(false);
    }
  }

  async function deletePermanently(vendor: CatalogVendorRow) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/catalog-vendors/${vendor.vendorSlug}`, { method: "DELETE", token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Permanent deletion was not completed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Vendor Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Catalog vendors for BlossomPot, Orange County, Gift Baskets Overseas, FNP, and vendors you add.
          Marketplace applications stay on Marketplace vendors.
        </p>
      </div>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{VENDOR_STATUS_HELP}</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Delivery Countries</th>
              <th className="px-4 py-3">Product Count</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Storage</th>
              <th className="px-4 py-3">Manage</th>
              <th className="px-4 py-3">Delete</th>
            </tr>
          </thead>
          <tbody>
            {active.map((vendor) => (
              <tr key={vendor.vendorSlug} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{vendor.vendorName}</p>
                  <p className="text-xs text-slate-500">{vendor.vendorSlug}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{vendor.enabled ? "Enabled" : "Disabled"}</p>
                  {vendor.storefrontBlockReason ? (
                    <p className="text-xs text-slate-500">{vendor.storefrontBlockReason}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {vendor.deliveryCountries.length ? formatDeliveryCountryList(vendor.deliveryCountries) : "—"}
                </td>
                <td className="px-4 py-3">{vendor.productCount}</td>
                <td className="px-4 py-3">{vendor.method}</td>
                <td className="px-4 py-3">{vendor.sourceName || "—"}</td>
                <td className="px-4 py-3">{vendor.storage}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/vendors/${vendor.vendorSlug}`} className="font-medium text-nav underline">
                    Manage
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-sm font-medium text-red-700 underline"
                    onClick={() => {
                      setPendingDelete(vendor);
                      setConfirmName("");
                      setError(null);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Trash</h2>
        <p className="text-sm text-slate-600">
          Trashed vendors stay recoverable for 30 days. Products and historical orders are not deleted. There is no
          automatic purge yet.
        </p>
        {trashed.length === 0 ? (
          <p className="text-sm text-slate-500">Trash is empty.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Product Count</th>
                  <th className="px-4 py-3">Deleted Date</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Restore</th>
                  <th className="px-4 py-3">Delete Permanently</th>
                </tr>
              </thead>
              <tbody>
                {trashed.map((vendor) => (
                  <tr key={vendor.vendorSlug} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{vendor.vendorName}</td>
                    <td className="px-4 py-3">{vendor.productCount}</td>
                    <td className="px-4 py-3">{vendor.trashedAt?.slice(0, 10)}</td>
                    <td className="px-4 py-3">{vendor.trashExpiresAt?.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <button type="button" className="font-medium text-nav underline" disabled={busy} onClick={() => restore(vendor)}>
                        Restore
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="font-medium text-red-700 underline"
                        disabled={busy}
                        onClick={() => deletePermanently(vendor)}
                      >
                        Delete Permanently
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pendingDelete ? (
        <section className="max-w-xl space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-950">Move {pendingDelete.vendorName} to Trash</h2>
          <p className="text-sm text-red-950">
            This removes the vendor and its products from new shopping. Existing orders stay unchanged. The vendor can
            be restored from Trash, and it returns disabled until you enable it again.
          </p>
          <label className="block text-sm">
            Type <span className="font-semibold">{pendingDelete.vendorName}</span> to confirm
            <input
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || confirmName.trim() !== pendingDelete.vendorName.trim()}
              onClick={() => void trashVendor()}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Move to Trash
            </button>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setPendingDelete(null)}>
              Cancel
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
