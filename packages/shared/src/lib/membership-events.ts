import {
  CUSTOM_PLAN_DURATION_MAX,
  CUSTOM_PLAN_DURATION_MIN,
  OCCASION_TYPE_LABELS,
  type GiftingOccasionType,
  type MembershipSelectedEvent,
  type SubscriptionPlan,
} from "../schemas/gifting";
import { nextMonthDay, nthWeekdayOfMonth, toIsoDate } from "./gifting-occasions";

export type MembershipEventGroup = "romance" | "family" | "festival" | "personal";

export const MEMBERSHIP_EVENT_GROUP_LABELS: Record<MembershipEventGroup, string> = {
  romance: "Romance",
  family: "Family",
  festival: "Festivals",
  personal: "Birthdays & personal dates",
};

export type MembershipEventKind = "fixed" | "nth_weekday" | "lunar" | "personal";

export interface MembershipEventDefinition {
  key: string;
  title: string;
  occasionType: GiftingOccasionType;
  kind: MembershipEventKind;
  group: MembershipEventGroup;
  description: string;
  month?: number;
  day?: number;
  weekday?: number;
  nth?: number;
  /** year → YYYY-MM-DD for lunar / moving festivals */
  lunarDates?: Record<number, string>;
}

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseIsoDate(iso: string): Date {
  return startOfUtcDay(new Date(`${iso}T00:00:00.000Z`));
}

/** Known Raksha Bandhan dates so lunar festivals stay accurate without a full calendar lib. */
const RAKHI_DATES: Record<number, string> = {
  2026: "2026-08-28",
  2027: "2027-08-17",
  2028: "2028-08-05",
  2029: "2029-08-23",
  2030: "2030-08-12",
};

/**
 * Catalog of membership reminder events. Add a row here to offer a new occasion
 * in the signup journey without changing the wizard or payment flow.
 */
export const MEMBERSHIP_EVENT_CATALOG: MembershipEventDefinition[] = [
  {
    key: "valentines",
    title: "Valentine's Day",
    occasionType: "valentines",
    kind: "fixed",
    group: "romance",
    month: 2,
    day: 14,
    description: "February 14 — romantic flowers, chocolates, and surprise gifts.",
  },
  {
    key: "chocolate_day",
    title: "Chocolate Day",
    occasionType: "chocolate_day",
    kind: "fixed",
    group: "romance",
    month: 7,
    day: 7,
    description: "World Chocolate Day on July 7 — a sweet extra reminder.",
  },
  {
    key: "birthday",
    title: "Birthdays",
    occasionType: "birthday",
    kind: "personal",
    group: "personal",
    description: "We’ll remind you before each saved birthday in your membership window.",
  },
  {
    key: "anniversary",
    title: "Anniversaries",
    occasionType: "anniversary",
    kind: "personal",
    group: "personal",
    description: "We’ll remind you before each saved anniversary in your membership window.",
  },
  {
    key: "mothers_day",
    title: "Mother's Day",
    occasionType: "mothers_day",
    kind: "nth_weekday",
    group: "family",
    month: 5,
    weekday: 0,
    nth: 2,
    description: "Second Sunday of May.",
  },
  {
    key: "fathers_day",
    title: "Father's Day",
    occasionType: "fathers_day",
    kind: "nth_weekday",
    group: "family",
    month: 6,
    weekday: 0,
    nth: 3,
    description: "Third Sunday of June.",
  },
  {
    key: "friendship_day",
    title: "Friendship Day",
    occasionType: "friendship_day",
    kind: "nth_weekday",
    group: "festival",
    month: 8,
    weekday: 0,
    nth: 1,
    description: "First Sunday of August.",
  },
  {
    key: "rakhi",
    title: "Rakhi",
    occasionType: "rakhi",
    kind: "lunar",
    group: "festival",
    lunarDates: RAKHI_DATES,
    description: "Raksha Bandhan — date follows the lunar calendar.",
  },
  {
    key: "halloween",
    title: "Halloween",
    occasionType: "halloween",
    kind: "fixed",
    group: "festival",
    month: 10,
    day: 31,
    description: "October 31 festive gifting.",
  },
  {
    key: "thanksgiving",
    title: "Thanksgiving",
    occasionType: "thanksgiving",
    kind: "nth_weekday",
    group: "festival",
    month: 11,
    weekday: 4,
    nth: 4,
    description: "Fourth Thursday of November.",
  },
  {
    key: "christmas",
    title: "Christmas",
    occasionType: "christmas",
    kind: "fixed",
    group: "festival",
    month: 12,
    day: 25,
    description: "December 25.",
  },
  {
    key: "new_year",
    title: "New Year",
    occasionType: "new_year",
    kind: "fixed",
    group: "festival",
    month: 1,
    day: 1,
    description: "January 1.",
  },
];

export function todayIsoDate(from = new Date()): string {
  return toIsoDate(startOfUtcDay(from));
}

