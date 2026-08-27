import { DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import {
  DEFAULT_GIFTING_SETTINGS,
  DEFAULT_SUBSCRIPTION_PLANS,
  accountKeys,
  giftingKeys,
  mergeUpcomingOccasions,
  recommendGifts,
  type GiftHistoryEntry,
  type GiftNotificationLog,
  type GiftOccasion,
  type GiftRecipient,
  type GiftReminder,
  type GiftRecommendation,
  type GiftStreak,
  type GiftingPrefs,
  type GiftingSettings,
  type GiftingSubscription,
  type LoyaltyAccount,
  type LoyaltyTransaction,
  type RecipientCreateInput,
  type SavedGiftMessage,
  type SubscriptionPlan,
  type UpcomingOccasionView,
} from "@blossompot/shared";
import type { Product } from "@blossompot/shared";
import { CONFIG_TABLE, CUSTOMERS_TABLE, PRODUCTS_TABLE, now } from "./db";
import { docClient } from "./db";

type Stored<T> = T & { PK: string; SK: string };

function stripKeys<T>(item: T): Omit<T, "PK" | "SK"> {
  const rec = item as T & { PK?: unknown; SK?: unknown };
  const { PK: _pk, SK: _sk, ...rest } = rec;
  return rest as Omit<T, "PK" | "SK">;
}

export async function getGiftingSettings(): Promise<GiftingSettings> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: giftingKeys.settings.pk, SK: giftingKeys.settings.sk },
    })
  );
  if (!result.Item) return { ...DEFAULT_GIFTING_SETTINGS };
  const { PK: _p, SK: _s, ...data } = result.Item;
  return {
    ...DEFAULT_GIFTING_SETTINGS,
    ...(data as Partial<GiftingSettings>),
    loyalty: { ...DEFAULT_GIFTING_SETTINGS.loyalty, ...(data as GiftingSettings).loyalty },
  };
}

export async function saveGiftingSettings(settings: GiftingSettings): Promise<GiftingSettings> {
  const next = { ...settings, updatedAt: now() };
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: { PK: giftingKeys.settings.pk, SK: giftingKeys.settings.sk, ...next },
    })
  );
  return next;
}

export async function ensureDefaultPlans(): Promise<SubscriptionPlan[]> {
  const existing = await listPlans(true);
  const byId = new Map(existing.map((plan) => [plan.id, plan]));
  const timestamp = now();
  const missing = DEFAULT_SUBSCRIPTION_PLANS.filter((plan) => !byId.has(plan.id)).map((plan) => ({
    ...plan,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  if (missing.length > 0) {
    await Promise.all(missing.map((plan) => putPlan(plan)));
  }
  if (existing.length === 0 && missing.length > 0) return missing;
  return listPlans(true);
}

async function putPlan(plan: SubscriptionPlan) {
  await Promise.all([
    docClient.send(
      new PutCommand({
        TableName: CONFIG_TABLE,
        Item: { PK: giftingKeys.planPk(plan.id), SK: giftingKeys.planSk(), ...plan },
      })
    ),
    docClient.send(
      new PutCommand({
        TableName: CONFIG_TABLE,
        Item: {
          PK: giftingKeys.entityPlanPk(),
          SK: giftingKeys.entityPlanSk(plan.sortOrder, plan.id),
          ...plan,
        },
      })
    ),
  ]);
}

export async function listPlans(includeHidden = false): Promise<SubscriptionPlan[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: CONFIG_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": giftingKeys.entityPlanPk() },
    })
  );
  const plans = (result.Items ?? []).map((item) => stripKeys(item as Stored<SubscriptionPlan>));
  return plans
    .filter((p) => includeHidden || p.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPlan(planId: string): Promise<SubscriptionPlan | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: giftingKeys.planPk(planId), SK: giftingKeys.planSk() },
    })
  );
  return result.Item ? stripKeys(result.Item as Stored<SubscriptionPlan>) : null;
}

export async function savePlan(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
  const previous = await getPlan(plan.id);
  if (previous && previous.sortOrder !== plan.sortOrder) {
    await docClient.send(
      new DeleteCommand({
        TableName: CONFIG_TABLE,
        Key: {
          PK: giftingKeys.entityPlanPk(),
          SK: giftingKeys.entityPlanSk(previous.sortOrder, previous.id),
        },
      })
    );
  }
  await putPlan(plan);
  return plan;
}

