"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type Vendor = {
  vendorId: string;
  vendorSlug: string;
  status: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  businessType: string;
  reviewNotes?: string;
};

type Stats = {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  rejected: number;
};

type VendorProduct = {
  slug: string;
  name: string;
  vendorSlug?: string;
  vendorCost?: number;
  price?: number;
  vendorApprovalStatus?: string;
};

type CommissionConfig = {
  global: { mode: string; value: number };
  byCategory: Record<string, { mode: string; value: number }>;
  byVendorSlug: Record<string, { mode: string; value: number }>;
  paymentProcessingFeePercent: number;
  paymentProcessingFeeFixed: number;
};

export default function AdminMarketplaceVendorsPage() {
  const { token } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [commissions, setCommissions] = useState<CommissionConfig | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"vendors" | "products" | "commissions">("vendors");

  const loadVendors = useCallback(async () => {
    if (!token) return;
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (status) qs.set("status", status);
    const r = await api<{ vendors: Vendor[]; stats: Stats }>(
      `/admin/marketplace/vendors?${qs.toString()}`,
      { token }
    );
    setVendors(r.vendors);
    setStats(r.stats);
  }, [token, q, status]);

  const loadProducts = useCallback(async () => {
    if (!token) return;
    const r = await api<{ products: VendorProduct[] }>(
      "/admin/marketplace/products?approvalStatus=pending_approval",
      { token }
    );
    setProducts(r.products);
  }, [token]);

  const loadCommissions = useCallback(async () => {
    if (!token) return;
    const r = await api<{ commissions: CommissionConfig }>("/admin/marketplace/commissions", {
      token,
    });
    setCommissions(r.commissions);
  }, [token]);

  useEffect(() => {
    loadVendors().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [loadVendors]);

  useEffect(() => {
    if (tab === "products") loadProducts().catch(() => undefined);
    if (tab === "commissions") loadCommissions().catch(() => undefined);
  }, [tab, loadProducts, loadCommissions]);

  async function setVendorStatus(vendorId: string, next: string) {
    if (!token) return;
    setError(null);
    try {
      await api(`/admin/marketplace/vendors/${vendorId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          status: next,
          temporaryPassword:
            next === "approved" || next === "active"
              ? tempPasswords[vendorId] || undefined
              : undefined,
        }),
      });
      await loadVendors();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function approveProduct(slug: string, sellPrice: number, approvalStatus: string) {
    if (!token) return;
    await api(`/admin/marketplace/products/${slug}/approval`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ approvalStatus, sellPrice }),
    });
    await loadProducts();
  }

  async function saveCommissions() {
    if (!token || !commissions) return;
    await api("/admin/marketplace/commissions", {
      method: "PUT",
      token,
      body: JSON.stringify(commissions),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Marketplace Vendors</h1>
        <p className="text-sm text-slate-600">
          Review applications, approve products, and configure commission rules.
        </p>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["Total", stats.total],
            ["Pending", stats.pending],
            ["Active", stats.active],
            ["Suspended", stats.suspended],
            ["Rejected", stats.rejected],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border bg-white p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        {(["vendors", "products", "commissions"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              tab === t ? "bg-primary text-white" : "bg-white border text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {tab === "vendors" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, city…"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {["pending", "under_review", "approved", "active", "suspended", "rejected"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="space-y-3">
            {vendors.map((v) => (
              <div key={v.vendorId} className="rounded-xl border bg-white p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold">{v.businessName}</p>
                    <p className="text-xs text-slate-500">
                      {v.contactName} · {v.email} · {v.phone}
                    </p>
                    <p className="text-xs text-slate-500">
                      {v.city}, {v.state} {v.zip} · {v.businessType} · {v.status}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <input
                      placeholder="Temp password (on approve)"
                      value={tempPasswords[v.vendorId] ?? ""}
                      onChange={(e) =>
                        setTempPasswords((p) => ({ ...p, [v.vendorId]: e.target.value }))
                      }
                      className="rounded border px-2 py-1 text-xs w-48"
                    />
                    <div className="flex flex-wrap gap-1 justify-end">
                      {["under_review", "approved", "active", "suspended", "rejected"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setVendorStatus(v.vendorId, s)}
                          className="rounded-full border px-2.5 py-1 text-[11px] capitalize hover:bg-slate-50"
                        >
                          {s.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "products" ? (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.slug} className="rounded-xl border bg-white p-4 flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.vendorSlug} · cost ${(p.vendorCost ?? 0).toFixed(2)} · {p.vendorApprovalStatus}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  id={`sell-${p.slug}`}
                  type="number"
                  step="0.01"
                  defaultValue={
                    p.vendorCost ? Math.round((p.vendorCost / 0.8) * 100) / 100 : p.price
                  }
                  className="w-28 rounded border px-2 py-1 text-sm"
                  placeholder="Sell $"
                />
                <button
                  type="button"
                  className="rounded-full bg-primary px-3 py-1.5 text-xs text-white"
                  onClick={() => {
                    const el = document.getElementById(`sell-${p.slug}`) as HTMLInputElement;
                    approveProduct(p.slug, Number(el.value), "approved");
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded-full border px-3 py-1.5 text-xs"
                  onClick={() => approveProduct(p.slug, p.price ?? 1, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 ? (
            <p className="text-sm text-slate-500">No products pending approval.</p>
          ) : null}
        </div>
      ) : null}

      {tab === "commissions" && commissions ? (
        <div className="rounded-xl border bg-white p-5 space-y-4 max-w-lg">
          <p className="text-sm text-slate-600">
            Global default and category rules (percentage or fixed). Super-admin save required.
          </p>
          <label className="block text-sm">
            Global % / fixed value
            <input
              type="number"
              className="mt-1 w-full rounded border px-3 py-2"
              value={commissions.global.value}
              onChange={(e) =>
                setCommissions({
                  ...commissions,
                  global: { ...commissions.global, value: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="block text-sm">
            Flowers %
            <input
              type="number"
              className="mt-1 w-full rounded border px-3 py-2"
              value={commissions.byCategory.flowers?.value ?? 20}
              onChange={(e) =>
                setCommissions({
                  ...commissions,
                  byCategory: {
                    ...commissions.byCategory,
                    flowers: { mode: "percentage", value: Number(e.target.value) },
                  },
                })
              }
            />
          </label>
          <label className="block text-sm">
            Cakes %
            <input
              type="number"
              className="mt-1 w-full rounded border px-3 py-2"
              value={commissions.byCategory.cakes?.value ?? 25}
              onChange={(e) =>
                setCommissions({
                  ...commissions,
                  byCategory: {
                    ...commissions.byCategory,
                    cakes: { mode: "percentage", value: Number(e.target.value) },
                  },
                })
              }
            />
          </label>
          <button
            type="button"
            onClick={() => saveCommissions().catch((e) => setError(e.message))}
            className="rounded-full bg-primary px-5 py-2 text-sm text-white"
          >
            Save commissions
          </button>
        </div>
      ) : null}
    </div>
  );
}