export function addCalendarMonthsIso(iso: string, months: number): string {
  const date = parseIsoDate(iso);
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return toIsoDate(utcDate(targetYear, targetMonth + 1, Math.min(day, lastDay)));
}

export function membershipWindow(startIso: string, durationMonths: number): { start: Date; end: Date; endIso: string } {
  const start = parseIsoDate(startIso);
  const endIso = addCalendarMonthsIso(startIso, durationMonths);
  const end = parseIsoDate(endIso);
  return { start, end, endIso };
}

export function durationLabel(months: number): string {
  if (months === 12) return "1 Year";
  if (months === 24) return "2 Years";
  if (months === 1) return "1 Month";
  return `${months} Months`;
}

export function planDisplayName(plan: Pick<SubscriptionPlan, "name" | "isCustom" | "durationMonths">): string {
  if (plan.isCustom) return "Custom Plan";
  return plan.name;
}

export function formatMembershipDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function customPlanPrice(months: number, plans: SubscriptionPlan[]): number {
  const safeMonths = Math.min(CUSTOM_PLAN_DURATION_MAX, Math.max(CUSTOM_PLAN_DURATION_MIN, Math.round(months)));
  const anchors = plans
    .filter((p) => !p.isCustom && p.status === "active")
    .sort((a, b) => a.durationMonths - b.durationMonths);
  if (anchors.length === 0) return Math.max(1, safeMonths * 10);
  const exact = anchors.find((p) => p.durationMonths === safeMonths);
  if (exact) return exact.price;
  const higher = anchors.find((p) => p.durationMonths >= safeMonths) ?? anchors[anchors.length - 1]!;
  const lower =
    [...anchors].reverse().find((p) => p.durationMonths <= safeMonths) ?? anchors[0]!;
  if (lower.id === higher.id) {
    return Math.max(1, Math.round((higher.price / higher.durationMonths) * safeMonths));
  }
  const span = higher.durationMonths - lower.durationMonths;
  const t = span <= 0 ? 0 : (safeMonths - lower.durationMonths) / span;
  return Math.max(1, Math.round(lower.price + t * (higher.price - lower.price)));
}

export function resolvePlanDurationMonths(
  plan: SubscriptionPlan,
  customDurationMonths?: number
): number {
  if (plan.isCustom) {
    const n = customDurationMonths ?? plan.durationMonths;
    return Math.min(CUSTOM_PLAN_DURATION_MAX, Math.max(CUSTOM_PLAN_DURATION_MIN, Math.round(n)));
  }
  return plan.durationMonths;
}

export function resolvePlanPrice(
  plan: SubscriptionPlan,
  plans: SubscriptionPlan[],
  customDurationMonths?: number
): number {
  if (!plan.isCustom) return plan.price;
  return customPlanPrice(resolvePlanDurationMonths(plan, customDurationMonths), plans);
}

function datedOccurrence(def: MembershipEventDefinition, year: number): Date | null {
  if (def.kind === "fixed" && def.month && def.day) {
    return utcDate(year, def.month, def.day);
  }
  if (def.kind === "nth_weekday" && def.month != null && def.weekday != null && def.nth != null) {
    return nthWeekdayOfMonth(year, def.month, def.weekday, def.nth);
  }
  if (def.kind === "lunar") {
    const iso = def.lunarDates?.[year];
    return iso ? parseIsoDate(iso) : null;
  }
  return null;
}

function occurrencesInWindow(def: MembershipEventDefinition, start: Date, end: Date): Date[] {
  const found: Date[] = [];
  for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year++) {
    const date = datedOccurrence(def, year);
    if (!date) continue;
    const day = startOfUtcDay(date);
    if (day >= start && day <= end) found.push(day);
  }
  found.sort((a, b) => a.getTime() - b.getTime());
  return found;
}

export interface EligibleMembershipEvent extends MembershipSelectedEvent {
  description: string;
  group: MembershipEventGroup;
  needsDate?: boolean;
}

function longPlan(durationMonths: number): boolean {
  return durationMonths >= 12;
}

