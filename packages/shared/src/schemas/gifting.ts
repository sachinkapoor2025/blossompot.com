import { z } from "zod";

export const GIFTING_RELATIONSHIPS = [
  "wife",
  "husband",
  "mother",
  "father",
  "sister",
  "brother",
  "friend",
  "cousin",
  "colleague",
  "other",
] as const;

export const GIFTING_OCCASION_TYPES = [
  "birthday",
  "anniversary",
  "valentines",
  "mothers_day",
  "fathers_day",
  "rakhi",
  "christmas",
  "friendship_day",
  "first_date",
  "wedding_day",
  "day_we_met",
  "graduation",
  "new_job",
  "baby_arrival",
  "custom",
] as const;

export const GIFTING_GIFT_CATEGORIES = [
  "flowers",
  "cake",
  "chocolates",
  "combo",
  "surprise",
] as const;

export const GIFTING_CHANNELS = ["email", "whatsapp", "both"] as const;

export const GIFTING_FEEDBACK = ["loved", "perfect", "okay", "not_suitable"] as const;

export const GIFTING_PLAN_DURATIONS = [3, 6, 12, 24] as const;

export const GIFTING_REMINDER_KINDS = [
  "occasion",
  "choice_window",
  "choice_expiry",
  "recommendation",
  "feedback",
  "repeat_next_year",
  "subscription_expiry",
] as const;

export const GIFTING_REMINDER_STATUSES = [
  "scheduled",
  "sent",
  "opened",
  "responded",
  "expired",
  "failed",
  "cancelled",
] as const;

export const GIFTING_SUB_STATUSES = [
  "pending_payment",
  "active",
  "expired",
  "cancelled",
  "past_due",
] as const;

export const GIFTING_CHOICE_ACTIONS = [
  "flowers",
  "cake",
  "chocolates",
  "combo",
  "surprise_me",
  "approve_recommendation",
  "try_something_new",
  "send_same",
] as const;

export const relationshipSchema = z.enum(GIFTING_RELATIONSHIPS);
export const occasionTypeSchema = z.enum(GIFTING_OCCASION_TYPES);
export const giftCategorySchema = z.enum(GIFTING_GIFT_CATEGORIES);
export const reminderChannelSchema = z.enum(GIFTING_CHANNELS);
export const giftFeedbackSchema = z.enum(GIFTING_FEEDBACK);
export const giftingPlanDurationSchema = z.union([
  z.literal(3),
  z.literal(6),
  z.literal(12),
  z.literal(24),
]);

const monthDay = z.object({
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
});

export const recipientPreferenceSchema = z.object({
  preferredGiftCategory: giftCategorySchema.optional(),
  favouriteFlower: z.string().max(80).optional(),
  favouriteColour: z.string().max(40).optional(),
  favouriteCakeFlavour: z.string().max(80).optional(),
  budgetMin: z.number().min(0).max(10000).optional(),
  budgetMax: z.number().min(0).max(10000).optional(),
  notes: z.string().max(1000).optional(),
});

export const customDateInputSchema = z.object({
  label: z.string().min(1).max(80),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  occasionType: occasionTypeSchema.optional(),
});

export const recipientCreateSchema = z.object({
  name: z.string().min(1).max(80),
  relationship: relationshipSchema,
  birthday: monthDay.optional(),
  anniversary: monthDay.optional(),
  customDates: z.array(customDateInputSchema).max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  preferences: recipientPreferenceSchema.optional(),
});

export const recipientUpdateSchema = recipientCreateSchema.partial();

export const occasionCreateSchema = z.object({
  recipientId: z.string().min(1).max(80).optional(),
  title: z.string().min(1).max(120),
  occasionType: occasionTypeSchema,
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  year: z.number().int().min(1900).max(2100).optional(),
  recurring: z.boolean().optional(),
  remindNextYear: z.boolean().optional(),
});

export const occasionUpdateSchema = occasionCreateSchema.partial();

export const giftingPrefsUpdateSchema = z.object({
  reminderChannel: reminderChannelSchema,
  autoRecommendEnabled: z.boolean().optional(),
});

export const subscribeInputSchema = z.object({
  planId: z.string().min(1).max(80),
  paymentMethod: z.enum(["stripe", "razorpay"]).optional(),
  reminderChannel: reminderChannelSchema.optional(),
});

export const confirmSubscribeSchema = z.object({
  subscriptionId: z.string().min(1),
  paymentIntentId: z.string().max(120).optional(),
  razorpayPaymentId: z.string().max(120).optional(),
  razorpayOrderId: z.string().max(120).optional(),
  razorpaySignature: z.string().max(500).optional(),
});

