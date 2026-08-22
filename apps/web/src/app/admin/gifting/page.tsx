"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useSessionId } from "@/lib/session";
import type { GiftingSettings, SubscriptionPlan } from "@blossompot/shared";

interface Overview {
  settings: GiftingSettings;
  plans: SubscriptionPlan[];
  analytics: Record<string, number>;
  subscriptions: Array<Record<string, string>>;
  reminders: Array<Record<string, string>>;
  recipients: Array<Record<string, string>>;
  history: Array<Record<string, string>>;
  notifications: Array<Record<string, string>>;
}

export default function AdminGiftingPage() {
  const { user } = useAuth();
  const sessionId = useSessionId();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user?.token || !sessionId) return;
    try {
      setData(await api<Overview>("/admin/gifting", { token: user.token, sessionId }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load gifting admin");
    }
  };

  useEffect(() => {
    void load();
  }, [user?.token, sessionId]);

  const saveSettings = async () => {
    if (!data || !user?.token || !sessionId) return;
    setSaving(true);
    try {
      await api("/admin/gifting/settings", {
        method: "PUT",
        token: user.token,
        sessionId,
        body: JSON.stringify({
          reminderOffsetsDays: data.settings.reminderOffsetsDays,
          choiceWindowHours: data.settings.choiceWindowHours,
          autoSelectEnabled: data.settings.autoSelectEnabled,
          autoSelectRequiresApproval: data.settings.autoSelectRequiresApproval,
          whatsappEnabled: data.settings.whatsappEnabled,
          retentionOffsetsDays: data.settings.retentionOffsetsDays,
          nationalOccasionsEnabled: data.settings.nationalOccasionsEnabled,
          loyalty: data.settings.loyalty,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async (plan: SubscriptionPlan) => {
    if (!user?.token || !sessionId) return;
    await api(`/admin/gifting/plans/${plan.id}`, {
      method: "PUT",
      token: user.token,
      sessionId,
      body: JSON.stringify({
        name: plan.name,
        price: plan.price,
        status: plan.status,
        recommended: plan.recommended,
        benefits: plan.benefits,
        renewalEnabled: plan.renewalEnabled,
        discountPercent: plan.discountPercent,
      }),
    });
    await load();
  };

  if (!data) return <div className="p-8 text-slate-500">{error || "Loading gifting admin…"}</div>;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-primary">Personal gifting assistant</h1>
        <p className="text-sm text-slate-500 mt-1">Subscriptions, reminders, recommendations, and loyalty.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(data.analytics).map(([key, value]) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-primary">{value}</p>
            <p className="text-xs text-slate-500 mt-1 break-words">{key}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold text-primary">Reminder & selection settings</h2>
        <label className="block text-sm">
          Reminder days before (comma separated)
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={data.settings.reminderOffsetsDays.join(",")}
            onChange={(e) =>
              setData({
                ...data,
                settings: {
                  ...data.settings,
                  reminderOffsetsDays: e.target.value.split(",").map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n)),
                },
              })
            }
          />
        </label>
        <label className="block text-sm">
          Choice window (hours)
          <input
            type="number"
            step="0.25"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={data.settings.choiceWindowHours}
            onChange={(e) =>
              setData({ ...data, settings: { ...data.settings, choiceWindowHours: Number(e.target.value) } })
            }
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.settings.autoSelectEnabled}
            onChange={(e) => setData({ ...data, settings: { ...data.settings, autoSelectEnabled: e.target.checked } })}
          />
          Auto-recommend after no response
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.settings.autoSelectRequiresApproval}
            onChange={(e) =>
              setData({ ...data, settings: { ...data.settings, autoSelectRequiresApproval: e.target.checked } })
            }
          />
          Require customer approval before payment
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.settings.whatsappEnabled}
            onChange={(e) => setData({ ...data, settings: { ...data.settings, whatsappEnabled: e.target.checked } })}
          />
          Enable WhatsApp reminders (only if Meta/Twilio env is set)
        </label>
        <button type="button" disabled={saving} onClick={() => void saveSettings()} className="min-h-11 rounded-lg bg-nav px-4 text-white font-semibold">
          Save settings
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-primary">Subscription plans</h2>
        {data.plans.map((plan, index) => (
          <div key={plan.id} className="rounded-xl border border-slate-200 bg-white p-4 grid sm:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2"
              value={plan.name}
              onChange={(e) => {
                const plans = [...data.plans];
                plans[index] = { ...plan, name: e.target.value };
                setData({ ...data, plans });
              }}
            />
            <input
              type="number"
              className="border rounded-lg px-3 py-2"
              value={plan.price}
              onChange={(e) => {
                const plans = [...data.plans];
                plans[index] = { ...plan, price: Number(e.target.value) };
                setData({ ...data, plans });
              }}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(plan.recommended)}
                onChange={(e) => {
                  const plans = data.plans.map((p, i) => ({ ...p, recommended: i === index ? e.target.checked : false }));
                  setData({ ...data, plans });
                }}
              />
              Recommended / Most Popular
            </label>
            <select
              className="border rounded-lg px-3 py-2"
              value={plan.status}
              onChange={(e) => {
                const plans = [...data.plans];
                plans[index] = { ...plan, status: e.target.value as SubscriptionPlan["status"] };
                setData({ ...data, plans });
              }}
            >
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
            <button type="button" className="sm:col-span-2 min-h-11 rounded-lg border border-slate-300 font-semibold" onClick={() => void savePlan(plan)}>
              Save {plan.name}
            </button>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-semibold text-primary mb-2">Recent reminders</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">Status</th>
                <th className="p-2">Kind</th>
                <th className="p-2">Occasion</th>
                <th className="p-2">When</th>
              </tr>
            </thead>
            <tbody>
              {data.reminders.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">{row.kind}</td>
                  <td className="p-2">{row.occasionTitle}</td>
                  <td className="p-2">{row.scheduledAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-primary mb-2">Notification log</h2>
        <ul className="space-y-2 text-sm">
          {data.notifications.map((log, i) => (
            <li key={i} className="rounded-lg border border-slate-200 px-3 py-2">
              {log.channel} · {log.template} · {log.status} · {log.sentAt}
              {log.error ? ` · ${log.error}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
