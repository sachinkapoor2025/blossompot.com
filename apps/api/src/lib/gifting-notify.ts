import { v4 as uuidv4 } from "uuid";
import type {
  GiftNotificationLog,
  GiftRecipient,
  GiftRecommendation,
  GiftReminder,
  GiftingChannel,
  GiftingSettings,
  GiftingSubscription,
  UpcomingOccasionView,
} from "@blossompot/shared";
import { sendEmail } from "./email";
import { notifyCustomerWhatsApp, whatsappApiConfigured } from "./whatsapp";
import { writeNotificationLog } from "./gifting-store";

const SITE_NAME = "BlossomPot";
const SITE_URL = () => (process.env.SITE_URL ?? "https://www.blossompot.com").replace(/\/$/, "");
const BRAND = "#C23A6B";

function siteUrl(path: string): string {
  return `${SITE_URL()}${path.startsWith("/") ? path : `/${path}`}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function giftingEmailHtml(input: {
  preheader: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  extraHtml?: string;
}): string {
  const cta = input.ctaLabel && input.ctaHref
    ? `<p style="margin:28px 0 8px"><a href="${escapeHtml(input.ctaHref)}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${escapeHtml(input.ctaLabel)}</a></p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(input.title)}</title></head>
<body style="margin:0;background:#f7f2ef;font-family:Georgia,serif;color:#2c1b22">
  <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ef;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:18px;overflow:hidden">
        <tr><td style="background:${BRAND};color:#fff;padding:22px 28px;font-size:20px;font-weight:700">${SITE_NAME}</td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:${BRAND}">${escapeHtml(input.title)}</h1>
          <div style="font-size:16px;line-height:1.6;color:#3f2a32">${input.body}</div>
          ${cta}
          ${input.extraHtml ?? ""}
          <p style="margin:32px 0 0;font-size:13px;color:#8a6b74">Never forget a special occasion again. ${SITE_NAME} remembers the dates and helps you choose the perfect gift.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function occasionReminderCopy(input: {
  customerName?: string;
  recipientName: string;
  occasionTitle: string;
  occasionDate: string;
  hours?: number;
}): { subject: string; text: string; html: string } {
  const who = input.recipientName;
  const subject = `${who}'s occasion is coming up`;
  const hours = input.hours ?? 2;
  const text = [
    `Hi${input.customerName ? ` ${input.customerName}` : ""}`,
    "",
    `${input.occasionTitle} is coming up on ${input.occasionDate}.`,
    `Would you like to send something special? Choose a gift within the next ${hours} hours.`,
    "",
    "Flowers · Cake · Gift combo · Surprise Me",
  ].join("\n");
  const body = `<p>Hi${input.customerName ? ` ${escapeHtml(input.customerName)}` : ""},</p>
    <p><strong>${escapeHtml(input.occasionTitle)}</strong> is coming up on <strong>${escapeHtml(input.occasionDate)}</strong>.</p>
    <p>Would you like to send something special? Choose a gift within the next <strong>${hours} hours</strong>.</p>`;
  return { subject, text, html: giftingEmailHtml({ preheader: subject, title: subject, body }) };
}

export function whatsappOccasionMessage(input: {
  customerName?: string;
  recipientName: string;
  occasionTitle: string;
  occasionDate: string;
  chooseUrl: string;
}): string {
  return `Hi${input.customerName ? ` ${input.customerName}` : ""} 🌸

${input.occasionTitle} is coming up on ${input.occasionDate}.

Would you like to send something special?

🌹 Flowers
🎂 Cake
🎁 Gift
✨ Surprise Me

Choose a gift: ${input.chooseUrl}`;
}

export async function sendGiftingNotification(input: {
  userId: string;
  email?: string;
  phone?: string;
  channel: GiftingChannel;
  settings: GiftingSettings;
  template: string;
  subject: string;
  text: string;
  html: string;
  whatsappMessage: string;
  reminder?: GiftReminder;
  recipient?: GiftRecipient;
}): Promise<{ emailStatus: string; whatsappStatus: string }> {
  const wantEmail = input.channel === "email" || input.channel === "both";
  const wantWhatsApp = input.channel === "whatsapp" || input.channel === "both";
  let emailStatus = "skipped";
  let whatsappStatus = "skipped";

  if (wantEmail && input.email) {
    const result = await sendEmail({
      to: input.email,
      subject: input.subject,
      text: input.text,
      html: input.html,
      mailbox: "orders",
    });
    emailStatus = result.ok ? "sent" : result.skipped ? "skipped" : "failed";
    await writeLog({
      userId: input.userId,
      channel: "email",
      template: input.template,
      status: emailStatus === "sent" ? "sent" : emailStatus === "failed" ? "failed" : "skipped",
      error: result.error,
      reminder: input.reminder,
      recipient: input.recipient,
    });
  }

  if (wantWhatsApp) {
    const configured = input.settings.whatsappEnabled && whatsappApiConfigured();
    if (configured && input.phone) {
      const result = await notifyCustomerWhatsApp({
        phone: input.phone,
        message: input.whatsappMessage,
        context: `gifting:${input.template}`,
      });
      whatsappStatus = result?.ok ? "sent" : result?.skipped ? "skipped" : "failed";
      await writeLog({
        userId: input.userId,
        channel: "whatsapp",
        template: input.template,
        status: whatsappStatus === "sent" ? "sent" : whatsappStatus === "failed" ? "failed" : "skipped",
        error: result?.error,
        reminder: input.reminder,
        recipient: input.recipient,
      });
    } else {
      whatsappStatus = "skipped";
      await writeLog({
        userId: input.userId,
        channel: "whatsapp",
        template: input.template,
        status: "skipped",
        error: configured ? "Missing customer phone" : "WhatsApp API not configured",
        reminder: input.reminder,
        recipient: input.recipient,
      });
    }
  }

  return { emailStatus, whatsappStatus };
}

async function writeLog(input: {
  userId: string;
  channel: "email" | "whatsapp";
  template: string;
  status: GiftNotificationLog["status"];
  error?: string;
  reminder?: GiftReminder;
  recipient?: GiftRecipient;
}) {
  const log: GiftNotificationLog = {
    id: uuidv4(),
    userId: input.userId,
    recipientId: input.recipient?.id ?? input.reminder?.recipientId,
    occasionId: input.reminder?.occasionId,
    reminderId: input.reminder?.id,
    channel: input.channel,
    template: input.template,
    sentAt: new Date().toISOString(),
    status: input.status,
    error: input.error,
    expiresAt: input.reminder?.expiresAt,
  };
  await writeNotificationLog(log);
}

export function subscriptionConfirmationCopy(sub: GiftingSubscription): { subject: string; text: string; html: string } {
  const subject = `Your ${sub.planName} membership is active`;
  const expires = sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("en-US", { dateStyle: "long" }) : "";
  const text = `Thank you for joining ${SITE_NAME}. ${sub.planName} is active${expires ? ` until ${expires}` : ""}. Add your people and we will remember their special dates.`;
  return {
    subject,
    text,
    html: giftingEmailHtml({
      preheader: subject,
      title: "Never forget a special occasion again",
      body: `<p>${escapeHtml(text)}</p><p>Next: add your people, save their dates, and choose how you want to be reminded.</p>`,
      ctaLabel: "Open my Blossom Calendar",
      ctaHref: siteUrl("/account?tab=home"),
    }),
  };
}

export function subscriptionExpiryCopy(input: {
  planName: string;
  expiresAt: string;
  peopleCount: number;
  upcomingCount: number;
  giftsSent: number;
  daysLeft: number;
}): { subject: string; text: string; html: string } {
  const subject =
    input.daysLeft <= 7
      ? "Renew your BlossomPot membership"
      : input.daysLeft <= 14
        ? "Keep your special dates remembered"
        : "Your BlossomPot subscription is ending soon";
  const text = `Your ${input.planName} membership ends on ${input.expiresAt}. You currently have ${input.peopleCount} important people saved and ${input.upcomingCount} upcoming occasions. ${input.giftsSent} gifts sent. Don't lose your reminder calendar.`;
  return {
    subject,
    text,
    html: giftingEmailHtml({
      preheader: subject,
      title: subject,
      body: `<p>${escapeHtml(text)}</p>`,
      ctaLabel: "Renew membership",
      ctaHref: siteUrl("/remember"),
    }),
  };
}

export function recommendationCopy(input: {
  recipientName: string;
  recommendations: GiftRecommendation[];
  chooseUrl: string;
  autoSelected?: boolean;
}): { subject: string; text: string; html: string } {
  const subject = input.autoSelected
    ? `We selected something special for ${input.recipientName}`
    : `Recommended gifts for ${input.recipientName}`;
  const names = input.recommendations.map((r) => r.name).join(", ");
  const text = input.autoSelected
    ? `We didn't hear back, so we selected something special for ${input.recipientName} based on your preferences. Review and approve before payment: ${input.chooseUrl}`
    : `Recommended for ${input.recipientName}: ${names}. Choose a gift: ${input.chooseUrl}`;
  const cards = input.recommendations
    .map(
      (r) =>
        `<p style="margin:10px 0"><strong>${escapeHtml(r.name)}</strong> — ${r.currency} ${r.price.toFixed(0)}<br><span style="color:#8a6b74;font-size:13px">${escapeHtml(r.reasons.join(" · "))}</span></p>`
    )
    .join("");
  return {
    subject,
    text,
    html: giftingEmailHtml({
      preheader: subject,
      title: subject,
      body: `<p>${escapeHtml(input.autoSelected ? `We didn't hear back, so we selected something special for ${input.recipientName} based on your preferences.` : `Recommended for ${input.recipientName}.`)}</p>${cards}<p>Approve the gift before payment — we will not charge automatically.</p>`,
      ctaLabel: "Review gift",
      ctaHref: input.chooseUrl,
    }),
  };
}

export function feedbackRequestCopy(input: { recipientName: string; productName: string; url: string }) {
  const subject = `Did ${input.recipientName} like the gift?`;
  const text = `We delivered ${input.productName}. Did they like it? Loved it / Perfect / It was okay / Not suitable. ${input.url}`;
  return {
    subject,
    text,
    html: giftingEmailHtml({
      preheader: subject,
      title: subject,
      body: `<p>We delivered <strong>${escapeHtml(input.productName)}</strong>.</p><p>A quick note helps us choose even better next time.</p>`,
      ctaLabel: "Share feedback",
      ctaHref: input.url,
    }),
  };
}

export function chooseUrl(token: string): string {
  return siteUrl(`/gifting/choose/${token}`);
}

export function nextMomentLine(occasion?: UpcomingOccasionView | null): string {
  if (!occasion) return "Add your people and we will remember their dates.";
  return `${occasion.title} · ${occasion.date} · ${occasion.daysLeft} day${occasion.daysLeft === 1 ? "" : "s"} remaining`;
}
