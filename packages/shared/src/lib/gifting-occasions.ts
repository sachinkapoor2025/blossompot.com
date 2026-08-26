import type {
  GiftOccasion,
  GiftRecipient,
  GiftingOccasionType,
  UpcomingOccasionView,
} from "../schemas/gifting";

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function daysUntil(isoDate: string, from = new Date()): number {
  const target = startOfUtcDay(new Date(`${isoDate}T00:00:00.000Z`));
  const today = startOfUtcDay(from);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Next occurrence of a month/day on or after `from` (UTC). */
export function nextMonthDay(month: number, day: number, from = new Date()): Date {
  const safeDay = Math.min(day, 28);
  const year = from.getUTCFullYear();
  let next = utcDate(year, month, Math.min(day, daysInMonth(year, month)));
  if (startOfUtcDay(next) < startOfUtcDay(from)) {
    const y = year + 1;
    next = utcDate(y, month, Math.min(day === 29 && month === 2 ? safeDay : day, daysInMonth(y, month)));
  }
  return next;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Nth weekday of a month (1 = first, weekday 0 = Sunday). */
export function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = utcDate(year, month, 1);
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return utcDate(year, month, 1 + offset + (n - 1) * 7);
}

export interface NationalOccasion {
  key: string;
  title: string;
  occasionType: GiftingOccasionType;
  date: Date;
}

const RAKHI_BY_YEAR: Record<number, string> = {
  2026: "2026-08-28",
  2027: "2027-08-17",
  2028: "2028-08-05",
  2029: "2029-08-23",
  2030: "2030-08-12",
};

export function nationalOccasionsForYear(year: number): NationalOccasion[] {
  const items: NationalOccasion[] = [
    { key: "new_year", title: "New Year", occasionType: "new_year", date: utcDate(year, 1, 1) },
    { key: "valentines", title: "Valentine's Day", occasionType: "valentines", date: utcDate(year, 2, 14) },
    {
      key: "mothers_day",
      title: "Mother's Day",
      occasionType: "mothers_day",
      date: nthWeekdayOfMonth(year, 5, 0, 2),
    },
    {
      key: "fathers_day",
      title: "Father's Day",
      occasionType: "fathers_day",
      date: nthWeekdayOfMonth(year, 6, 0, 3),
    },
    { key: "chocolate_day", title: "Chocolate Day", occasionType: "chocolate_day", date: utcDate(year, 7, 7) },
    {
      key: "friendship_day",
      title: "Friendship Day",
      occasionType: "friendship_day",
      date: nthWeekdayOfMonth(year, 8, 0, 1),
    },
    { key: "halloween", title: "Halloween", occasionType: "halloween", date: utcDate(year, 10, 31) },
    {
      key: "thanksgiving",
      title: "Thanksgiving",
      occasionType: "thanksgiving",
      date: nthWeekdayOfMonth(year, 11, 4, 4),
    },
    { key: "christmas", title: "Christmas", occasionType: "christmas", date: utcDate(year, 12, 25) },
  ];
  const rakhi = RAKHI_BY_YEAR[year];
  if (rakhi) {
    items.push({
      key: "rakhi",
      title: "Rakhi",
      occasionType: "rakhi",
      date: new Date(`${rakhi}T00:00:00.000Z`),
    });
  }
  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function upcomingNationalOccasions(from = new Date(), limit = 16): UpcomingOccasionView[] {
  const year = from.getUTCFullYear();
  const items = [...nationalOccasionsForYear(year), ...nationalOccasionsForYear(year + 1)]
    .filter((o) => startOfUtcDay(o.date) >= startOfUtcDay(from))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
  return items.map((o) => ({
    key: `national-${o.key}-${toIsoDate(o.date)}`,
    title: o.title,
    occasionType: o.occasionType,
    date: toIsoDate(o.date),
    daysLeft: daysUntil(toIsoDate(o.date), from),
    source: "national",
  }));
}

export function occasionsFromRecipient(recipient: GiftRecipient, from = new Date()): UpcomingOccasionView[] {
  const items: UpcomingOccasionView[] = [];
  if (recipient.birthday) {
    const date = nextMonthDay(recipient.birthday.month, recipient.birthday.day, from);
    items.push({
      key: `${recipient.id}-birthday-${toIsoDate(date)}`,
      recipientId: recipient.id,
      recipientName: recipient.name,
      relationship: recipient.relationship,
      title: `${recipient.name}'s Birthday`,
      occasionType: "birthday",
      date: toIsoDate(date),
      daysLeft: daysUntil(toIsoDate(date), from),
      source: "recipient",
    });
  }
  if (recipient.anniversary) {
    const date = nextMonthDay(recipient.anniversary.month, recipient.anniversary.day, from);
    items.push({
      key: `${recipient.id}-anniversary-${toIsoDate(date)}`,
      recipientId: recipient.id,
      recipientName: recipient.name,
      relationship: recipient.relationship,
      title: `${recipient.name}'s Anniversary`,
      occasionType: "anniversary",
      date: toIsoDate(date),
      daysLeft: daysUntil(toIsoDate(date), from),
      source: "recipient",
    });
  }
  for (const custom of recipient.customDates ?? []) {
    const date = nextMonthDay(custom.month, custom.day, from);
    items.push({
      key: `${recipient.id}-${custom.id}-${toIsoDate(date)}`,
      recipientId: recipient.id,
      recipientName: recipient.name,
      relationship: recipient.relationship,
      title: `${custom.label} — ${recipient.name}`,
      occasionType: custom.occasionType ?? "custom",
      date: toIsoDate(date),
      daysLeft: daysUntil(toIsoDate(date), from),
      source: "custom",
    });
  }
  return items;
}

export function occasionsFromCustom(occasion: GiftOccasion, recipient?: GiftRecipient, from = new Date()): UpcomingOccasionView {
  const date = occasion.recurring
    ? nextMonthDay(occasion.month, occasion.day, from)
    : utcDate(occasion.year ?? from.getUTCFullYear(), occasion.month, occasion.day);
  const dateIso = toIsoDate(date);
  return {
    key: `occ-${occasion.id}-${dateIso}`,
    recipientId: occasion.recipientId,
    recipientName: recipient?.name,
    relationship: recipient?.relationship,
    occasionId: occasion.id,
    title: occasion.title,
    occasionType: occasion.occasionType,
    date: dateIso,
    daysLeft: daysUntil(dateIso, from),
    source: occasion.recipientId ? "recipient" : "custom",
  };
}

export function mergeUpcomingOccasions(input: {
  recipients: GiftRecipient[];
  occasions: GiftOccasion[];
  includeNational?: boolean;
  from?: Date;
  limit?: number;
}): UpcomingOccasionView[] {
  const from = input.from ?? new Date();
  const seen = new Set<string>();
  const all: UpcomingOccasionView[] = [];

  for (const recipient of input.recipients) {
    for (const item of occasionsFromRecipient(recipient, from)) {
      const dedupe = `${item.recipientId}-${item.occasionType}-${item.date}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      all.push(item);
    }
  }

  const recipientsById = new Map(input.recipients.map((r) => [r.id, r]));
  for (const occasion of input.occasions) {
    const view = occasionsFromCustom(occasion, occasion.recipientId ? recipientsById.get(occasion.recipientId) : undefined, from);
    const dedupe = `${view.recipientId ?? "solo"}-${view.occasionType}-${view.date}-${view.title}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    all.push(view);
  }

  if (input.includeNational !== false) {
    all.push(...upcomingNationalOccasions(from, 16));
  }

  return all
    .filter((o) => o.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft || a.title.localeCompare(b.title))
    .slice(0, input.limit ?? 40);
}

export function isRecipientProfileComplete(recipient: GiftRecipient): boolean {
  const prefs = recipient.preferences;
  return Boolean(
    recipient.name &&
      (recipient.birthday || recipient.anniversary || (recipient.customDates?.length ?? 0) > 0) &&
      prefs &&
      (prefs.favouriteFlower || prefs.favouriteColour || prefs.favouriteCakeFlavour || prefs.preferredGiftCategory) &&
      (prefs.budgetMin != null || prefs.budgetMax != null)
  );
}

export function formatMonthDay(month: number, day: number): string {
  return utcDate(2024, month, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