export const reminderChoiceSchema = z.object({
  action: z.enum(GIFTING_CHOICE_ACTIONS),
  productSlug: z.string().max(160).optional(),
});

export const giftFeedbackInputSchema = z.object({
  rating: giftFeedbackSchema,
  rememberPreference: z.boolean().optional(),
  note: z.string().max(400).optional(),
});

export const giftHistoryCreateSchema = z.object({
  recipientId: z.string().min(1),
  occasionId: z.string().optional(),
  occasionTitle: z.string().max(120).optional(),
  occasionType: occasionTypeSchema.optional(),
  giftDate: z.string().min(4).max(32),
  productSlug: z.string().min(1).max(160),
  productName: z.string().min(1).max(160),
  amount: z.number().min(0).optional(),
  currency: z.enum(["USD", "INR"]).optional(),
  message: z.string().max(500).optional(),
  orderId: z.string().max(80).optional(),
  remindNextYear: z.boolean().optional(),
});

export const subscriptionPlanInputSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).optional(),
  durationMonths: giftingPlanDurationSchema,
  price: z.number().min(0).max(10000),
  currency: z.enum(["USD", "INR"]).default("USD"),
  compareAtPrice: z.number().min(0).max(10000).optional(),
  benefits: z.array(z.string().max(160)).max(20),
  status: z.enum(["active", "hidden"]).default("active"),
  recommended: z.boolean().optional(),
  discountPercent: z.number().min(0).max(90).optional(),
  renewalEnabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
});

export const subscriptionPlanUpdateSchema = subscriptionPlanInputSchema.partial();

export const giftingSettingsUpdateSchema = z.object({
  reminderOffsetsDays: z.array(z.number().int().min(0).max(90)).min(1).max(6).optional(),
  choiceWindowHours: z.number().min(0.25).max(72).optional(),
  autoSelectEnabled: z.boolean().optional(),
  autoSelectRequiresApproval: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  retentionOffsetsDays: z.array(z.number().int().min(1).max(90)).max(6).optional(),
  nationalOccasionsEnabled: z.boolean().optional(),
  loyalty: z
    .object({
      pointsPerUsd: z.number().min(0).max(100).optional(),
      subscriptionBonus: z.number().int().min(0).max(5000).optional(),
      profileCompleteBonus: z.number().int().min(0).max(500).optional(),
      feedbackBonus: z.number().int().min(0).max(200).optional(),
      repeatOrderBonus: z.number().int().min(0).max(200).optional(),
      referralBonus: z.number().int().min(0).max(500).optional(),
      rewards: z
        .array(
          z.object({
            points: z.number().int().min(1).max(10000),
            label: z.string().min(1).max(80),
            kind: z.enum(["discount", "free_delivery", "gift_upgrade"]),
          })
        )
        .max(12)
        .optional(),
    })
    .optional(),
  streakMilestones: z
    .array(
      z.object({
        gifts: z.number().int().min(1).max(100),
        reward: z.string().max(80),
        bonusPoints: z.number().int().min(0).max(500).optional(),
      })
    )
    .max(10)
    .optional(),
  emailTemplates: z.record(z.string().max(80), z.string().max(20000)).optional(),
  whatsappTemplates: z.record(z.string().max(80), z.string().max(2000)).optional(),
});

export type GiftingRelationship = z.infer<typeof relationshipSchema>;
export type GiftingOccasionType = z.infer<typeof occasionTypeSchema>;
export type GiftingGiftCategory = z.infer<typeof giftCategorySchema>;
export type GiftingChannel = z.infer<typeof reminderChannelSchema>;
export type GiftFeedbackRating = z.infer<typeof giftFeedbackSchema>;
export type RecipientPreference = z.infer<typeof recipientPreferenceSchema>;
export type RecipientCreateInput = z.infer<typeof recipientCreateSchema>;
export type OccasionCreateInput = z.infer<typeof occasionCreateSchema>;
export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanInputSchema>;
export type GiftingSettingsUpdate = z.infer<typeof giftingSettingsUpdateSchema>;

export interface GiftRecipient {
  id: string;
  userId: string;
  name: string;
  relationship: GiftingRelationship;
  birthday?: { month: number; day: number };
  anniversary?: { month: number; day: number };
  customDates?: Array<{
    id: string;
    label: string;
    month: number;
    day: number;
    occasionType?: GiftingOccasionType;
  }>;
  email?: string;
  phone?: string;
  preferences?: RecipientPreference;
  createdAt: string;
  updatedAt: string;
}