export async function deletePlan(planId: string): Promise<boolean> {
  const existing = await getPlan(planId);
  if (!existing) return false;
  await Promise.all([
    docClient.send(
      new DeleteCommand({
        TableName: CONFIG_TABLE,
        Key: { PK: giftingKeys.planPk(planId), SK: giftingKeys.planSk() },
      })
    ),
    docClient.send(
      new DeleteCommand({
        TableName: CONFIG_TABLE,
        Key: {
          PK: giftingKeys.entityPlanPk(),
          SK: giftingKeys.entityPlanSk(existing.sortOrder, planId),
        },
      })
    ),
  ]);
  return true;
}

export async function queryUserItems<T>(userId: string, prefix: string): Promise<T[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: CUSTOMERS_TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": accountKeys.pk(userId),
        ":prefix": prefix,
      },
    })
  );
  return (result.Items ?? []).map((item) => stripKeys(item as Stored<T>)) as T[];
}

export async function getUserItem<T>(userId: string, sk: string): Promise<T | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CUSTOMERS_TABLE,
      Key: { PK: accountKeys.pk(userId), SK: sk },
    })
  );
  return result.Item ? (stripKeys(result.Item as Stored<T>) as T) : null;
}

async function putUserItem(userId: string, sk: string, item: object) {
  await docClient.send(
    new PutCommand({
      TableName: CUSTOMERS_TABLE,
      Item: { ...(item as Record<string, unknown>), PK: accountKeys.pk(userId), SK: sk },
    })
  );
}

async function deleteUserItem(userId: string, sk: string) {
  await docClient.send(
    new DeleteCommand({
      TableName: CUSTOMERS_TABLE,
      Key: { PK: accountKeys.pk(userId), SK: sk },
    })
  );
}

