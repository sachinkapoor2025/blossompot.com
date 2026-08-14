"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getVendorToken } from "@/lib/vendor-session";

type VendorOrder = {
  orderId: string;
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  preferredDeliveryDate?: string;
  vendorPayable?: number;
  shippingAddress?: {
    firstName?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    line1?: string;
    giftMessage?: string;
  };
  items?: Array<{ name?: string; quantity?: number; vendorCost?: number }>;
};

const ACTIONS = [
  "accepted",
  "rejected",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    const token = getVendorToken();
    if (!token) return;
    api<{ orders: VendorOrder[] }>("/marketplace/vendors/orders", { token })
      .then((r) => setOrders(r.orders))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }

  useEffect(() => {
    load();
  }, []);

  async function act(orderId: string, action: (typeof ACTIONS)[number]) {
    const token = getVendorToken();
    if (!token) return;
    setBusy(orderId);
    try {
      await api(`/marketplace/vendors/orders/${orderId}/action`, {
        method: "POST",
        token,
        body: JSON.stringify({ action }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Orders</h1>
        <p className="text-sm text-slate-600 mt-1">
          Customer → BlossomPot → You. Update fulfillment status as you prepare and deliver.
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-4">
        {orders.map((o) => (
          <article key={o.orderId} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {o.orderNumber || o.orderId.slice(0, 8)}
                </p>
                <p className="text-xs text-slate-500">
                  Status: {o.status} · Delivery: {o.preferredDeliveryDate || "—"}
                </p>
              </div>
              <p className="text-sm font-semibold text-primary">
                Your payout est. ${(o.vendorPayable ?? 0).toFixed(2)}
              </p>
            </div>
            <p className="text-sm text-slate-700 mt-3">
              {o.shippingAddress?.firstName} · {o.shippingAddress?.line1}, {o.shippingAddress?.city},{" "}
              {o.shippingAddress?.state} {o.shippingAddress?.postalCode}
            </p>
            {o.shippingAddress?.giftMessage ? (
              <p className="text-sm text-slate-500 mt-1 italic">Card: {o.shippingAddress.giftMessage}</p>
            ) : null}
            <ul className="mt-3 text-sm text-slate-700 space-y-1">
              {(o.items ?? []).map((i, idx) => (
                <li key={idx}>
                  {i.quantity}× {i.name} (cost ${(i.vendorCost ?? 0).toFixed(2)})
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled={busy === o.orderId}
                  onClick={() => act(o.orderId, a)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium capitalize hover:bg-slate-50 disabled:opacity-50"
                >
                  {a.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </article>
        ))}
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">No marketplace orders for your shop yet.</p>
        ) : null}
      </div>
    </div>
  );
}