export interface GiftOccasion {
  id: string;
  userId: string;
  recipientId?: string;
  title: string;
  occasionType: GiftingOccasionType;
  month: number;
  day: number;
  year?: number;
  recurring: boolean;
  remindNextYear?: boolean;
  lastGiftProductSlug?: string;
  lastGiftProductName?: string;
  lastGiftMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  durationMonths: 3 | 6 | 12 | 24;
  price: number;
  currency: "USD" | "INR";
  compareAtPrice?: number;
  benefits: string[];
  status: "active" | "hidden";
  recommended?: boolean;
  discountPercent?: number;
  renewalEnabled?: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GiftingSubscription {
  id: string;
  userId: string;
  email: string;
  planId: string;
  planName: string;
  durationMonths: number;
  price: number;
  currency: "USD" | "INR";
  status: (typeof GIFTING_SUB_STATUSES)[number];
  startedAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  paymentIntentId?: string;
  razorpayOrderId?: string;
  paymentMethod?: "stripe" | "razorpay";
  autoRenew?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GiftReminder {
  id: string;
  userId: string;
  recipientId?: string;
  occasionId?: string;
  kind: (typeof GIFTING_REMINDER_KINDS)[number];
  status: (typeof GIFTING_REMINDER_STATUSES)[number];
  occasionTitle: string;
  occasionType?: GiftingOccasionType;
  occasionDate: string;
  offsetDays?: number;
  scheduledAt: string;
  sentAt?: string;
  expiresAt?: string;
  channel?: GiftingChannel;
  token: string;
  selectedAction?: (typeof GIFTING_CHOICE_ACTIONS)[number];
  selectedProductSlug?: string;
  recommendedSlugs?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiftHistoryEntry {
  id: string;
  userId: string;
  recipientId: string;
  occasionId?: string;
  occasionTitle?: string;
  occasionType?: GiftingOccasionType;
  giftDate: string;
  productSlug: string;
  productName: string;
  amount?: number;
  currency?: "USD" | "INR";
  message?: string;
  orderId?: string;
  deliveryStatus?: string;
  feedback?: GiftFeedbackRating;
  feedbackNote?: string;
  rememberPreference?: boolean;
  remindNextYear?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GiftNotificationLog {
  id: string;
  userId: string;
  recipientId?: string;
  occasionId?: string;
  reminderId?: string;
  channel: "email" | "whatsapp";
  template: string;
  sentAt: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
  openedAt?: string;
  response?: string;
  selectedGift?: string;
  expiresAt?: string;
}

export interface LoyaltyAccount {
  userId: string;
  points: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  points: number;
  reason: string;
  source: string;
  createdAt: string;
}

export interface GiftStreak {
  userId: string;
  giftCount: number;
  claimedMilestones: number[];
  lastGiftAt?: string;
  updatedAt: string;
}

export interface SavedGiftMessage {
  id: string;
  userId: string;
  recipientId?: string;
  occasionType?: GiftingOccasionType;
  message: string;
  createdAt: string;
}

export interface GiftingPrefs {
  userId: string;
  reminderChannel: GiftingChannel;
  autoRecommendEnabled: boolean;
  updatedAt: string;
}

export interface LoyaltyRewardRule {
  points: number;
  label: string;
  kind: "discount" | "free_delivery" | "gift_upgrade";
}

export interface GiftingSettings {
  reminderOffsetsDays: number[];
  choiceWindowHours: number;
  autoSelectEnabled: boolean;
  autoSelectRequiresApproval: boolean;
  whatsappEnabled: boolean;
  retentionOffsetsDays: number[];
  nationalOccasionsEnabled: boolean;
  loyalty: {
    pointsPerUsd: number;
    subscriptionBonus: number;
    profileCompleteBonus: number;
    feedbackBonus: number;
    repeatOrderBonus: number;
    referralBonus: number;
    rewards: LoyaltyRewardRule[];
  };
  streakMilestones: Array<{ gifts: number; reward: string; bonusPoints?: number }>;
  emailTemplates: Record<string, string>;
  whatsappTemplates: Record<string, string>;
  updatedAt?: string;
}

export interface GiftRecommendation {
  slug: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  categorySlug?: string;
  score: number;
  reasons: string[];
}

export interface UpcomingOccasionView {
  key: string;
  recipientId?: string;
  recipientName?: string;
  relationship?: GiftingRelationship;
  occasionId?: string;
  title: string;
  occasionType: GiftingOccasionType | "national";
  date: string;
  daysLeft: number;
  source: "recipient" | "custom" | "national";
}

export const DEFAULT_GIFTING_SETTINGS: GiftingSettings = {
  reminderOffsetsDays: [10, 7, 3],
  choiceWindowHours: 2,
  autoSelectEnabled: true,
  autoSelectRequiresApproval: true,
  whatsappEnabled: false,
  retentionOffsetsDays: [30, 14, 7],
  nationalOccasionsEnabled: true,
  loyalty: {
    pointsPerUsd: 1,
    subscriptionBonus: 50,
    profileCompleteBonus: 20,
    feedbackBonus: 10,
    repeatOrderBonus: 15,
    referralBonus: 25,
    rewards: [
      { points: 100, label: "Discount", kind: "discount" },
      { points: 250, label: "Free delivery", kind: "free_delivery" },
      { points: 500, label: "Gift upgrade", kind: "gift_upgrade" },
    ],
  },
  streakMilestones: [
    { gifts: 1, reward: "First special moment", bonusPoints: 10 },
    { gifts: 3, reward: "Coupon", bonusPoints: 15 },
    { gifts: 5, reward: "Free delivery", bonusPoints: 25 },
    { gifts: 10, reward: "Gift upgrade", bonusPoints: 50 },
  ],
  emailTemplates: {},
  whatsappTemplates: {},
};

export const DEFAULT_SUBSCRIPTION_PLANS: Array<
  Omit<SubscriptionPlan, "createdAt" | "updatedAt">
> = [
  {
    id: "starter-3m",
    name: "BlossomPot Starter",
    slug: "blossompot-starter",
    durationMonths: 3,
    price: 29,
    currency: "USD",
    benefits: [
      "Occasion reminders for your people",
      "Birthday and anniversary calendar",
      "Personalized gift recommendations",
      "Email reminders",
    ],
    status: "active",
    sortOrder: 1,
  },
  {
    id: "plus-6m",
    name: "BlossomPot Plus",
    slug: "blossompot-plus",
    durationMonths: 6,
    price: 49,
    currency: "USD",
    benefits: [
      "Everything in Starter",
      "WhatsApp reminders when configured",
      "Gift history and preferences",
      "Surprise Me recommendations",
    ],
    status: "active",
    sortOrder: 2,
  },
  {
    id: "care-1y",
    name: "BlossomPot Care",
    slug: "blossompot-care",
    durationMonths: 12,
    price: 79,
    currency: "USD",
    compareAtPrice: 99,
    benefits: [
      "Everything in Plus",
      "Priority member offers",
      "Blossom Points bonus",
      "Repeat-next-year memory",
      "Most complete reminder coverage",
    ],
    status: "active",
    recommended: true,
    sortOrder: 3,
  },
  {
    id: "vip-2y",
    name: "BlossomPot VIP",
    slug: "blossompot-vip",
    durationMonths: 24,
    price: 129,
    currency: "USD",
    compareAtPrice: 158,
    benefits: [
      "Everything in Care",
      "Two-year peace of mind",
      "Highest Blossom Points bonus",
      "VIP member recognition",
    ],
    status: "active",
    sortOrder: 4,
  },
];

export const RELATIONSHIP_LABELS: Record<GiftingRelationship, string> = {
  wife: "Wife",
  husband: "Husband",
  mother: "Mother",
  father: "Father",
  sister: "Sister",
  brother: "Brother",
  friend: "Friend",
  cousin: "Cousin",
  colleague: "Colleague",
  other: "Other",
};

export const OCCASION_TYPE_LABELS: Record<GiftingOccasionType, string> = {
  birthday: "Birthday",
  anniversary: "Anniversary",
  valentines: "Valentine's Day",
  mothers_day: "Mother's Day",
  fathers_day: "Father's Day",
  rakhi: "Rakhi",
  christmas: "Christmas",
  friendship_day: "Friendship Day",
  first_date: "First Date",
  wedding_day: "Wedding Day",
  day_we_met: "The Day We Met",
  graduation: "Graduation",
  new_job: "New Job",
  baby_arrival: "Baby Arrival",
  custom: "Custom Occasion",
};

export const FEEDBACK_LABELS: Record<GiftFeedbackRating, string> = {
  loved: "Loved it",
  perfect: "Perfect",
  okay: "It was okay",
  not_suitable: "Not suitable",
};
