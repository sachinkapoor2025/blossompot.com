import { VENDOR_BLOSSOMPOT, VENDOR_ORANGE_COUNTY, VENDOR_GBO } from "../constants";
import { normalizePostal, normalizePrefix } from "./postal-countries";

export const SERVICE_SCOPES = [
  "POSTAL_CODE",
  "POSTAL_PREFIX",
  "CITY",
  "STATE",
  "COUNTRY",
  "RADIUS",
] as const;
export type ServiceScope = (typeof SERVICE_SCOPES)[number];

export const SERVICE_RULE_TYPES = ["ALLOW", "DENY"] as const;
export type ServiceRuleType = (typeof SERVICE_RULE_TYPES)[number];

const SCOPE_WEIGHT: Record<ServiceScope, number> = {
  POSTAL_CODE: 100,
  POSTAL_PREFIX: 80,
  CITY: 60,
  RADIUS: 50,
  STATE: 40,
  COUNTRY: 20,
};

export type VendorServiceArea = {
  areaId: string;
  vendorSlug: string;
  countryCode: string;
  stateCode?: string;
  city?: string;
  postalCode?: string;
  postalPrefix?: string;
  radius?: number;
  radiusUnit?: "mi" | "km";
  originLat?: number;
  originLng?: number;
  scope: ServiceScope;
  ruleType: ServiceRuleType;
  isActive: boolean;
  priority?: number;
};

export type DeliveryLocationInput = {
  countryCode: string;
  postalCode: string;
  stateCode?: string;
  city?: string;
  lat?: number;
  lng?: number;
};

export type NormalizedDeliveryLocation = DeliveryLocationInput & {
  countryCode: string;
  postalNormalized: string;
  postalDisplay: string;
};

export type ServiceabilityMatch = {
  serviceable: boolean;
  reason: "matched" | "denied" | "no_matching_service_area" | "inactive_vendor" | "invalid_location";
  matchedRule?: Pick<VendorServiceArea, "areaId" | "scope" | "ruleType" | "postalCode" | "postalPrefix" | "stateCode" | "city" | "countryCode">;
  vendorSlug: string;
};

