import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { giftingKeys, daysUntil, type GiftReminder } from "@blossompot/shared";
import { CONFIG_TABLE, docClient, now } from "../lib/db";
import {
  createScheduledReminder,
  dashboardOccasions,
  getGiftingSettings,
  getPrefs,
  getRecipient,
  getSubscription,
  getUserItem,
  incrementAnalytics,
  isSubscriptionActive,
  listDueReminderQueue,
  listHistory,
  listRecipients,
  recommendForContext,
  saveReminder,
} from "../lib/gifting-store";
import {
  chooseUrl,
  occasionReminderCopy,
  recommendationCopy,
  sendGiftingNotification,
  subscriptionExpiryCopy,
  whatsappOccasionMessage,
} from "../lib/gifting-notify";

export async function processGiftingReminders() {
  const settings = await getGiftingSettings();
  const due = await listDueReminderQueue(new Date().toISOString(), 40);
  let sent = 0;
  let failed = 0;

  for (const item of due) {
    const reminder = await getUserItem<GiftReminder>(item.userId, `REMINDER#${item.reminderId}`);
    if (!reminder || reminder.status !== "scheduled") continue;

    const sub = await getSubscription(item.userId);
    if (!isSubscriptionActive(sub)) {
      await saveReminder({ ...reminder, status: "cancelled", updatedAt: now(), error: "Subscription inactive" });
      continue;
    }

    try {
      await dispatchOccasionReminder(reminder, settings);
      sent += 1;
    } catch (err) {
      failed += 1;
      await saveReminder({
        ...reminder,
        status: "failed",
        updatedAt: now(),
        error: err instanceof Error ? err.message : "Send failed",
      });
      await incrementAnalytics("reminderFailed");
    }
  }

  const expiry = await expireChoiceWindows(settings);
  const retention = await processSubscriptionRetention(settings);

  return { sent, failed, expired: expiry.expired, recommended: expiry.recommended, retention, scanned: due.length };
}

async function dispatchOccasionReminder(
  reminder: GiftReminder,
  settings: Awaited<ReturnType<typeof getGiftingSettings>>
) {
  const prefs = await getPrefs(reminder.userId);
  const sub = await getSubscription(reminder.userId);
  const recipient = reminder.recipientId ? await getRecipient(reminder.userId, reminder.recipientId) : null;
  const history = recipient ? await listHistory(reminder.userId, recipient.id) : [];
  const recommendations = await recommendForContext({
    recipient: recipient ?? undefined,
    occasionType: reminder.occasionType,
    history,
    limit: 4,
  });
  const expiresAt = new Date(Date.now() + settings.choiceWindowHours * 3600_000).toISOString();
  const tokenUrl = chooseUrl(reminder.token);
  const copy = occasionReminderCopy({
    customerName: sub?.email?.split("@")[0],
    recipientName: recipient?.name ?? "your person",
    occasionTitle: reminder.occasionTitle,
    occasionDate: reminder.occasionDate,
    hours: settings.choiceWindowHours,
  });
  const extra = recommendationCopy({
    recipientName: recipient?.name ?? "them",
    recommendations,
    chooseUrl: tokenUrl,
  });

  await sendGiftingNotification({
    userId: reminder.userId,
    email: sub?.email,
    phone: recipient?.phone,
    channel: prefs.reminderChannel,
    settings,
    template: "occasion_reminder",
    subject: copy.subject,
    text: `${copy.text}\n\n${extra.text}`,
    html: copy.html,
    whatsappMessage: whatsappOccasionMessage({
      customerName: sub?.email?.split("@")[0],
      recipientName: recipient?.name ?? "your person",
      occasionTitle: reminder.occasionTitle,
      occasionDate: reminder.occasionDate,
      chooseUrl: tokenUrl,
    }),
    reminder,
    recipient: recipient ?? undefined,
  });

  await saveReminder({
    ...reminder,
    status: "sent",
    sentAt: now(),
    expiresAt,
    channel: prefs.reminderChannel,
    recommendedSlugs: recommendations.map((r) => r.slug),
    updatedAt: now(),
  });
  await incrementAnalytics("reminderSent");
}

