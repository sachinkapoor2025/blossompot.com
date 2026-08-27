"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApiClient } from "@/lib/auth-context";
import {
  durationLabel,
  formatMembershipDate,
  reminderChannelLabel,
  type GiftReminder,
  type GiftingChannel,
  type GiftingPrefs,
  type GiftingSubscription,
} from "@blossompot/shared";
import { formatMoney } from "@/lib/admin-utils";

function statusClass(status: string) {
  if (status === "active") return "bg-emerald-100 text-emerald-800";
  if (status === "pending_payment") return "bg-amber-100 text-amber-800";
  if (status === "cancelled" || status === "expired") return "bg-slate-200 text-slate-700";
  return "bg-rose-100 text-rose-800";
}

export default function AdminMembershipOrderDetailPage() {
  const apiClient = useApiClient();
  const params = useParams();
  const userId = decodeURIComponent(String(params.userId ?? ""));
  const [order, setOrder] = useState<GiftingSubscription | null>(null);
  const [prefs, setPrefs] = useState<GiftingPrefs | null>(null);
  const [reminders, setReminders] = useState<GiftReminder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiClient<{ order: GiftingSubscription; prefs: GiftingPrefs; reminders: GiftReminder[] }>(
      `/admin/gifting/subscriptions/${encodeURIComponent(userId)}`
    )
      .then((data) => {
        setOrder(data.order);
        setPrefs(data.prefs);
        setReminders(data.reminders ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load membership order"))
      .finally(() => setLoading(false));
  }, [apiClient, userId]);

  if (loading) return <div className="p-8 text-slate-500">Loading membership order…</div>;
  if (error || !order) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error || "Membership order not found"}</p>
        <Link href="/admin/membership-orders" className="mt-4 inline-block text-nav font-semibold">
          Back to membership orders
        </Link>
      </div>
    );
  }

  const channel = (order.reminderChannel ?? prefs?.reminderChannel ?? "email") as GiftingChannel;

  return (
    <div className="p-4 sm:p-8 max-w-4xl space-y-6">
      <Link href="/admin/membership-orders" className="text-sm font-semibold text-nav">
        ← Membership / Reminder Orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">{order.planName}</h1>
          <p className="text-sm text-slate-500 mt-1">{order.email}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
          {order.status.replace("_", " ")}
        </span>
      </div>

      <section className="grid sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <p>
          <span className="text-slate-500">Customer ID</span>
          <br />
          {order.userId}
        </p>
        <p>
          <span className="text-slate-500">Order ID</span>
          <br />
          {order.id}
        </p>
        <p>
          <span className="text-slate-500">Duration</span>
          <br />
          {durationLabel(order.durationMonths)}
          {order.isCustomPlan ? " · Custom" : ""}
        </p>
        <p>
          <span className="text-slate-500">Price</span>
          <br />
          {formatMoney(order.price, order.currency)}
        </p>
        <p>
          <span className="text-slate-500">Start date</span>
          <br />
          {order.membershipStartDate ? formatMembershipDate(order.membershipStartDate) : "—"}
        </p>
        <p>
          <span className="text-slate-500">Expires</span>
          <br />
          {order.expiresAt ? new Date(order.expiresAt).toLocaleDateString("en-US", { dateStyle: "long" }) : "—"}
        </p>
        <p>
          <span className="text-slate-500">Reminder preference</span>
          <br />
          {reminderChannelLabel(channel)}
        </p>
        <p>
          <span className="text-slate-500">Payment</span>
          <br />
          {order.status === "active" ? "Paid" : order.status === "pending_payment" ? "Pending" : order.status} ·{" "}
          {order.paymentMethod ?? "—"}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-primary mb-3">Selected events</h2>
        {(order.selectedEvents?.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-500">No events stored on this membership.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {order.selectedEvents?.map((event) => (
              <li key={event.key} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                <span>
                  {event.title}
                  <span className="text-slate-500"> · {event.source}</span>
                </span>
                <span className="text-slate-600">
                  {event.date ? formatMembershipDate(event.date) : "Date saved with people"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-primary mb-3">Scheduled reminders</h2>
        {reminders.length === 0 ? (
          <p className="text-sm text-slate-500">No occasion reminders scheduled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="p-2">Occasion</th>
                  <th className="p-2">Event date</th>
                  <th className="p-2">Scheduled</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((reminder) => (
                  <tr key={reminder.id} className="border-t">
                    <td className="p-2">{reminder.occasionTitle}</td>
                    <td className="p-2">{reminder.occasionDate}</td>
                    <td className="p-2">{reminder.scheduledAt.slice(0, 16).replace("T", " ")}</td>
                    <td className="p-2">{reminder.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
