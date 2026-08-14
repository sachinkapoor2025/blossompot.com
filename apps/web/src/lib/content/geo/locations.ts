/**
 * Geo config for /gifts-to-{slug} pages.
 * Every published location must have nearbyAreas, cutoffTimeLocal, and localFaqs
 * (enriched from seo-locations.data.json + regional defaults).
 */
import {
  getSeoLocation,
  seoLocations,
  type SeoLocation,
} from "@/lib/content/seo-data";
import { getDeliveryPromise } from "@blossompot/shared";

export type GeoFaq = { q: string; a: string };

export type GeoLocation = {
  slug: string;
  city: string;
  state: string;
  stateAbbr: string;
  timezone: string;
  cutoffTimeLocal: string;
  deliveryWindow: string;
  nearbyAreas: string[];
  zipPrefixes: string[];
  localFaqs: GeoFaq[];
  introParagraph: string;
  region: "city" | "state";
};

const STATE_ABBR: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

const STATE_TZ: Record<string, string> = {
  California: "America/Los_Angeles",
  Washington: "America/Los_Angeles",
  Oregon: "America/Los_Angeles",
  Nevada: "America/Los_Angeles",
  Arizona: "America/Phoenix",
  Colorado: "America/Denver",
  Utah: "America/Denver",
  "New Mexico": "America/Denver",
  Texas: "America/Chicago",
  Illinois: "America/Chicago",
  Florida: "America/New_York",
  "New York": "America/New_York",
  "New Jersey": "America/New_York",
  Massachusetts: "America/New_York",
  Georgia: "America/New_York",
  Virginia: "America/New_York",
  Pennsylvania: "America/New_York",
};

const METRO_NEARBY: Record<string, string[]> = {
  "los-angeles": ["Pasadena", "Santa Monica", "Glendale", "Long Beach", "Burbank"],
  "san-francisco": ["Oakland", "Berkeley", "Daly City", "South San Francisco"],
  "san-diego": ["La Jolla", "Chula Vista", "Carlsbad", "Oceanside"],
  "new-york": ["Brooklyn", "Queens", "Jersey City", "Hoboken"],
  chicago: ["Evanston", "Oak Park", "Naperville", "Schaumburg"],
  houston: ["Sugar Land", "The Woodlands", "Pearland", "Katy"],
  dallas: ["Plano", "Frisco", "Arlington", "Fort Worth"],
  miami: ["Coral Gables", "Miami Beach", "Fort Lauderdale", "Homestead"],
  atlanta: ["Decatur", "Marietta", "Sandy Springs", "Alpharetta"],
  boston: ["Cambridge", "Somerville", "Brookline", "Quincy"],
  seattle: ["Bellevue", "Redmond", "Tacoma", "Kirkland"],
  denver: ["Aurora", "Boulder", "Lakewood", "Centennial"],
  phoenix: ["Scottsdale", "Tempe", "Mesa", "Chandler"],
  austin: ["Round Rock", "Cedar Park", "Pflugerville"],
  "new-jersey": ["Jersey City", "Newark", "Princeton", "Edison", "Hoboken"],
  california: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
  texas: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
  florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
};

const ZIP_PREFIX: Record<string, string[]> = {
  "los-angeles": ["900", "901", "902", "910", "911", "912"],
  "san-francisco": ["941", "940"],
  "new-york": ["100", "101", "102", "103", "104", "112"],
  chicago: ["606", "607"],
  houston: ["770", "772"],
  dallas: ["752", "753"],
  miami: ["331", "332"],
  atlanta: ["303", "311"],
  boston: ["021", "022"],
  seattle: ["981"],
  denver: ["802"],
  phoenix: ["850"],
  austin: ["787"],
  california: ["900", "910", "920", "930", "940", "950"],
  texas: ["750", "760", "770", "780", "790"],
  florida: ["320", "330", "340"],
  "new-jersey": ["070", "071", "072", "073", "080", "085"],
};

function stateAbbr(state: string | null | undefined, name: string): string {
  if (state && STATE_ABBR[state]) return STATE_ABBR[state];
  if (STATE_ABBR[name]) return STATE_ABBR[name];
  return "";
}

function timezoneFor(state: string | null | undefined, name: string): string {
  return STATE_TZ[state ?? ""] || STATE_TZ[name] || "America/New_York";
}