async function expireChoiceWindows(settings: Awaited<ReturnType<typeof getGiftingSettings>>) {
  const listed = await docClient.send(
    new QueryCommand({
      TableName: CONFIG_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": giftingKeys.entityReminderPk() },
      ScanIndexForward: false,
      Limit: 80,
    })
  );

  let expired = 0;
  let recommended = 0;
  for (const row of listed.Items ?? []) {
    const userId = String(row.userId ?? "");
    const reminderId = String(row.id ?? "");
    if (!userId || !reminderId) continue;
    const reminder = await getUserItem<GiftReminder>(userId, `REMINDER#${reminderId}`);
    if (!reminder) continue;
    if (!reminder.expiresAt || !["sent", "opened"].includes(reminder.status) || reminder.selectedAction) continue;
    if (new Date(reminder.expiresAt).getTime() > Date.now()) continue;

    await saveReminder({ ...reminder, status: "expired", updatedAt: now() });
    expired += 1;
    await incrementAnalytics("noResponse");

    if (!settings.autoSelectEnabled) continue;
    const recipient = reminder.recipientId ? await getRecipient(reminder.userId, reminder.recipientId) : null;
    const history = recipient ? await listHistory(reminder.userId, recipient.id) : [];
    const recommendations = await recommendForContext({
      recipient: recipient ?? undefined,
      occasionType: reminder.occasionType,
      history,
      avoidSlugs: history.map((h) => h.productSlug),
      limit: 3,
    });
    const auto = await createScheduledReminder({
      userId: reminder.userId,
      recipientId: reminder.recipientId,
      occasionId: reminder.occasionId,
      kind: "recommendation",
      status: "sent",
      occasionTitle: reminder.occasionTitle,
      occasionType: reminder.occasionType,
      occasionDate: reminder.occasionDate,
      scheduledAt: now(),
      recommendedSlugs: recommendations.map((r) => r.slug),
      selectedProductSlug: recommendations[0]?.slug,
    });
    const sub = await getSubscription(reminder.userId);
    const prefs = await getPrefs(reminder.userId);
    const copy = recommendationCopy({
      recipientName: recipient?.name ?? "them",
      recommendations,
      chooseUrl: chooseUrl(auto.token),
      autoSelected: true,
    });
    await sendGiftingNotification({
      userId: reminder.userId,
      email: sub?.email,
      phone: recipient?.phone,
      channel: prefs.reminderChannel,
      settings,
      template: "choice_window_expiry",
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
      whatsappMessage: copy.text,
      reminder: auto,
      recipient: recipient ?? undefined,
    });
    recommended += 1;
    await incrementAnalytics("autoRecommended");
  }
  return { expired, recommended };
}

async function processSubscriptionRetention(settings: Awaited<ReturnType<typeof getGiftingSettings>>) {
  const listed = await docClient.send(
    new QueryCommand({
      TableName: CONFIG_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": giftingKeys.entitySubscriptionPk() },
    })
  );

  let sent = 0;
  for (const row of listed.Items ?? []) {
    const userId = String(row.userId ?? "");
    if (!userId) continue;
    const sub = await getSubscription(userId);
    if (!sub || sub.status !== "active" || !sub.expiresAt) continue;
    const left = daysUntil(sub.expiresAt.slice(0, 10));
    if (!settings.retentionOffsetsDays.includes(left)) continue;

    const already = await getUserItem<GiftReminder>(userId, `REMINDER#retain-${left}`);
    if (already) continue;

    const [recipients, upcoming, history, prefs] = await Promise.all([
      listRecipients(userId),
      dashboardOccasions(userId, false),
      listHistory(userId),
      getPrefs(userId),
    ]);
    const copy = subscriptionExpiryCopy({
      planName: sub.planName,
      expiresAt: new Date(sub.expiresAt).toLocaleDateString("en-US", { dateStyle: "long" }),
      peopleCount: recipients.length,
      upcomingCount: upcoming.filter((o) => o.source !== "national").length,
      giftsSent: history.length,
      daysLeft: left,
    });
    await sendGiftingNotification({
      userId,
      email: sub.email,
      channel: prefs.reminderChannel === "whatsapp" ? "both" : prefs.reminderChannel,
      settings,
      template: "subscription_expiry",
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
      whatsappMessage: copy.text,
    });
    await createScheduledReminder({
      userId,
      kind: "subscription_expiry",
      status: "sent",
      occasionTitle: `Membership ends in ${left} days`,
      occasionDate: sub.expiresAt.slice(0, 10),
      scheduledAt: now(),
      offsetDays: left,
    });
    sent += 1;
    await incrementAnalytics("retentionReminder");
  }
  return { sent };
}