export async function listRecipients(userId: string): Promise<GiftRecipient[]> {
  const items = await queryUserItems<GiftRecipient>(userId, giftingKeys.recipientPrefix());
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRecipient(userId: string, recipientId: string): Promise<GiftRecipient | null> {
  const item = await getUserItem<GiftRecipient>(userId, giftingKeys.recipientSk(recipientId));
  return item && item.userId === userId ? item : null;
}

export async function createRecipient(userId: string, input: RecipientCreateInput): Promise<GiftRecipient> {
  const timestamp = now();
  const id = uuidv4();
  const recipient: GiftRecipient = {
    id,
    userId,
    name: input.name.trim(),
    relationship: input.relationship,
    birthday: input.birthday,
    anniversary: input.anniversary,
    customDates: (input.customDates ?? []).map((d) => ({ ...d, id: uuidv4() })),
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    preferences: input.preferences,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await putUserItem(userId, giftingKeys.recipientSk(id), recipient);
  await putAdminIndex(giftingKeys.entityRecipientPk(), `${timestamp}#${id}`, {
    id,
    userId,
    name: recipient.name,
    relationship: recipient.relationship,
    createdAt: timestamp,
  });
  return recipient;
}

export async function updateRecipient(
  userId: string,
  recipientId: string,
  patch: Partial<RecipientCreateInput>
): Promise<GiftRecipient | null> {
  const current = await getRecipient(userId, recipientId);
  if (!current) return null;
  const next: GiftRecipient = {
    ...current,
    ...patch,
    id: current.id,
    userId,
    name: patch.name?.trim() ?? current.name,
    email: patch.email !== undefined ? patch.email.trim() || undefined : current.email,
    phone: patch.phone !== undefined ? patch.phone.trim() || undefined : current.phone,
    customDates:
      patch.customDates !== undefined
        ? patch.customDates.map((d) => ({ ...d, id: uuidv4() }))
        : current.customDates,
    updatedAt: now(),
  };
  await putUserItem(userId, giftingKeys.recipientSk(recipientId), next);
  return next;
}

export async function deleteRecipient(userId: string, recipientId: string): Promise<boolean> {
  const current = await getRecipient(userId, recipientId);
  if (!current) return false;
  await deleteUserItem(userId, giftingKeys.recipientSk(recipientId));
  const occasions = await listOccasions(userId);
  await Promise.all(
    occasions.filter((o) => o.recipientId === recipientId).map((o) => deleteOccasion(userId, o.id))
  );
  return true;
}

export async function listOccasions(userId: string): Promise<GiftOccasion[]> {
  return queryUserItems<GiftOccasion>(userId, giftingKeys.occasionPrefix());
}

export async function getOccasion(userId: string, occasionId: string): Promise<GiftOccasion | null> {
  return getUserItem<GiftOccasion>(userId, giftingKeys.occasionSk(occasionId));
}

export async function createOccasion(
  userId: string,
  input: {
    recipientId?: string;
    title: string;
    occasionType: GiftOccasion["occasionType"];
    month: number;
    day: number;
    year?: number;
    recurring?: boolean;
    remindNextYear?: boolean;
  }
): Promise<GiftOccasion> {
  const timestamp = now();
  const id = uuidv4();
  const occasion: GiftOccasion = {
    id,
    userId,
    recipientId: input.recipientId,
    title: input.title.trim(),
    occasionType: input.occasionType,
    month: input.month,
    day: input.day,
    year: input.year,
    recurring: input.recurring ?? true,
    remindNextYear: input.remindNextYear,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await putUserItem(userId, giftingKeys.occasionSk(id), occasion);
  await putAdminIndex(giftingKeys.entityOccasionPk(), `${timestamp}#${id}`, {
    id,
    userId,
    title: occasion.title,
    occasionType: occasion.occasionType,
    createdAt: timestamp,
  });
  return occasion;
}

export async function updateOccasion(
  userId: string,
  occasionId: string,
  patch: Partial<GiftOccasion>
): Promise<GiftOccasion | null> {
  const current = await getOccasion(userId, occasionId);
  if (!current) return null;
  const next = { ...current, ...patch, id: current.id, userId, updatedAt: now() };
  await putUserItem(userId, giftingKeys.occasionSk(occasionId), next);
  return next;
}

export async function deleteOccasion(userId: string, occasionId: string): Promise<boolean> {
  const current = await getOccasion(userId, occasionId);
  if (!current) return false;
  await deleteUserItem(userId, giftingKeys.occasionSk(occasionId));
  return true;
}

export async function getSubscription(userId: string): Promise<GiftingSubscription | null> {
  const sub = await getUserItem<GiftingSubscription>(userId, giftingKeys.subscriptionSk());
  if (sub?.status === "active" && sub.expiresAt && new Date(sub.expiresAt).getTime() < Date.now()) {
    const expired = { ...sub, status: "expired" as const, updatedAt: now() };
    await putUserItem(userId, giftingKeys.subscriptionSk(), expired);
    return expired;
  }
  return sub;
}

export async function saveSubscription(sub: GiftingSubscription): Promise<GiftingSubscription> {
  await putUserItem(sub.userId, giftingKeys.subscriptionSk(), sub);
  await putAdminIndex(giftingKeys.entitySubscriptionPk(), `${sub.updatedAt}#${sub.id}`, {
    id: sub.id,
    userId: sub.userId,
    email: sub.email,
    planId: sub.planId,
    planName: sub.planName,
    durationMonths: sub.durationMonths,
    price: sub.price,
    currency: sub.currency,
    status: sub.status,
    paymentMethod: sub.paymentMethod,
    reminderChannel: sub.reminderChannel,
    membershipStartDate: sub.membershipStartDate,
    selectedEvents: sub.selectedEvents ?? [],
    isCustomPlan: sub.isCustomPlan ?? false,
    startedAt: sub.startedAt,
    expiresAt: sub.expiresAt,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  });
  return sub;
}

export function isSubscriptionActive(sub: GiftingSubscription | null, at = new Date()): boolean {
  if (!sub || sub.status !== "active") return false;
  if (!sub.expiresAt) return true;
  return new Date(sub.expiresAt).getTime() > at.getTime();
}

export async function getPrefs(userId: string): Promise<GiftingPrefs> {
  const existing = await getUserItem<GiftingPrefs>(userId, giftingKeys.prefsSk());
  return (
    existing ?? {
      userId,
      reminderChannel: "email",
      autoRecommendEnabled: true,
      updatedAt: now(),
    }
  );
}

export async function savePrefs(prefs: GiftingPrefs): Promise<GiftingPrefs> {
  await putUserItem(prefs.userId, giftingKeys.prefsSk(), prefs);
  return prefs;
}

export async function listHistory(userId: string, recipientId?: string): Promise<GiftHistoryEntry[]> {
  const items = await queryUserItems<GiftHistoryEntry>(userId, giftingKeys.historyPrefix());
  return items
    .filter((h) => !recipientId || h.recipientId === recipientId)
    .sort((a, b) => b.giftDate.localeCompare(a.giftDate));
}

export async function createHistory(entry: GiftHistoryEntry): Promise<GiftHistoryEntry> {
  await putUserItem(entry.userId, giftingKeys.historySk(entry.id), entry);
  await putAdminIndex(giftingKeys.entityHistoryPk(), `${entry.giftDate}#${entry.id}`, {
    id: entry.id,
    userId: entry.userId,
    recipientId: entry.recipientId,
    productName: entry.productName,
    giftDate: entry.giftDate,
  });
  return entry;
}

export async function updateHistory(
  userId: string,
  historyId: string,
  patch: Partial<GiftHistoryEntry>
): Promise<GiftHistoryEntry | null> {
  const current = await getUserItem<GiftHistoryEntry>(userId, giftingKeys.historySk(historyId));
  if (!current) return null;
  const next = { ...current, ...patch, id: current.id, userId, updatedAt: now() };
  await putUserItem(userId, giftingKeys.historySk(historyId), next);
  return next;
}

export async function listMessages(userId: string): Promise<SavedGiftMessage[]> {
  const items = await queryUserItems<SavedGiftMessage>(userId, giftingKeys.messagePrefix());
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveMessage(message: SavedGiftMessage): Promise<SavedGiftMessage> {
  await putUserItem(message.userId, giftingKeys.messageSk(message.id), message);
  return message;
}

export async function getLoyalty(userId: string): Promise<LoyaltyAccount> {
  return (
    (await getUserItem<LoyaltyAccount>(userId, giftingKeys.loyaltySk())) ?? {
      userId,
      points: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
      updatedAt: now(),
    }
  );
}

export async function addLoyaltyPoints(
  userId: string,
  points: number,
  reason: string,
  source: string
): Promise<LoyaltyAccount> {
  if (points === 0) return getLoyalty(userId);
  const current = await getLoyalty(userId);
  const next: LoyaltyAccount = {
    userId,
    points: Math.max(0, current.points + points),
    lifetimeEarned: current.lifetimeEarned + Math.max(0, points),
    lifetimeRedeemed: current.lifetimeRedeemed + (points < 0 ? Math.abs(points) : 0),
    updatedAt: now(),
  };
  const tx: LoyaltyTransaction = {
    id: uuidv4(),
    userId,
    points,
    reason,
    source,
    createdAt: now(),
  };
  await putUserItem(userId, giftingKeys.loyaltySk(), next);
  await putUserItem(userId, giftingKeys.loyaltyTxSk(tx.id), tx);
  await incrementAnalytics(points > 0 ? "loyaltyEarned" : "loyaltyRedeemed", Math.abs(points));
  return next;
}

export async function listLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]> {
  const items = await queryUserItems<LoyaltyTransaction>(userId, giftingKeys.loyaltyTxPrefix());
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getStreak(userId: string): Promise<GiftStreak> {
  return (
    (await getUserItem<GiftStreak>(userId, giftingKeys.streakSk())) ?? {
      userId,
      giftCount: 0,
      claimedMilestones: [],
      updatedAt: now(),
    }
  );
}

export async function incrementStreak(userId: string): Promise<GiftStreak> {
  const current = await getStreak(userId);
  const next: GiftStreak = {
    ...current,
    giftCount: current.giftCount + 1,
    lastGiftAt: now(),
    updatedAt: now(),
  };
  await putUserItem(userId, giftingKeys.streakSk(), next);
  return next;
}

export async function saveStreak(streak: GiftStreak): Promise<GiftStreak> {
  await putUserItem(streak.userId, giftingKeys.streakSk(), streak);
  return streak;
}

export async function listReminders(userId: string): Promise<GiftReminder[]> {
  const items = await queryUserItems<GiftReminder>(userId, giftingKeys.reminderPrefix());
  return items.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export async function getReminderByToken(token: string): Promise<GiftReminder | null> {
  const pointer = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: giftingKeys.reminderTokenPk(token), SK: giftingKeys.reminderTokenSk() },
    })
  );
  const userId = pointer.Item?.userId as string | undefined;
  const reminderId = pointer.Item?.reminderId as string | undefined;
  if (!userId || !reminderId) return null;
  return getUserItem<GiftReminder>(userId, giftingKeys.reminderSk(reminderId));
}

export async function saveReminder(reminder: GiftReminder): Promise<GiftReminder> {
  await putUserItem(reminder.userId, giftingKeys.reminderSk(reminder.id), reminder);
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: giftingKeys.reminderTokenPk(reminder.token),
        SK: giftingKeys.reminderTokenSk(),
        userId: reminder.userId,
        reminderId: reminder.id,
      },
    })
  );
  await putAdminIndex(giftingKeys.entityReminderPk(), `${reminder.status}#${reminder.scheduledAt}#${reminder.id}`, {
    id: reminder.id,
    userId: reminder.userId,
    status: reminder.status,
    kind: reminder.kind,
    occasionTitle: reminder.occasionTitle,
    scheduledAt: reminder.scheduledAt,
  });
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: giftingKeys.reminderQueuePk(),
        SK: `${reminder.scheduledAt}#${reminder.id}`,
        userId: reminder.userId,
        reminderId: reminder.id,
        status: reminder.status,
      },
    })
  );
  return reminder;
}