export function eligibleMembershipEvents(input: {
  startDate: string;
  durationMonths: number;
  customEvents?: Array<{ title: string; month: number; day: number; occasionType?: GiftingOccasionType }>;
}): EligibleMembershipEvent[] {
  const { start, end } = membershipWindow(input.startDate, input.durationMonths);
  const includeAllCatalog = longPlan(input.durationMonths);
  const items: EligibleMembershipEvent[] = [];
  const seen = new Set<string>();

  const push = (event: EligibleMembershipEvent) => {
    const dedupe = `${event.key}|${event.date ?? ""}`;
    if (seen.has(dedupe)) return;
    seen.add(dedupe);
    items.push(event);
  };

  for (const def of MEMBERSHIP_EVENT_CATALOG) {
    if (def.kind === "personal") {
      if (includeAllCatalog) {
        push({
          key: def.key,
          title: def.title,
          occasionType: def.occasionType,
          source: "personal",
          recurring: true,
          description: def.description,
          group: def.group,
          needsDate: false,
        });
      } else {
        push({
          key: def.key,
          title: def.title,
          occasionType: def.occasionType,
          source: "personal",
          recurring: true,
          description: `${def.description} Add a date in your membership window, or skip.`,
          group: def.group,
          needsDate: true,
        });
      }
      continue;
    }

    const dates = occurrencesInWindow(def, start, end);
    if (dates.length === 0) continue;
    for (const date of dates) {
      const iso = toIsoDate(date);
      push({
        key: `${def.key}-${iso}`,
        title: def.title,
        occasionType: def.occasionType,
        date: iso,
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        source: "catalog",
        recurring: true,
        description: def.description,
        group: def.group,
      });
    }
  }

  for (const custom of input.customEvents ?? []) {
    const next = nextMonthDay(custom.month, custom.day, start);
    if (next > end) continue;
    const iso = toIsoDate(next);
    const type = custom.occasionType ?? "custom";
    push({
      key: `custom-${iso}-${custom.title.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
      title: custom.title,
      occasionType: type,
      date: iso,
      month: custom.month,
      day: custom.day,
      source: "custom",
      recurring: true,
      description: "A date you added for this membership.",
      group: "personal",
    });
  }

  return items.sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date) || a.title.localeCompare(b.title);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });
}

export function dedupeSelectedEvents(events: MembershipSelectedEvent[]): MembershipSelectedEvent[] {
  const seen = new Set<string>();
  const out: MembershipSelectedEvent[] = [];
  for (const event of events) {
    const dedupe = `${event.key}|${event.date ?? ""}|${event.occasionType}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push(event);
  }
  return out;
}

export function toPersistedEvents(events: EligibleMembershipEvent[]): MembershipSelectedEvent[] {
  return dedupeSelectedEvents(
    events.map((event) => ({
      key: event.key,
      title: event.title,
      occasionType: event.occasionType,
      date: event.date,
      month: event.month,
      day: event.day,
      source: event.source,
      recurring: event.recurring ?? true,
    }))
  );
}

export function resolveMembershipEvents(input: {
  startDate: string;
  durationMonths: number;
  selectedEvents?: MembershipSelectedEvent[];
  skipEvents?: boolean;
  customEvents?: Array<{ title: string; month: number; day: number; occasionType?: GiftingOccasionType }>;
}): { eligible: EligibleMembershipEvent[]; selected: MembershipSelectedEvent[] } {
  const eligible = eligibleMembershipEvents({
    startDate: input.startDate,
    durationMonths: input.durationMonths,
    customEvents: input.customEvents,
  });
  if (input.skipEvents || !input.selectedEvents?.length) {
    const defaults = eligible.filter((e) => !e.needsDate);
    return { eligible, selected: toPersistedEvents(defaults.length ? defaults : eligible) };
  }

  const eligibleKeys = new Set(eligible.map((e) => e.key));
  const { start, end } = membershipWindow(input.startDate, input.durationMonths);
  const selected: MembershipSelectedEvent[] = [];

  for (const event of input.selectedEvents) {
    if (event.source === "custom") {
      if (!event.date && event.month && event.day) {
        const next = nextMonthDay(event.month, event.day, start);
        if (next > end) continue;
        selected.push({ ...event, date: toIsoDate(next) });
        continue;
      }
      if (event.date) {
        const day = parseIsoDate(event.date);
        if (day < start || day > end) continue;
        selected.push(event);
      }
      continue;
    }
    if (!eligibleKeys.has(event.key) && event.source !== "personal") continue;
    if (event.date) {
      const day = parseIsoDate(event.date);
      if (day < start || day > end) continue;
    }
    selected.push(event);
  }

  return { eligible, selected: dedupeSelectedEvents(selected) };
}

export function occasionTypeLabel(type: GiftingOccasionType): string {
  return OCCASION_TYPE_LABELS[type] ?? type;
}

export function reminderChannelLabel(channel: "email" | "whatsapp" | "both"): string {
  if (channel === "both") return "Email + WhatsApp";
  if (channel === "whatsapp") return "WhatsApp";
  return "Email";
}

export function groupEligibleEvents(events: EligibleMembershipEvent[]): Array<{
  group: MembershipEventGroup;
  label: string;
  events: EligibleMembershipEvent[];
}> {
  const order: MembershipEventGroup[] = ["romance", "family", "festival", "personal"];
  return order
    .map((group) => ({
      group,
      label: MEMBERSHIP_EVENT_GROUP_LABELS[group],
      events: events.filter((event) => event.group === group),
    }))
    .filter((section) => section.events.length > 0);
}

export const MEMBERSHIP_JOURNEY_STEPS = [
  { id: 1, key: "plan", label: "Plan" },
  { id: 2, key: "events", label: "Events" },
  { id: 3, key: "reminders", label: "Reminders" },
  { id: 4, key: "review", label: "Review" },
  { id: 5, key: "payment", label: "Payment" },
] as const;
