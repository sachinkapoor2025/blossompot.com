import type { APIGatewayProxyEventV2 } from "aws-lambda";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import Stripe from "stripe";
import Razorpay from "razorpay";
import {
  confirmSubscribeSchema,
  giftFeedbackInputSchema,
  giftHistoryCreateSchema,
  giftingPrefsUpdateSchema,
  isRecipientProfileComplete,
  occasionCreateSchema,
  recipientCreateSchema,
  recipientUpdateSchema,
  reminderChoiceSchema,
  subscribeInputSchema,
  type GiftHistoryEntry,
  type GiftRecipient,
  type GiftReminder,
  type GiftingSubscription,
} from "@blossompot/shared";
import { getAuth } from "../lib/auth";
import { badRequest, created, forbidden, notFound, ok, unauthorized } from "../lib/response";
import { now } from "../lib/db";
import { isLoadTestMode } from "../lib/load-test";
import {
  addLoyaltyPoints,
  addMonths,
  createHistory,
  createOccasion,
  createRecipient,
  createScheduledReminder,
  dashboardOccasions,
  deleteOccasion,
  deleteRecipient,
  ensureDefaultPlans,
  getGiftingSettings,
  getLoyalty,
  getPlan,
  getPrefs,
  getRecipient,
  getReminderByToken,
  getStreak,
  getSubscription,
  incrementAnalytics,
  incrementStreak,
  isSubscriptionActive,
  listHistory,
  listLoyaltyTransactions,
  listMessages,
  listOccasions,
  listRecipients,
  listReminders,
  recommendForContext,
  saveMessage,
  savePrefs,
  saveReminder,
  saveStreak,
  saveSubscription,
  updateHistory,
  updateOccasion,
  updateRecipient,
} from "../lib/gifting-store";
import {
  chooseUrl,
  occasionReminderCopy,
  recommendationCopy,
  sendGiftingNotification,
  subscriptionConfirmationCopy,
  whatsappOccasionMessage,
} from "../lib/gifting-notify";

function requireUser(event: APIGatewayProxyEventV2) {
  const auth = getAuth(event);
  if (!auth) return null;
  return auth;
}

function requireActiveSub(sub: GiftingSubscription | null) {
  return isSubscriptionActive(sub);
}

export async function listPublicPlans() {
  const [plans, settings] = await Promise.all([ensureDefaultPlans(), getGiftingSettings()]);
  return ok({
    plans,
    settings: {
      reminderOffsetsDays: settings.reminderOffsetsDays,
      choiceWindowHours: settings.choiceWindowHours,
      whatsappConfigured: settings.whatsappEnabled,
    },
  });
}

export async function getGiftingDashboard(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();

  const [settings, subscription, recipients, occasions, history, loyalty, streak, prefs, reminders] =
    await Promise.all([
      getGiftingSettings(),
      getSubscription(auth.userId),
      listRecipients(auth.userId),
      listOccasions(auth.userId),
      listHistory(auth.userId),
      getLoyalty(auth.userId),
      getStreak(auth.userId),
      getPrefs(auth.userId),
      listReminders(auth.userId),
    ]);

  const upcoming = await mergeSafe(auth.userId, settings.nationalOccasionsEnabled);
  const next = upcoming[0] ?? null;
  const openChoice = reminders.find(
    (r) =>
      (r.status === "sent" || r.status === "opened") &&
      r.expiresAt &&
      new Date(r.expiresAt).getTime() > Date.now() &&
      !r.selectedAction
  );

  return ok({
    subscription,
    subscriptionActive: isSubscriptionActive(subscription),
    recipients,
    occasions,
    upcoming,
    nextOccasion: next,
    history,
    loyalty,
    streak,
    prefs,
    reminders: reminders.slice(-20),
    openChoice,
    settings: {
      choiceWindowHours: settings.choiceWindowHours,
      reminderOffsetsDays: settings.reminderOffsetsDays,
      loyaltyRewards: settings.loyalty.rewards,
      streakMilestones: settings.streakMilestones,
    },
    stats: {
      peopleCount: recipients.length,
      upcomingCount: upcoming.filter((o) => o.source !== "national").length,
      giftsSent: history.length,
      points: loyalty.points,
    },
  });
}

function mergeSafe(userId: string, includeNational: boolean) {
  return dashboardOccasions(userId, includeNational);
}

