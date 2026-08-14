"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { getVendorToken } from "@/lib/vendor-session";

type ProductRow = {
  slug: string;
  name: string;
  vendorCost?: number;
  price?: number;
  vendorApprovalStatus?: string;
  published?: boolean;
  inventory?: number;
};

export default function VendorProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function load() {
    const token = getVendorToken();
    if (!token) return;
    api<{ products: ProductRow[] }>("/marketplace/vendors/products", { token })
      .then((r) => setProducts(r.products))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const token = getVendorToken();
    if (!token) return;
    const fd = new FormData(e.currentTarget);
    const imagesRaw = String(fd.get("images") ?? "").trim();
    const images = imagesRaw
      ? imagesRaw
          .split(/[\s,]+/)
          .map((u) => u.trim())
          .filter(Boolean)
      : [];
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim(),
      vendorCost: Number(fd.get("vendorCost")),
      suggestedRetailPrice: fd.get("suggestedRetailPrice")
        ? Number(fd.get("suggestedRetailPrice"))
        : undefined,
      minSellPrice: fd.get("minSellPrice") ? Number(fd.get("minSellPrice")) : undefined,
      categorySlug: String(fd.get("categorySlug") ?? "flowers").trim(),
      images,
      inventory: Number(fd.get("inventory") ?? 100),
      prepTimeHours: fd.get("prepTimeHours") ? Number(fd.get("prepTimeHours")) : undefined,
      submitForApproval: fd.get("submitForApproval") === "on",
    };
    try {
      await api("/marketplace/vendors/products", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      });
      setMsg("Product saved. Admin must approve before it is publicly visible.");
      e.currentTarget.reset();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function previewPricing(cost: number, sell: number) {
    const token = getVendorToken();
    if (!token) return;
    try {
      const r = await api<{
        breakdown: { blossompotGrossMargin: number; vendorPayable: number; commissionAmount: number };
      }>("/marketplace/vendors/pricing/preview", {
        method: "POST",
        token,
        body: JSON.stringify({ vendorCost: cost, sellPrice: sell, categorySlug: "flowers" }),
      });
      setPreview(
        `Margin $${r.breakdown.blossompotGrossMargin.toFixed(2)} · Your payable $${r.breakdown.vendorPayable.toFixed(2)} · Commission ref $${r.breakdown.commissionAmount.toFixed(2)}`
      );
    } catch {
      setPreview(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Products</h1>
        <p className="text-sm text-slate-600 mt-1">
          Set partner cost, optional suggested retail, and minimum sell price. Products stay draft or
          pending until BlossomPot approves them.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Add product</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input name="name" required placeholder="Product name" className="rounded-lg border px-3 py-2 text-sm" />
          <input
            name="categorySlug"
            defaultValue="flowers"
            placeholder="Category slug"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="vendorCost"
            type="number"
            step="0.01"
            required
            placeholder="Vendor cost (partner price)"
            className="rounded-lg border px-3 py-2 text-sm"
            onBlur={(e) => {
              const cost = Number(e.target.value);
              if (cost > 0) previewPricing(cost, Math.round(cost / 0.8 * 100) / 100);
            }}
          />
          <input
            name="suggestedRetailPrice"
            type="number"
            step="0.01"
            placeholder="Suggested retail (optional)"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="minSellPrice"
            type="number"
            step="0.01"
            placeholder="Minimum sell price"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="inventory"
            type="number"
            defaultValue={100}
            placeholder="Inventory"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="prepTimeHours"
            type="number"
            placeholder="Prep time (hours)"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="images"
            placeholder="Image URLs (comma-separated)"
            className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            name="description"
            rows={3}
            placeholder="Description"
            className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
          />
        </div>
        {preview ? <p className="text-xs text-slate-500">{preview}</p> : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="submitForApproval" defaultChecked />
          Submit for admin approval
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
        <button type="submit" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">
          Save product
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Live</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.slug} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3">${(p.vendorCost ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 capitalize">{(p.vendorApprovalStatus ?? "—").replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{p.published ? "Yes" : "No"}</td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No products yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
