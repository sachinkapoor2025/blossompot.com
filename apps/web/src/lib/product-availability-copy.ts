import {
  CATALOG_VENDOR_UNAVAILABLE_MESSAGE,
  GBO_STOREFRONT_UNAVAILABLE_MESSAGE,
} from "@blossompot/shared";

/**
 * Reasons `GET /products/:slug` already returns on `availability.reason`.
 * Shopping blocks: `productAllowedForNewShopping`.
 * Location blocks: `evaluateProductsForLocation` / `ServiceabilityMatch`.
 */
export const PRODUCT_AVAILABILITY_REASONS = [
  "vendor_disabled",
  "gbo_storefront_disabled",
  "country_not_allowed",
  "no_matching_service_area",
  "denied",
  "inactive_vendor",
  "invalid_location",
] as const;

export type ProductAvailabilityReason = (typeof PRODUCT_AVAILABILITY_REASONS)[number];

export type ProductAvailabilityNotice = {
  heading: string;
  body: string;
  countryMismatch: boolean;
};

const BLOCKING_AVAILABILITY_REASONS = new Set<string>(PRODUCT_AVAILABILITY_REASONS);
const DISABLED_SHOPPING_REASONS = new Set<string>(["vendor_disabled", "gbo_storefront_disabled"]);
const VENDOR_REASONS = new Set<string>(["inactive_vendor"]);
const LOCATION_REASONS = new Set<string>(["no_matching_service_area", "denied"]);

/** Substitute cards on an unavailable product page stay informational. */
export const UNAVAILABLE_PAGE_ALLOWS_PURCHASE = false;

/**
 * A blocking reason contradicts `deliverable: true`. `matched` and an omitted
 * reason stay purchasable when the API explicitly says the product is deliverable.
 */
export function availabilityAllowsPurchase(availability?: {
  deliverable?: boolean;
  reason?: string | null;
} | null): boolean {
  if (availability?.deliverable !== true) return false;
  const reason = availability.reason?.trim() ?? "";
  return !reason || !BLOCKING_AVAILABILITY_REASONS.has(reason);
}

export function productAvailabilityNotice(input: {
  productName: string;
  countryName: string;
  reason?: string | null;
  visibleForCountry: boolean;
}): ProductAvailabilityNotice {
  const name = input.productName.trim() || "This gift";
  const countryName = input.countryName.trim() || "this country";
  const reason = input.reason?.trim() || "";

  if (DISABLED_SHOPPING_REASONS.has(reason)) {
    return {
      heading: "This gift is temporarily unavailable",
      body:
        reason === "gbo_storefront_disabled"
          ? GBO_STOREFRONT_UNAVAILABLE_MESSAGE
          : CATALOG_VENDOR_UNAVAILABLE_MESSAGE,
      countryMismatch: false,
    };
  }

  if (!input.visibleForCountry || reason === "country_not_allowed") {
    return {
      heading: `This gift is not available for ${countryName}`,
      body: `${name} is listed for a different delivery country. Browse gifts that can be sent to ${countryName}.`,
      countryMismatch: true,
    };
  }

  if (VENDOR_REASONS.has(reason)) {
    return {
      heading: "This gift is temporarily unavailable",
      body: CATALOG_VENDOR_UNAVAILABLE_MESSAGE,
      countryMismatch: false,
    };
  }

  if (LOCATION_REASONS.has(reason)) {
    return {
      heading: "This gift is not available for this delivery address",
      body: `${name} is currently not available for delivery to this ZIP code.`,
      countryMismatch: false,
    };
  }

  if (reason === "invalid_location") {
    return {
      heading: "A delivery ZIP code is required",
      body: `Enter a valid delivery ZIP code before ${name} can be purchased.`,
      countryMismatch: false,
    };
  }

  return {
    heading: "Delivery could not be confirmed",
    body: `We could not confirm delivery of ${name} to ${countryName}. It cannot be purchased until availability is verified.`,
    countryMismatch: false,
  };
}
