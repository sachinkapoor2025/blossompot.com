/**
 * Build assertion: every geo location has non-empty stateAbbr;
 * no user-facing geo copy contains raw IANA zone ids;
 * city nearbyAreas is either empty or ≥3 (distance-gated).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dataPath = join(__dirname, "../apps/web/src/lib/content/geo/locations.data.json");
const raw = JSON.parse(readFileSync(dataPath, "utf8")) as Array<{
  slug: string;
  type: string;
  stateAbbr?: string;
  timezone?: string;
  introParagraph?: string;
  nearbyAreas?: string[];
  localFaqs?: Array<{ q: string; a: string }>;
}>;

const errors: string[] = [];

for (const loc of raw) {
  if (!(loc.stateAbbr || "").trim()) {
    errors.push(`${loc.slug}: missing stateAbbr`);
  }
  const blob =
    (loc.introParagraph || "") +
    " " +
    (loc.localFaqs || []).map((f) => `${f.q} ${f.a}`).join(" ");
  if (/America\/|Pacific\/|Los_Angeles|New_York|Chicago/.test(blob) && /America\/|Pacific\//.test(blob)) {
    errors.push(`${loc.slug}: raw IANA in user-facing copy`);
  }
  if (loc.type === "city") {
    const n = (loc.nearbyAreas || []).length;
    if (n > 0 && n < 3) errors.push(`${loc.slug}: nearbyAreas length ${n} invalid`);
  }
}

if (errors.length) {
  console.error("assert-geo-hygiene: FAIL");
  for (const e of errors.slice(0, 40)) console.error(" ", e);
  process.exit(1);
}
console.log(`assert-geo-hygiene: OK (${raw.length} locations)`);
