/** Public February special-day URLs. No imports, so routing config can load this file safely. */
export const SPECIAL_DAYS = [
  { id: "rose-day", publicSlug: "rose-day-gifts" },
  { id: "propose-day", publicSlug: "propose-day-gifts" },
  { id: "chocolate-day", publicSlug: "chocolate-day-gifts" },
  { id: "teddy-day", publicSlug: "teddy-day-gifts" },
  { id: "promise-day", publicSlug: "promise-day-gifts" },
  { id: "hug-day", publicSlug: "hug-day-gifts" },
  { id: "kiss-day", publicSlug: "kiss-day-gifts" },
  { id: "valentines-day", publicSlug: "valentines-day-gifts" },
] as const;

export type SpecialDayId = (typeof SPECIAL_DAYS)[number]["id"];
export type SpecialDayPublicSlug = (typeof SPECIAL_DAYS)[number]["publicSlug"];

const BY_PUBLIC = new Map(SPECIAL_DAYS.map((day) => [day.publicSlug, day.id]));
const BY_ID = new Map(SPECIAL_DAYS.map((day) => [day.id, day.publicSlug]));

export function specialDayIdFromPublicSlug(publicSlug: string): SpecialDayId | null {
  return BY_PUBLIC.get(publicSlug as SpecialDayPublicSlug) ?? null;
}

export function specialDayPublicSlug(id: string): SpecialDayPublicSlug | null {
  return BY_ID.get(id as SpecialDayId) ?? null;
}

export function adjacentSpecialDays(id: string): { prev: SpecialDayId | null; next: SpecialDayId | null } {
  const index = SPECIAL_DAYS.findIndex((day) => day.id === id);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? SPECIAL_DAYS[index - 1].id : null,
    next: index < SPECIAL_DAYS.length - 1 ? SPECIAL_DAYS[index + 1].id : null,
  };
}

export function specialDayRewriteRules(): { source: string; destination: string }[] {
  return SPECIAL_DAYS.flatMap((day) => [
    { source: `/${day.publicSlug}`, destination: `/special-days/${day.id}` },
    { source: `/${day.publicSlug}/`, destination: `/special-days/${day.id}` },
  ]);
}
