import { api } from "./api";
import type {
  GiftHistoryEntry,
  GiftOccasion,
  GiftRecipient,
  GiftRecommendation,
  GiftReminder,
  GiftStreak,
  GiftingPrefs,
  GiftingSettings,
  GiftingSubscription,
  LoyaltyAccount,
  LoyaltyTransaction,
  MembershipSelectedEvent,
  SavedGiftMessage,
  SubscribeInput,
  SubscriptionPlan,
  UpcomingOccasionView,
} from "@blossompot/shared";

export interface GiftingDashboard {
  subscription: GiftingSubscription | null;
  subscriptionActive: boolean;
  recipients: GiftRecipient[];
  occasions: GiftOccasion[];
  upcoming: UpcomingOccasionView[];
  nextOccasion: UpcomingOccasionView | null;
  history: GiftHistoryEntry[];
  loyalty: LoyaltyAccount;
  streak: GiftStreak;
  prefs: GiftingPrefs;
  reminders: GiftReminder[];
  openChoice: GiftReminder | null;
  settings: {
    choiceWindowHours: number;
    reminderOffsetsDays: number[];
    loyaltyRewards: GiftingSettings["loyalty"]["rewards"];
    streakMilestones: GiftingSettings["streakMilestones"];
  };
  stats: {
    peopleCount: number;
    upcomingCount: number;
    giftsSent: number;
    points: number;
  };
}

export function giftingApi(token: string, sessionId: string) {
  const auth = { token, sessionId };
  return {
    dashboard: () => api<GiftingDashboard>("/gifting/dashboard", auth),
    recipients: () => api<{ recipients: GiftRecipient[] }>("/gifting/recipients", auth),
    createRecipient: (body: unknown) =>
      api<{ recipient: GiftRecipient }>("/gifting/recipients", { ...auth, method: "POST", body: JSON.stringify(body) }),
    updateRecipient: (id: string, body: unknown) =>
      api<{ recipient: GiftRecipient }>(`/gifting/recipients/${id}`, { ...auth, method: "PUT", body: JSON.stringify(body) }),
    deleteRecipient: (id: string) =>
      api<{ ok: boolean }>(`/gifting/recipients/${id}`, { ...auth, method: "DELETE" }),
    occasions: () =>
      api<{ occasions: GiftOccasion[]; upcoming: UpcomingOccasionView[] }>("/gifting/occasions", auth),
    createOccasion: (body: unknown) =>
      api<{ occasion: GiftOccasion }>("/gifting/occasions", { ...auth, method: "POST", body: JSON.stringify(body) }),
    deleteOccasion: (id: string) =>
      api<{ ok: boolean }>(`/gifting/occasions/${id}`, { ...auth, method: "DELETE" }),
    updatePrefs: (body: unknown) =>
      api<{ prefs: GiftingPrefs }>("/gifting/prefs", { ...auth, method: "PUT", body: JSON.stringify(body) }),
    history: (recipientId?: string) =>
      api<{ history: GiftHistoryEntry[] }>(
        `/gifting/history${recipientId ? `?recipientId=${encodeURIComponent(recipientId)}` : ""}`,
        auth
      ),
    createHistory: (body: unknown) =>
      api<{ history: GiftHistoryEntry }>("/gifting/history", { ...auth, method: "POST", body: JSON.stringify(body) }),
    feedback: (historyId: string, body: unknown) =>
      api<{ history: GiftHistoryEntry }>(`/gifting/history/${historyId}/feedback`, {
        ...auth,
        method: "POST",
        body: JSON.stringify(body),
      }),
    messages: () => api<{ messages: SavedGiftMessage[] }>("/gifting/messages", auth),
    loyalty: () =>
      api<{
        loyalty: LoyaltyAccount;
        transactions: LoyaltyTransaction[];
        streak: GiftStreak;
        rewards: GiftingSettings["loyalty"]["rewards"];
        milestones: GiftingSettings["streakMilestones"];
      }>("/gifting/loyalty", auth),
    recommend: (query: string) =>
      api<{ recommendations: GiftRecommendation[]; recipient?: GiftRecipient }>(`/gifting/recommend?${query}`, auth),
    subscribe: (body: SubscribeInput) =>
      api<{
        subscription: GiftingSubscription;
        payment: { paymentIntentId?: string; clientSecret?: string; razorpayOrderId?: string; razorpayKeyId?: string };
      }>("/gifting/subscribe", { ...auth, method: "POST", body: JSON.stringify(body) }),
    confirm: (body: unknown) =>
      api<{ subscription: GiftingSubscription }>("/gifting/subscribe/confirm", {
        ...auth,
        method: "POST",
        body: JSON.stringify(body),
      }),
    cancel: () =>
      api<{ subscription: GiftingSubscription }>("/gifting/subscribe/cancel", { ...auth, method: "POST" }),
  };
}

export function fetchPublicPlans() {
  return api<{
    plans: SubscriptionPlan[];
    settings: { reminderOffsetsDays: number[]; choiceWindowHours: number; whatsappConfigured: boolean };
  }>("/gifting/plans");
}

export function fetchMembershipEvents(query: { planId?: string; startDate: string; durationMonths: number }) {
  const params = new URLSearchParams({
    startDate: query.startDate,
    durationMonths: String(query.durationMonths),
  });
  if (query.planId) params.set("planId", query.planId);
  return api<{
    startDate: string;
    durationMonths: number;
    endDate: string;
    events: Array<MembershipSelectedEvent & { description?: string; group?: string; needsDate?: boolean }>;
  }>(`/gifting/membership/events?${params.toString()}`);
}

export function fetchEmergencyGifts(category?: string) {
  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  return api<{ recommendations: GiftRecommendation[] }>(`/gifting/emergency${q}`);
}

export function fetchReminder(token: string) {
  return api<{
    reminder: GiftReminder;
    recipient: GiftRecipient | null;
    recommendations: GiftRecommendation[];
    remainingMs: number;
    expired: boolean;
    lastGift: GiftHistoryEntry | null;
    lastMessage: string | null;
  }>(`/gifting/reminders/${token}`);
}

export function chooseReminder(token: string, body: unknown) {
  return api<{
    reminder: GiftReminder;
    recommendations: GiftRecommendation[];
    selected?: GiftRecommendation;
    approvalRequired: boolean;
    checkoutHint: string;
  }>(`/gifting/reminders/${token}/choose`, { method: "POST", body: JSON.stringify(body) });
}