export async function listMyRecipients(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  return ok({ recipients: await listRecipients(auth.userId) });
}

export async function createMyRecipient(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  if (!requireActiveSub(await getSubscription(auth.userId))) {
    return forbidden("An active BlossomPot membership is required to save people.");
  }
  const parsed = recipientCreateSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const recipient = await createRecipient(auth.userId, parsed.data);
  await scheduleRecipientReminders(auth.userId, recipient);
  if (isRecipientProfileComplete(recipient)) {
    const settings = await getGiftingSettings();
    await addLoyaltyPoints(auth.userId, settings.loyalty.profileCompleteBonus, "Completed recipient profile", "profile");
  }
  return created({ recipient });
}

export async function updateMyRecipient(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const recipientId = event.pathParameters?.recipientId;
  if (!recipientId) return badRequest("Recipient ID required");
  const parsed = recipientUpdateSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const recipient = await updateRecipient(auth.userId, recipientId, parsed.data);
  if (!recipient) return notFound("Recipient not found");
  await scheduleRecipientReminders(auth.userId, recipient);
  return ok({ recipient });
}

export async function deleteMyRecipient(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const recipientId = event.pathParameters?.recipientId;
  if (!recipientId) return badRequest("Recipient ID required");
  const deleted = await deleteRecipient(auth.userId, recipientId);
  if (!deleted) return notFound("Recipient not found");
  return ok({ ok: true });
}

export async function listMyOccasions(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const settings = await getGiftingSettings();
  return ok({
    occasions: await listOccasions(auth.userId),
    upcoming: await dashboardOccasions(auth.userId, settings.nationalOccasionsEnabled),
  });
}

export async function createMyOccasion(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  if (!requireActiveSub(await getSubscription(auth.userId))) {
    return forbidden("An active BlossomPot membership is required to save occasions.");
  }
  const parsed = occasionCreateSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const occasion = await createOccasion(auth.userId, parsed.data);
  const recipient = occasion.recipientId ? await getRecipient(auth.userId, occasion.recipientId) : null;
  await scheduleOccasionReminders(auth.userId, occasion, recipient);
  return created({ occasion });
}

export async function updateMyOccasion(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const occasionId = event.pathParameters?.occasionId;
  if (!occasionId) return badRequest("Occasion ID required");
  const parsed = occasionCreateSchema.partial().safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const occasion = await updateOccasion(auth.userId, occasionId, parsed.data);
  if (!occasion) return notFound("Occasion not found");
  return ok({ occasion });
}

export async function deleteMyOccasion(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const occasionId = event.pathParameters?.occasionId;
  if (!occasionId) return badRequest("Occasion ID required");
  const deleted = await deleteOccasion(auth.userId, occasionId);
  if (!deleted) return notFound("Occasion not found");
  return ok({ ok: true });
}

export async function updateMyPrefs(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const parsed = giftingPrefsUpdateSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const current = await getPrefs(auth.userId);
  const prefs = await savePrefs({
    ...current,
    ...parsed.data,
    userId: auth.userId,
    updatedAt: now(),
  });
  return ok({ prefs });
}

export async function listMyHistory(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const recipientId = event.queryStringParameters?.recipientId;
  return ok({ history: await listHistory(auth.userId, recipientId) });
}

export async function createMyHistory(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const parsed = giftHistoryCreateSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const recipient = await getRecipient(auth.userId, parsed.data.recipientId);
  if (!recipient) return notFound("Recipient not found");
  const entry: GiftHistoryEntry = {
    id: uuidv4(),
    userId: auth.userId,
    ...parsed.data,
    createdAt: now(),
    updatedAt: now(),
  };
  await createHistory(entry);
  if (parsed.data.message) {
    await saveMessage({
      id: uuidv4(),
      userId: auth.userId,
      recipientId: recipient.id,
      occasionType: parsed.data.occasionType,
      message: parsed.data.message,
      createdAt: now(),
    });
  }
  if (parsed.data.remindNextYear && parsed.data.occasionType) {
    const date = new Date(`${parsed.data.giftDate}T00:00:00.000Z`);
    await createOccasion(auth.userId, {
      recipientId: recipient.id,
      title: parsed.data.occasionTitle || `${recipient.name}'s ${parsed.data.occasionType}`,
      occasionType: parsed.data.occasionType,
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      recurring: true,
      remindNextYear: true,
    });
  }
  const settings = await getGiftingSettings();
  await addLoyaltyPoints(auth.userId, settings.loyalty.repeatOrderBonus, "Gift recorded", "gift");
  await incrementStreak(auth.userId);
  await maybeClaimStreak(auth.userId);
  await incrementAnalytics("giftsRecorded");
  return created({ history: entry });
}

