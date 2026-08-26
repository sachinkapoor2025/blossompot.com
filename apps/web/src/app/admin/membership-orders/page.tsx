"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApiClient } from "@/lib/auth-context";
import {
  durationLabel,
  formatMembershipDate,
  reminderChannelLabel,
  type GiftingChannel,
  type GiftingSubscription,
  type MembershipSelectedEvent,
} from "@blossompot/shared";
import { paginate, sortItems, type SortDir } from "@/lib/admin-utils";
import { TableControls } from "@/components/admin/TableControls";

type MembershipOrder = GiftingSubscription & {
  reminderChannel?: GiftingChannel;
  selectedEvents?: MembershipSelectedEvent[];
};

function statusClass(status: string) {
  if (status === "active") return "bg-emerald-100 text-emerald-800";
  if (status === "pending_payment") return "bg-amber-100 text-amber-800";
  if (status === "cancelled" || status === "expired") return "bg-slate-200 text-slate-700";
  return "bg-rose-100 text-rose-800";
}

function paymentLabel(status: string) {
  if (status === "active") return "Paid";
  if (status === "pending_payment") return "Pending";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Expired";
  return status;
}

export default function AdminMembershipOrdersPage() {
  const apiClient = useApiClient();
  const [orders, setOrders] = useState<MembershipOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = useCallback(() => {
    setLoading(true);
    apiClient<{ orders: MembershipOrder[] }>("/admin/gifting/subscriptions")
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [apiClient]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = orders.filter((o) => {
      if (tab !== "all" && o.status !== tab) return false;
      if (!q) return true;
      return (
        o.email.toLowerCase().includes(q) ||
        o.planName.toLowerCase().includes(q) ||
        o.userId.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    });
    list = sortItems(list, (o) => o.updatedAt || o.createdAt, sortDir);
    return list;
  }, [orders, tab, search, sortDir]);

  const { items, totalPages, total } = paginate(filtered, page, pageSize);

  return (
    <div className="p-4 sm:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Membership / Reminder Orders</h1>
        <p className="text-sm text-slate-500 mt-1">
          Purchased reminder memberships, selected occasions, and notification preferences.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: "all", label: "All" },
          { id: "pending_payment", label: "Pending payment" },
          { id: "active", label: "Active" },
          { id: "expired", label: "Expired" },
          { id: "cancelled", label: "Cancelled" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setPage(1);
            }}
            className={`min-h-9 rounded-full px-3 text-sm font-semibold ${
              tab === item.id ? "bg-nav text-white" : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
        <input
          className="min-h-9 rounded-lg border border-slate-200 px-3 text-sm"
          placeholder="Search email, plan, customer"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <TableControls
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortLabel="Date"
        sortDir={sortDir}
        onSortToggle={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
      />

      {loading ? (
        <p className="text-slate-500 text-sm">Loading membership orders…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Events</th>
                <th className="p-3">Reminders</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={8}>
                    No membership orders yet.
                  </td>
                </tr>
              )}
              {items.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-3">
                    <Link href={`/admin/membership-orders/${encodeURIComponent(order.userId)}`} className="font-semibold text-nav">
                      {order.email}
                    </Link>
                  </td>
                  <td className="p-3">{order.planName}</td>
                  <td className="p-3">{durationLabel(order.durationMonths)}</td>
                  <td className="p-3">{order.selectedEvents?.length ?? 0}</td>
                  <td className="p-3">{reminderChannelLabel(order.reminderChannel ?? "email")}</td>
                  <td className="p-3">{paymentLabel(order.status)}</td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(order.status)}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">
                    {order.membershipStartDate ? formatMembershipDate(order.membershipStartDate) : order.updatedAt.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
