import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  DEFAULT_GIFTING_SETTINGS,
  giftingKeys,
  giftingSettingsUpdateSchema,
  subscriptionPlanInputSchema,
  subscriptionPlanUpdateSchema,
  type GiftingSubscription,
  type SubscriptionPlan,
} from "@blossompot/shared";
import { requireAdmin } from "../lib/auth";
import { badRequest, created, forbidden, notFound, ok } from "../lib/response";
import { now } from "../lib/db";
import {
  deletePlan,
  ensureDefaultPlans,
  getAnalytics,
  getGiftingSettings,
  getPlan,
  getPrefs,
  getSubscription,
  listAdminIndex,
  listNotificationLogs,
  listPlans,
  listReminders,
  saveGiftingSettings,
  savePlan,
} from "../lib/gifting-store";
import { v4 as uuidv4 } from "uuid";

function admin(event: APIGatewayProxyEventV2) {
  return requireAdmin(event);
}

export async function adminGetGiftingOverview(event: APIGatewayProxyEventV2) {
  if (!admin(event)) return forbidden();
  const [settings, plans, analytics, subscriptions, reminders, recipients, history, logs] = await Promise.all([
    getGiftingSettings(),
    ensureDefaultPlans(),
    getAnalytics(),
    listAdminIndex(giftingKeys.entitySubscriptionPk(), 200),
    listAdminIndex(giftingKeys.entityReminderPk(), 80),
    listAdminIndex(giftingKeys.entityRecipientPk(), 80),
    listAdminIndex(giftingKeys.entityHistoryPk(), 80),
    listNotificationLogs(80),
  ]);

  const subs = subscriptions as Array<{ status?: string; expiresAt?: string }>;
  const nowMs = Date.now();
  const active = subs.filter((s) => s.status === "active" && (!s.expiresAt || new Date(s.expiresAt).getTime() > nowMs));
  const expired = subs.filter((s) => s.status === "expired" || (s.expiresAt && new Date(s.expiresAt).getTime() <= nowMs));
  const reminderRows = reminders as Array<{ status?: string; kind?: string }>;

  return ok({
    settings,
    plans,
    analytics: {
      ...analytics,
      activeSubscribers: active.length,
      expiredSubscriptions: expired.length,
      recipients: recipients.length,
      remindersSent: reminderRows.filter((r) => r.status === "sent" || r.status === "opened" || r.status === "responded").length,
      reminderFailed: reminderRows.filter((r) => r.status === "failed").length,
      noResponse: reminderRows.filter((r) => r.status === "expired").length,
      giftHistory: history.length,
    },
    subscriptions,
    reminders,
    recipients,
    history,
    notifications: logs,
  });
}

export async function adminUpdateGiftingSettings(event: APIGatewayProxyEventV2) {
  if (!admin(event)) return forbidden();
  const parsed = giftingSettingsUpdateSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const current = await getGiftingSettings();
  const next = {
    ...current,
    ...parsed.data,
    loyalty: { ...current.loyalty, ...parsed.data.loyalty },
    emailTemplates: { ...current.emailTemplates, ...parsed.data.emailTemplates },
    whatsappTemplates: { ...current.whatsappTemplates, ...parsed.data.whatsappTemplates },
  };
  return ok({ settings: await saveGiftingSettings(next) });
}

export async function adminResetGiftingSettings(event: APIGatewayProxyEventV2) {
  if (!admin(event)) return forbidden();
  return ok({ settings: await saveGiftingSettings({ ...DEFAULT_GIFTING_SETTINGS }) });
}

export async function adminListPlans(event: APIGatewayProxyEventV2) {
  if (!admin(event)) return forbidden();
  return ok({ plans: await ensureDefaultPlans() });
}

export async function adminCreatePlan(event: APIGatewayProxyEventV2) {
  if (!admin(event)) return forbidden();
  const parsed = subscriptionPlanInputSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const timestamp = now();
  const id = parsed.data.slug?.trim() || uuidv4();
  if (parsed.data.recommended) {
    const plans = await listPlans(true);
    await Promise.all(
      plans
        .filter((p) => p.recommended)
        .map((p) => savePlan({ ...p, recommended: false, updatedAt: timestamp }))
    );
  }
  const plan: SubscriptionPlan = {
    id,
    name: parsed.data.name,
    slug: parsed.data.slug ?? id,
    durationMonths: parsed.data.durationMonths,
    price: parsed.data.price,
    currency: parsed.data.currency,
    compareAtPrice: parsed.data.compareAtPrice,
    benefits: parsed.data.benefits,
    status: parsed.data.status,
    recommended: parsed.data.recommended,
    discountPercent: parsed.data.discountPercent,
    renewalEnabled: parsed.data.renewalEnabled,
    sortOrder: parsed.data.sortOrder ?? 10,
    isCustom: parsed.data.isCustom,
    allowsEventCustomization: parsed.data.allowsEventCustomization,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return created({ plan: await savePlan(plan) });
}

export async function adminUpdatePlan(event: APIGatewayProxyEventV2) {
  if (!admin(event)) return forbidden();
  const planId = event.pathParameters?.planId;
  if (!planId) return badRequest("Plan ID required");
  const parsed = subscriptionPlanUpdateSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const current = await getPlan(planId);
  if (!current) return notFound("Plan not found");
  if (parsed.data.recommended) {
    const plans = await listPlans(true);
    await Promise.all(
      plans
        .filter((p) => p.id !== planId && p.recommended)
        .map((p) => savePlan({ ...p, recommended: false, updatedAt: now() }))
    );
  }
  const next: SubscriptionPlan = {
    ...current,
    ...parsed.data,
    id: current.id,
    updatedAt: now(),
  };
  return ok({ plan: await savePlan(next) });
}

export async function adminDeletePlan(event: APIGatewayProxyEventV2) {
  if (!admin(event)) return forbidden();
  const planId = event.pathParameters?.planId;
  if (!planId) return badRequest("Plan ID required");
  const deleted = await deletePlan(planId);
  if (!deleted) return notFound("Plan not found");
  return ok({ ok: true });
}

export async function adminListGiftingLogs(event: APIGatewayProxyEventV2) {
  if (!admin(event)) return forbidden();
  return ok({ notifications: await listNotificationLogs(200) });
}

function dedupeMembershipOrders<T extends { id?: string; updatedAt?: string; userId?: string }>(rows: T[]): T[] {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const key = row.id || row.userId || "";
    if (!key) continue;
    const current = latest.get(key);
    if (!current || String(row.updatedAt ?? "") > String(current.updatedAt ?? "")) {
      latest.set(key, row);
    }
  }
  return [...latest.values()].sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
}

export async function adminListMembershipOrders(event: APIGatewayProxyEventV2) {
  if (!admin(event)) return forbidden();
  const rows = await listAdminIndex<GiftingSubscription & { reminderChannel?: string }>(
    giftingKeys.entitySubscriptionPk(),
    200
  );
  return ok({ orders: dedupeMembershipOrders(rows) });
}

export async function adminGetMembershipOrder(event: APIGatewayProxyEventV2) {
  if (!admin(event)) return forbidden();
  const userId = event.pathParameters?.userId;
  if (!userId) return badRequest("Customer ID required");
  const subscription = await getSubscription(userId);
  if (!subscription) return notFound("Membership order not found");
  const [prefs, reminders] = await Promise.all([getPrefs(userId), listReminders(userId)]);
  return ok({
    order: {
      ...subscription,
      reminderChannel: subscription.reminderChannel ?? prefs.reminderChannel,
    },
    prefs,
    reminders: reminders.filter((r) => r.kind === "occasion").slice(-40),
  });
}