export async function createScheduledReminder(input: Omit<GiftReminder, "id" | "token" | "createdAt" | "updatedAt">): Promise<GiftReminder> {
  const timestamp = now();
  const reminder: GiftReminder = {
    ...input,
    id: uuidv4(),
    token: uuidv4().replace(/-/g, ""),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return saveReminder(reminder);
}

export async function listDueReminderQueue(beforeIso: string, limit = 50): Promise<Array<{ userId: string; reminderId: string; sk: string }>> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: CONFIG_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": giftingKeys.reminderQueuePk(),
      },
    })
  );
  return (result.Items ?? [])
    .filter((item) => item.status === "scheduled" && String(item.SK) <= `${beforeIso}~`)
    .slice(0, limit)
    .map((item) => ({
      userId: String(item.userId),
      reminderId: String(item.reminderId),
      sk: String(item.SK),
    }));
}

export async function writeNotificationLog(log: GiftNotificationLog): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: { PK: giftingKeys.notifyLogPk(log.id), SK: giftingKeys.notifyLogSk(), ...log },
    })
  );
  await putAdminIndex(giftingKeys.entityNotifyPk(), `${log.sentAt}#${log.id}`, log);
}

export async function listNotificationLogs(limit = 100): Promise<GiftNotificationLog[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: CONFIG_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": giftingKeys.entityNotifyPk() },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (result.Items ?? []).map((item) => stripKeys(item as Stored<GiftNotificationLog>)) as GiftNotificationLog[];
}

