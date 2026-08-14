"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getVendorToken } from "@/lib/vendor-session";

type Summary = {
  todayOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  productCount: number;
  pendingProductApprovals: number;
  totalSales: number;
  health: { score: number; band: string };
};

export default function VendorDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getVendorToken();
    if (!token) return;
    api<{ summary: Summary }>("/marketplace/vendors/dashboard", { token })
      .then((r) => setSummary(r.summary))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!summary) return <p className="text-slate-500 text-sm">Loading dashboard…</p>;

  const cards = [
    { label: "Today's orders", value: summary.todayOrders },
    { label: "Pending", value: summary.pendingOrders },
    { label: "Preparing", value: summary.processingOrders },
    { label: "Out for delivery", value: summary.shippedOrders },
    { label: "Completed", value: summary.completedOrders },
    { label: "Cancelled", value: summary.cancelledOrders },
    { label: "Products", value: summary.productCount },
    { label: "Awaiting product approval", value: summary.pendingProductApprovals },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">
          Partner health: <span className="font-semibold capitalize">{summary.health.band}</span> (
          {summary.health.score}/100)
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        If you provide competitive partner pricing, BlossomPot can promote your products more
        aggressively and generate more orders for your business.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-2xl font-bold text-primary mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Attributed order total</p>
        <p className="text-3xl font-bold text-primary mt-1">
          ${summary.totalSales.toFixed(2)}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Commission and payouts are calculated on the server ledger after fulfillment.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/vendor/products"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
        >
          Manage products
        </Link>
        <Link
          href="/vendor/orders"
          className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800"
        >
          View orders
        </Link>
      </div>
    </div>
  );
}