function buildFaqs(city: string, state: string, cutoff: string, nearby: string[]): GeoFaq[] {
  const place = state ? `${city}, ${state}` : city;
  const nearbyText = nearby.slice(0, 3).join(", ");
  return [
    {
      q: `What is the same-day cut-off for gifts to ${city}?`,
      a: `For same-day eligible ZIP codes in and around ${place}, order by ${cutoff} local time. Standard USA orders outside same-day coverage typically arrive in 5–7 business days.`,
    },
    {
      q: `Which nearby areas do you serve around ${city}?`,
      a: nearbyText
        ? `We deliver gifts across ${place} and commonly serve nearby areas including ${nearbyText}. Enter the recipient ZIP at checkout to confirm timing.`
        : `We deliver gifts across ${place}. Enter the recipient ZIP at checkout to confirm timing for that address.`,
    },
    {
      q: `Can I send flowers and cakes to ${city}?`,
      a: `Yes — BlossomPot ships flowers, bouquets, cakes, and curated gift hampers to ${place} with domestic USA fulfillment and a gift message option at checkout.`,
    },
  ];
}

function enrich(loc: SeoLocation): GeoLocation {
  const city = loc.name;
  const state = loc.region === "state" ? loc.name : loc.state ?? "";
  const abbr = stateAbbr(loc.state, loc.name);
  const tz = timezoneFor(loc.state, loc.name);
  const cutoff = loc.isCaliforniaWarehouse || state === "California" ? "1:00 PM" : "2:00 PM";
  const nearby =
    METRO_NEARBY[loc.slug] ??
    (loc.state
      ? seoLocations
          .filter((l) => l.state === loc.state && l.slug !== loc.slug && l.region === "city")
          .slice(0, 5)
          .map((l) => l.name)
      : seoLocations
          .filter((l) => l.region === "city" && l.priority === "High" && l.slug !== loc.slug)
          .slice(0, 5)
          .map((l) => l.name));
  const zips = ZIP_PREFIX[loc.slug] ?? (abbr ? [`${abbr}`] : []);
  const promise = getDeliveryPromise(null, null);
  const deliveryWindow = loc.isCaliforniaWarehouse
    ? `West Coast express when ordered before ${cutoff} local; otherwise ${promise.copy.short}`
    : `Standard USA window ${promise.copy.short}; same-day in select ${city} ZIPs before ${cutoff} local`;

  const intro =
    loc.region === "state"
      ? `Send flowers, cakes, and thoughtful gifts across ${city} with BlossomPot. We fulfill domestically in the USA with clear delivery windows, a ${cutoff} local cut-off for same-day eligible ZIPs, and coverage that commonly reaches ${nearby.slice(0, 3).join(", ") || "major metros statewide"}. Whether you are celebrating a birthday, anniversary, or just because, choose an arrangement that feels personal — then add your message at checkout.`
      : `Send flowers, cakes, and thoughtful gifts to ${city}${state ? `, ${state}` : ""} with BlossomPot. Local shoppers and out-of-state senders alike get domestic USA fulfillment, a ${cutoff} ${tz.replace("America/", "")} cut-off for same-day eligible addresses, and delivery that commonly reaches ${nearby.slice(0, 3).join(", ") || "nearby neighborhoods"}. Browse bouquets, celebration cakes, and hampers curated for modern American gifting.`;

  return {
    slug: loc.slug,
    city,
    state,
    stateAbbr: abbr,
    timezone: tz,
    cutoffTimeLocal: cutoff,
    deliveryWindow,
    nearbyAreas: nearby.length ? nearby : [city],
    zipPrefixes: zips.length ? zips : ["000"],
    localFaqs: buildFaqs(city, state, cutoff, nearby),
    introParagraph: intro,
    region: loc.region,
  };
}

const bySlug = new Map(seoLocations.map((l) => [l.slug, enrich(l)]));

export function getGeoLocation(slug: string): GeoLocation | undefined {
  return bySlug.get(slug) ?? (getSeoLocation(slug) ? enrich(getSeoLocation(slug)!) : undefined);
}

export function allGeoLocations(): GeoLocation[] {
  return [...bySlug.values()];
}

export function assertGeoLocationComplete(geo: GeoLocation): boolean {
  return Boolean(
    geo.nearbyAreas?.length &&
      geo.cutoffTimeLocal &&
      geo.localFaqs?.length >= 3 &&
      geo.introParagraph?.length > 80
  );
}

export function geoPageTitle(geo: GeoLocation): string {
  const place =
    geo.region === "state"
      ? geo.city
      : geo.stateAbbr
        ? `${geo.city}, ${geo.stateAbbr}`
        : geo.state
          ? `${geo.city}, ${geo.state}`
          : geo.city;
  return `Send Flowers, Cakes & Gifts to ${place} | Same-Day Delivery | BlossomPot`;
}

export function geoPageH1(geo: GeoLocation): string {
  return `Send Flowers, Cakes & Gifts to ${geo.city}`;
}

export function geoPageDescription(geo: GeoLocation): string {
  const place = geo.state ? `${geo.city}, ${geo.state}` : geo.city;
  return `Order flowers, cakes & gifts to ${place}. Same-day options before ${geo.cutoffTimeLocal} local in select ZIPs; otherwise ${getDeliveryPromise().copy.short}. Secure checkout on BlossomPot.`;
}