function normText(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function normalizeDeliveryLocation(input: DeliveryLocationInput): NormalizedDeliveryLocation {
  const countryCode = input.countryCode.trim().toUpperCase();
  const postalNormalized = normalizePostal(countryCode, input.postalCode);
  return {
    ...input,
    countryCode,
    postalCode: input.postalCode.trim(),
    postalNormalized,
    postalDisplay: input.postalCode.trim(),
    stateCode: input.stateCode?.trim().toUpperCase(),
    city: input.city?.trim(),
  };
}

export function areaMatchesLocation(area: VendorServiceArea, loc: NormalizedDeliveryLocation): boolean {
  if (!area.isActive) return false;
  if (area.countryCode.toUpperCase() !== loc.countryCode) return false;

  switch (area.scope) {
    case "COUNTRY":
      return true;
    case "STATE":
      return Boolean(loc.stateCode && area.stateCode && loc.stateCode === area.stateCode.toUpperCase());
    case "CITY":
      return Boolean(loc.city && area.city && normText(loc.city) === normText(area.city));
    case "POSTAL_CODE": {
      const want = area.postalCode ? normalizePostal(area.countryCode, area.postalCode) : "";
      return Boolean(want && want === loc.postalNormalized);
    }
    case "POSTAL_PREFIX": {
      const prefix = area.postalPrefix ? normalizePrefix(area.postalPrefix) : "";
      return Boolean(prefix && loc.postalNormalized.startsWith(prefix));
    }
    case "RADIUS": {
      if (
        area.originLat == null ||
        area.originLng == null ||
        loc.lat == null ||
        loc.lng == null ||
        !area.radius
      ) {
        return false;
      }
      const miles = haversineMiles(area.originLat, area.originLng, loc.lat, loc.lng);
      const limit = area.radiusUnit === "km" ? area.radius * 0.621371 : area.radius;
      return miles <= limit;
    }
    default:
      return false;
  }
}

function specificity(area: VendorServiceArea): number {
  return SCOPE_WEIGHT[area.scope] + (area.priority ?? 0);
}

export function checkVendorServiceability(
  vendorSlug: string,
  areas: VendorServiceArea[],
  location: DeliveryLocationInput,
  vendorActive = true
): ServiceabilityMatch {
  if (!vendorActive) {
    return { serviceable: false, reason: "inactive_vendor", vendorSlug };
  }
  if (!location.countryCode?.trim() || !location.postalCode?.trim()) {
    return { serviceable: false, reason: "invalid_location", vendorSlug };
  }
  const loc = normalizeDeliveryLocation(location);
  const matching = areas.filter((a) => a.vendorSlug === vendorSlug && areaMatchesLocation(a, loc));
  const hasVendorAreas = areas.some((a) => a.vendorSlug === vendorSlug && a.isActive);
  const denies = matching.filter((a) => a.ruleType === "DENY").sort((a, b) => specificity(b) - specificity(a));
  if (denies[0]) {
    return {
      serviceable: false,
      reason: "denied",
      vendorSlug,
      matchedRule: pickRule(denies[0]),
    };
  }
  const allows = matching.filter((a) => a.ruleType === "ALLOW").sort((a, b) => specificity(b) - specificity(a));
  if (allows[0]) {
    return {
      serviceable: true,
      reason: "matched",
      vendorSlug,
      matchedRule: pickRule(allows[0]),
    };
  }
  if (isGlobalFulfillmentVendor(vendorSlug) && !hasVendorAreas) {
    return {
      serviceable: true,
      reason: "matched",
      vendorSlug,
      matchedRule: {
        areaId: "gbo-global",
        scope: "COUNTRY",
        ruleType: "ALLOW",
        countryCode: loc.countryCode,
      },
    };
  }
  return { serviceable: false, reason: "no_matching_service_area", vendorSlug };
}

/** GBO delivers to 200+ countries; used until admin stores explicit coverage rules. */
export function isGlobalFulfillmentVendor(vendorSlug: string): boolean {
  return vendorSlug === VENDOR_GBO;
}

function pickRule(area: VendorServiceArea): NonNullable<ServiceabilityMatch["matchedRule"]> {
  return {
    areaId: area.areaId,
    scope: area.scope,
    ruleType: area.ruleType,
    postalCode: area.postalCode,
    postalPrefix: area.postalPrefix,
    stateCode: area.stateCode,
    city: area.city,
    countryCode: area.countryCode,
  };
}

export function getServiceableVendors(
  areas: VendorServiceArea[],
  location: DeliveryLocationInput,
  activeVendorSlugs: string[]
): ServiceabilityMatch[] {
  const unique = [...new Set(activeVendorSlugs)];
  return unique
    .map((slug) => checkVendorServiceability(slug, areas, location, true))
    .filter((m) => m.serviceable);
}

export function fulfillmentVendorSlug(product: { vendorSlug?: string | null }): string {
  const slug = product.vendorSlug?.trim();
  return slug || VENDOR_BLOSSOMPOT;
}

export function isProductDeliverableToLocation(
  product: { vendorSlug?: string | null; published?: boolean; inventory?: number },
  areas: VendorServiceArea[],
  location: DeliveryLocationInput,
  activeVendorSlugs: Set<string>
): ServiceabilityMatch {
  const vendorSlug = fulfillmentVendorSlug(product);
  if (product.published === false || (product.inventory ?? 1) <= 0) {
    return { serviceable: false, reason: "inactive_vendor", vendorSlug };
  }
  const active =
    vendorSlug === VENDOR_BLOSSOMPOT ||
    vendorSlug === VENDOR_GBO ||
    activeVendorSlugs.has(vendorSlug);
  return checkVendorServiceability(vendorSlug, areas, location, active);
}

/** Built-in nationwide US coverage for BlossomPot catalog SKUs (no marketplace vendor). */
export function defaultBlossompotAreas(): VendorServiceArea[] {
  return [
    {
      areaId: "default-bp-us",
      vendorSlug: VENDOR_BLOSSOMPOT,
      countryCode: "US",
      scope: "COUNTRY",
      ruleType: "ALLOW",
      isActive: true,
      priority: 0,
    },
  ];
}

/** Orange County local prefixes — used until admin overrides exist. */
export function defaultOrangeCountyAreas(): VendorServiceArea[] {
  return ["926", "927", "928", "906", "907"].map((prefix) => ({
    areaId: `default-oc-${prefix}`,
    vendorSlug: VENDOR_ORANGE_COUNTY,
    countryCode: "US",
    stateCode: "CA",
    postalPrefix: prefix,
    scope: "POSTAL_PREFIX" as const,
    ruleType: "ALLOW" as const,
    isActive: true,
    priority: 10,
  }));
}

export function describeMatch(match: ServiceabilityMatch): string {
  if (!match.matchedRule) {
    return match.reason === "denied" ? "Excluded by a deny rule" : "No matching active service area";
  }
  const r = match.matchedRule;
  if (r.scope === "POSTAL_CODE") return `${r.countryCode} postal ${r.postalCode}`;
  if (r.scope === "POSTAL_PREFIX") return `${r.countryCode} prefix ${r.postalPrefix}`;
  if (r.scope === "CITY") return `${r.city}`;
  if (r.scope === "STATE") return `state ${r.stateCode}`;
  if (r.scope === "COUNTRY") return `country ${r.countryCode}`;
  return r.scope;
}