export async function submitGiftFeedback(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const historyId = event.pathParameters?.historyId;
  if (!historyId) return badRequest("History ID required");
  const parsed = giftFeedbackInputSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const updated = await updateHistory(auth.userId, historyId, {
    feedback: parsed.data.rating,
    feedbackNote: parsed.data.note,
    rememberPreference: parsed.data.rememberPreference,
  });
  if (!updated) return notFound("Gift history not found");
  const settings = await getGiftingSettings();
  await addLoyaltyPoints(auth.userId, settings.loyalty.feedbackBonus, "Gift feedback", "feedback");
  if (parsed.data.rememberPreference && updated.recipientId) {
    const recipient = await getRecipient(auth.userId, updated.recipientId);
    if (recipient) {
      await updateRecipient(auth.userId, recipient.id, {
        preferences: {
          ...recipient.preferences,
          notes: [recipient.preferences?.notes, parsed.data.note, `Feedback: ${parsed.data.rating} on ${updated.productName}`]
            .filter(Boolean)
            .join(" · ")
            .slice(0, 1000),
        },
      });
    }
  }
  return ok({ history: updated });
}

export async function listMyMessages(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  return ok({ messages: await listMessages(auth.userId) });
}

export async function getMyLoyalty(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const [loyalty, transactions, streak, settings] = await Promise.all([
    getLoyalty(auth.userId),
    listLoyaltyTransactions(auth.userId),
    getStreak(auth.userId),
    getGiftingSettings(),
  ]);
  return ok({ loyalty, transactions, streak, rewards: settings.loyalty.rewards, milestones: settings.streakMilestones });
}

export async function recommendGiftsHandler(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const recipientId = event.queryStringParameters?.recipientId;
  const occasionType = event.queryStringParameters?.occasionType;
  const category = event.queryStringParameters?.category as
    | "flowers"
    | "cake"
    | "chocolates"
    | "combo"
    | "surprise"
    | undefined;
  const emergency = event.queryStringParameters?.emergency === "1";
  const recipient = recipientId ? await getRecipient(auth.userId, recipientId) : null;
  if (recipientId && !recipient) return notFound("Recipient not found");
  const history = recipient ? await listHistory(auth.userId, recipient.id) : [];
  const recommendations = await recommendForContext({
    recipient: recipient ?? undefined,
    occasionType,
    preferredCategory: category,
    history,
    emergency,
    avoidSlugs: history.map((h) => h.productSlug),
  });
  return ok({ recommendations, recipient });
}

export async function getEmergencyGifts(event: APIGatewayProxyEventV2) {
  const recommendations = await recommendForContext({
    emergency: true,
    preferredCategory: (event.queryStringParameters?.category as "flowers" | "cake" | "combo") ?? "any",
    limit: 8,
  });
  return ok({ recommendations });
}