export async function listAdminIndex<T>(pk: string, limit = 100): Promise<T[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: CONFIG_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": pk },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (result.Items ?? []).map((item) => stripKeys(item as Stored<T>)) as T[];
}

async function putAdminIndex(pk: string, sk: string, item: object) {
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: { PK: pk, SK: sk, ...(item as Record<string, unknown>) },
    })
  );
}

export async function incrementAnalytics(field: string, amount = 1): Promise<void> {
  const current = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: giftingKeys.analytics.pk, SK: giftingKeys.analytics.sk },
    })
  );
  const data: Record<string, unknown> = {
    ...(current.Item ?? {}),
    PK: giftingKeys.analytics.pk,
    SK: giftingKeys.analytics.sk,
  };
  data[field] = Number(data[field] ?? 0) + amount;
  data.updatedAt = now();
  await docClient.send(new PutCommand({ TableName: CONFIG_TABLE, Item: data }));
}

export async function getAnalytics(): Promise<Record<string, number>> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: giftingKeys.analytics.pk, SK: giftingKeys.analytics.sk },
    })
  );
  const { PK: _p, SK: _s, updatedAt: _u, ...rest } = result.Item ?? {};
  const numbers: Record<string, number> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (typeof value === "number") numbers[key] = value;
  }
  return numbers;
}

export async function loadCatalogProducts(): Promise<Product[]> {
  const items: Product[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
        FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
        ExpressionAttributeValues: { ":prefix": "PRODUCT#", ":sk": "META" },
        ExclusiveStartKey,
      })
    );
    if (result.Items?.length) items.push(...(result.Items as Product[]));
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey && items.length < 400);
  return items.filter((p) => p.published !== false && (p.inventory ?? 1) > 0);
}

export async function recommendForContext(input: {
  recipient?: GiftRecipient;
  occasionType?: string;
  preferredCategory?: "flowers" | "cake" | "chocolates" | "combo" | "surprise" | "any";
  history?: GiftHistoryEntry[];
  emergency?: boolean;
  avoidSlugs?: string[];
  limit?: number;
}): Promise<GiftRecommendation[]> {
  const products = await loadCatalogProducts();
  return recommendGifts(products, {
    recipient: input.recipient,
    occasionType: input.occasionType,
    preferredCategory: input.preferredCategory ?? input.recipient?.preferences?.preferredGiftCategory,
    history: input.history,
    emergency: input.emergency,
    avoidSlugs: input.avoidSlugs,
    limit: input.limit ?? 6,
  });
}

export async function dashboardOccasions(
  userId: string,
  includeNational: boolean
): Promise<UpcomingOccasionView[]> {
  const [recipients, occasions] = await Promise.all([listRecipients(userId), listOccasions(userId)]);
  return mergeUpcomingOccasions({ recipients, occasions, includeNational, limit: 40 });
}

export function addMonths(iso: string, months: number): string {
  const date = new Date(iso);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString();
}
