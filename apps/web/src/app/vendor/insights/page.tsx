"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getVendorToken } from "@/lib/vendor-session";

export default function VendorInsightsPage() {
  const [summary, setSummary] = useState<{
    productCount: number;
    completedOrders: number;
    totalSales: number;
    health: { score: number; band: string };
  } | null>(null);

  useEffect(() => {
    const token = getVendorToken();
    if (!token) return;
    api<{ summary: typeof summary }>("/marketplace/vendors/dashboard", { token }).then((r) =>
      setSummary(r.summary)
    );
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Insights</h1>
        <p className="text-sm text-slate-600 mt-1">
          Recommendations to improve sales on BlossomPot — your local sales channel.
        </p>
      </div>

      {summary ? (
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">Products</p>
            <p className="text-2xl font-bold text-primary">{summary.productCount}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">Completed orders</p>
            <p className="text-2xl font-bold text-primary">{summary.completedOrders}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">Health</p>
            <p className="text-2xl font-bold text-primary capitalize">{summary.health.band}</p>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          If a product receives many views but few orders, improve the primary image or test a more
          competitive partner price so BlossomPot can promote it more aggressively.
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Seasonal collections (Valentine&apos;s, Mother&apos;s Day, graduation) often outperform
          evergreen SKUs — keep occasion tags and availability accurate.
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Fast acceptance and on-time delivery improve your vendor health score, which feeds future
          product ranking.
        </div>
      </div>
    </div>
  );
}