export async function startSubscription(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const parsed = subscribeInputSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  await ensureDefaultPlans();
  const plan = await getPlan(parsed.data.planId);
  if (!plan || plan.status !== "active") return badRequest("Subscription plan is not available");

  const existing = await getSubscription(auth.userId);
  if (isSubscriptionActive(existing)) {
    return badRequest("You already have an active membership.");
  }

  const timestamp = now();
  const subscription: GiftingSubscription = {
    id: uuidv4(),
    userId: auth.userId,
    email: auth.email,
    planId: plan.id,
    planName: plan.name,
    durationMonths: plan.durationMonths,
    price: plan.price,
    currency: plan.currency,
    status: "pending_payment",
    paymentMethod: parsed.data.paymentMethod ?? (plan.currency === "INR" ? "razorpay" : "stripe"),
    autoRenew: plan.renewalEnabled ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (parsed.data.reminderChannel) {
    await savePrefs({
      userId: auth.userId,
      reminderChannel: parsed.data.reminderChannel,
      autoRecommendEnabled: true,
      updatedAt: timestamp,
    });
  }

  const payment = await createSubscriptionPayment(subscription);
  subscription.paymentIntentId = payment.paymentIntentId;
  subscription.razorpayOrderId = payment.razorpayOrderId;
  await saveSubscription(subscription);
  await incrementAnalytics("subscriptionStarted");
  return created({ subscription, payment });
}

export async function confirmSubscription(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const parsed = confirmSubscribeSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const current = await getSubscription(auth.userId);
  if (!current || current.id !== parsed.data.subscriptionId) return notFound("Subscription not found");
  if (isSubscriptionActive(current)) return ok({ subscription: current, alreadyActive: true });

  if (parsed.data.razorpayOrderId && parsed.data.razorpayPaymentId && parsed.data.razorpaySignature) {
    const valid = verifyRazorpaySignature(
      parsed.data.razorpayOrderId,
      parsed.data.razorpayPaymentId,
      parsed.data.razorpaySignature
    );
    if (!valid) return badRequest("Invalid payment signature");
  } else if (parsed.data.paymentIntentId && !isDevPayment(parsed.data.paymentIntentId)) {
    const stripeOk = await verifyStripePayment(parsed.data.paymentIntentId, current.id);
    if (!stripeOk) return badRequest("Payment is not complete yet");
  } else if (!isDevPayment(parsed.data.paymentIntentId ?? current.paymentIntentId ?? "")) {
    return badRequest("Payment confirmation is required");
  }

  const activated = await activateSubscription(current);
  return ok({ subscription: activated });
}

export async function cancelSubscription(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const current = await getSubscription(auth.userId);
  if (!current) return notFound("No membership found");
  const next: GiftingSubscription = {
    ...current,
    status: "cancelled",
    cancelledAt: now(),
    updatedAt: now(),
  };
  await saveSubscription(next);
  await incrementAnalytics("subscriptionCancelled");
  return ok({ subscription: next });
}

export async function getPublicReminder(event: APIGatewayProxyEventV2) {
  const token = event.pathParameters?.token;
  if (!token) return badRequest("Token required");
  const reminder = await getReminderByToken(token);
  if (!reminder) return notFound("Reminder not found");
  const recipient = reminder.recipientId ? await getRecipient(reminder.userId, reminder.recipientId) : null;
  const history = recipient ? await listHistory(reminder.userId, recipient.id) : [];
  const recommendations = await recommendForContext({
    recipient: recipient ?? undefined,
    occasionType: reminder.occasionType,
    history,
    avoidSlugs: history.map((h) => h.productSlug),
  });
  if (reminder.status === "sent") {
    await saveReminder({ ...reminder, status: "opened", updatedAt: now() });
    await incrementAnalytics("reminderOpened");
  }
  const remainingMs = reminder.expiresAt ? new Date(reminder.expiresAt).getTime() - Date.now() : 0;
  return ok({
    reminder: { ...reminder, status: reminder.status === "sent" ? "opened" : reminder.status },
    recipient,
    recommendations,
    remainingMs: Math.max(0, remainingMs),
    expired: remainingMs <= 0 && Boolean(reminder.expiresAt) && !reminder.selectedAction,
    lastGift: history[0] ?? null,
    lastMessage: history.find((h) => h.message)?.message ?? null,
  });
}

export async function choosePublicReminder(event: APIGatewayProxyEventV2) {
  const token = event.pathParameters?.token;
  if (!token) return badRequest("Token required");
  const parsed = reminderChoiceSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const reminder = await getReminderByToken(token);
  if (!reminder) return notFound("Reminder not found");
  const recipient = reminder.recipientId ? await getRecipient(reminder.userId, reminder.recipientId) : null;
  const history = recipient ? await listHistory(reminder.userId, recipient.id) : [];
  const category =
    parsed.data.action === "surprise_me"
      ? "surprise"
      : parsed.data.action === "flowers" ||
          parsed.data.action === "cake" ||
          parsed.data.action === "chocolates" ||
          parsed.data.action === "combo"
        ? parsed.data.action
        : undefined;
  const recommendations = await recommendForContext({
    recipient: recipient ?? undefined,
    occasionType: reminder.occasionType,
    preferredCategory: category,
    history,
    avoidSlugs: parsed.data.action === "try_something_new" ? history.map((h) => h.productSlug) : undefined,
  });
  const selected = parsed.data.productSlug
    ? recommendations.find((r) => r.slug === parsed.data.productSlug) ?? recommendations[0]
    : recommendations[0];

  const updated: GiftReminder = {
    ...reminder,
    status: "responded",
    selectedAction: parsed.data.action,
    selectedProductSlug: selected?.slug,
    recommendedSlugs: recommendations.map((r) => r.slug),
    updatedAt: now(),
  };
  await saveReminder(updated);
  await incrementAnalytics("giftSelection");
  if (parsed.data.action === "surprise_me") await incrementAnalytics("surpriseMe");

  return ok({
    reminder: updated,
    recommendations,
    selected,
    approvalRequired: true,
    checkoutHint:
      selected
        ? `Review ${selected.name} and complete checkout when you are ready. We will not charge automatically.`
        : "No matching gift is available right now. Browse the shop to choose one.",
  });
}

export async function activatePaidSubscriptionById(subscriptionId: string, userId: string) {
  const current = await getSubscription(userId);
  if (!current || current.id !== subscriptionId) return null;
  if (isSubscriptionActive(current)) return current;
  return activateSubscription(current);
}

async function activateSubscription(current: GiftingSubscription): Promise<GiftingSubscription> {
  const startedAt = now();
  const activated: GiftingSubscription = {
    ...current,
    status: "active",
    startedAt,
    expiresAt: addMonths(startedAt, current.durationMonths),
    updatedAt: now(),
  };
  await saveSubscription(activated);
  const settings = await getGiftingSettings();
  await addLoyaltyPoints(current.userId, settings.loyalty.subscriptionBonus, "Membership started", "subscription");
  await incrementAnalytics("subscriptionActivated");
  const copy = subscriptionConfirmationCopy(activated);
  await sendGiftingNotification({
    userId: current.userId,
    email: current.email,
    channel: "email",
    settings,
    template: "subscription_confirmation",
    subject: copy.subject,
    text: copy.text,
    html: copy.html,
    whatsappMessage: `${copy.text} ${SITE_URL()}/account?tab=home`,
  });
  return activated;
}

const SITE_URL = () => (process.env.SITE_URL ?? "https://www.blossompot.com").replace(/\/$/, "");

async function scheduleRecipientReminders(userId: string, recipient: GiftRecipient) {
  const settings = await getGiftingSettings();
  const upcoming = await dashboardOccasions(userId, false);
  const mine = upcoming.filter((o) => o.recipientId === recipient.id);
  for (const item of mine) {
    await scheduleOffsets(userId, settings, {
      recipientId: recipient.id,
      occasionTitle: item.title,
      occasionType: item.occasionType === "national" ? "custom" : item.occasionType,
      occasionDate: item.date,
    });
  }
}

async function scheduleOccasionReminders(
  userId: string,
  occasion: { id: string; title: string; occasionType: GiftReminder["occasionType"]; recipientId?: string },
  recipient: GiftRecipient | null
) {
  const settings = await getGiftingSettings();
  const upcoming = await dashboardOccasions(userId, false);
  const match = upcoming.find((o) => o.occasionId === occasion.id) ?? upcoming.find((o) => o.title === occasion.title);
  if (!match) return;
  await scheduleOffsets(userId, settings, {
    recipientId: recipient?.id ?? occasion.recipientId,
    occasionId: occasion.id,
    occasionTitle: match.title,
    occasionType: occasion.occasionType,
    occasionDate: match.date,
  });
}

export async function scheduleOffsets(
  userId: string,
  settings: Awaited<ReturnType<typeof getGiftingSettings>>,
  input: {
    recipientId?: string;
    occasionId?: string;
    occasionTitle: string;
    occasionType?: GiftReminder["occasionType"];
    occasionDate: string;
  }
) {
  const existing = await listReminders(userId);
  for (const offset of settings.reminderOffsetsDays) {
    const scheduled = new Date(`${input.occasionDate}T12:00:00.000Z`);
    scheduled.setUTCDate(scheduled.getUTCDate() - offset);
    if (scheduled.getTime() < Date.now() - 60_000) continue;
    const scheduledAt = scheduled.toISOString();
    const duplicate = existing.some(
      (r) =>
        r.occasionDate === input.occasionDate &&
        r.offsetDays === offset &&
        r.recipientId === input.recipientId &&
        (r.status === "scheduled" || r.status === "sent")
    );
    if (duplicate) continue;
    await createScheduledReminder({
      userId,
      recipientId: input.recipientId,
      occasionId: input.occasionId,
      kind: "occasion",
      status: "scheduled",
      occasionTitle: input.occasionTitle,
      occasionType: input.occasionType,
      occasionDate: input.occasionDate,
      offsetDays: offset,
      scheduledAt,
    });
  }
}

async function maybeClaimStreak(userId: string) {
  const [streak, settings] = await Promise.all([getStreak(userId), getGiftingSettings()]);
  const unclaimed = settings.streakMilestones.filter(
    (m) => streak.giftCount >= m.gifts && !streak.claimedMilestones.includes(m.gifts)
  );
  if (unclaimed.length === 0) return;
  let points = 0;
  for (const milestone of unclaimed) points += milestone.bonusPoints ?? 0;
  if (points) await addLoyaltyPoints(userId, points, "Gift streak milestone", "streak");
  await saveStreak({
    ...streak,
    claimedMilestones: [...streak.claimedMilestones, ...unclaimed.map((m) => m.gifts)],
    updatedAt: now(),
  });
}

function isDevPayment(id: string): boolean {
  return (
    !id ||
    id.startsWith("pi_dev_") ||
    id.startsWith("pi_loadtest_") ||
    id.startsWith("order_dev_") ||
    process.env.ENVIRONMENT === "local" ||
    process.env.DEV_AUTH_ENABLED === "true"
  );
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

async function createSubscriptionPayment(sub: GiftingSubscription) {
  if (isLoadTestMode()) {
    return { paymentIntentId: `pi_loadtest_${sub.id}`, clientSecret: `pi_loadtest_${sub.id}_secret` };
  }
  if (sub.paymentMethod === "razorpay") {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZOR_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZOR_KEY_SECRET;
    if (!keyId || !keySecret) {
      return { razorpayOrderId: `order_dev_${sub.id}`, razorpayKeyId: keyId ?? "rzp_dev_key" };
    }
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: Math.round(sub.price * 100),
      currency: sub.currency,
      receipt: sub.id.slice(0, 40),
      notes: { type: "gifting_subscription", subscriptionId: sub.id, userId: sub.userId },
    });
    return { razorpayOrderId: order.id, razorpayKeyId: keyId };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { paymentIntentId: `pi_dev_${sub.id}`, clientSecret: `pi_dev_${sub.id}_secret` };
  }
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(sub.price * 100),
    currency: sub.currency.toLowerCase(),
    metadata: { type: "gifting_subscription", subscriptionId: sub.id, userId: sub.userId },
    automatic_payment_methods: { enabled: true },
    receipt_email: sub.email,
  });
  return { paymentIntentId: intent.id, clientSecret: intent.client_secret };
}

async function verifyStripePayment(paymentIntentId: string, subscriptionId: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return isDevPayment(paymentIntentId);
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return intent.status === "succeeded" && intent.metadata?.subscriptionId === subscriptionId;
}

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZOR_KEY_SECRET;
  if (!keySecret) return isDevPayment(orderId);
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected === signature;
}

export async function previewReminderEmail(event: APIGatewayProxyEventV2) {
  const auth = requireUser(event);
  if (!auth) return unauthorized();
  const settings = await getGiftingSettings();
  const recipientName = event.queryStringParameters?.name ?? "Sarah";
  const copy = occasionReminderCopy({
    customerName: auth.email.split("@")[0],
    recipientName,
    occasionTitle: `${recipientName}'s Anniversary`,
    occasionDate: "March 15",
    hours: settings.choiceWindowHours,
  });
  const recs = await recommendForContext({ occasionType: "anniversary", limit: 3 });
  const recCopy = recommendationCopy({
    recipientName,
    recommendations: recs,
    chooseUrl: chooseUrl("preview"),
  });
  return ok({
    occasion: copy,
    recommendation: recCopy,
    whatsapp: whatsappOccasionMessage({
      recipientName,
      occasionTitle: `${recipientName}'s Anniversary`,
      occasionDate: "March 15",
      chooseUrl: chooseUrl("preview"),
    }),
  });
}
