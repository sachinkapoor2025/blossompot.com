import { SHOPPING_COUNTRY_ISO } from "@blossompot/shared";
import {
  countryIsoFromPathname,
  normalizePathname,
  preserveShopQuery,
  shopPathForLocation,
} from "./location-seo-urls";

export type DeliveryCheckState = {
  serviceable: boolean | null;
  vendorSlugs: string[];
  message: string | null;
  error: string | null;
};

export type DeliveryCheckUpdate = {
  latest: boolean;
  ok: boolean;
  serviceable?: boolean;
  vendorSlugs?: string[];
  message?: string | null;
  error?: string | null;
};

/** Monotonic selection id. An older serviceability response must not win. */
export function createSelectionGuard() {
  let latest = 0;
  return {
    start(): number {
      latest += 1;
      return latest;
    },
    isLatest(id: number): boolean {
      return id === latest;
    },
  };
}

/**
 * Apply a serviceability result only when it belongs to the latest selection.
 * A failed check stays a failure: it does not become a successful empty result.
 */
export function applyDeliveryCheck(previous: DeliveryCheckState, update: DeliveryCheckUpdate): DeliveryCheckState {
  if (!update.latest) return previous;
  if (!update.ok) {
    return {
      serviceable: null,
      vendorSlugs: [],
      message: null,
      error: update.error?.trim() || "Could not check this location",
    };
  }
  return {
    serviceable: update.serviceable ?? false,
    vendorSlugs: update.vendorSlugs ?? [],
    message: update.message ?? null,
    error: null,
  };
}

/** Countries menu: featured countries keep their guide path; every other country stays on `/`. */
export function countryMenuDestination(countryCode: string, guideHref?: string): string {
  const iso = countryCode.trim().toUpperCase();
  const path = guideHref?.split("?")[0] || "/";
  return `${path}?country=${iso}`;
}

/** Deliver-to dialog. Homepage stays on `/?country=`, because `/` is location-exempt. */
export function deliverToDestination(pathname: string, countryCode: string, search: string): string {
  const iso = countryCode.trim().toUpperCase();
  const nextPath = shopPathForLocation(pathname, iso);
  const next = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (nextPath !== normalizePathname(pathname)) next.delete("country");
  else next.set("country", iso);
  const qs = next.toString();
  return qs ? `${nextPath}?${qs}` : nextPath;
}

/**
 * Cookie write, then navigation, while the serviceability promise is still running.
 * A throw from the write itself does not navigate and is not reported as a successful check.
 */
export function navigateAfterLocationCommit(input: {
  href: string;
  commit: () => Promise<unknown> | void;
  navigate: (href: string) => void;
  onCheckError?: (error: unknown) => void;
}): void {
  let check: Promise<unknown> | void;
  try {
    check = input.commit();
  } catch (err) {
    input.onCheckError?.(err);
    return;
  }
  input.navigate(input.href);
  if (check && typeof (check as Promise<unknown>).then === "function") {
    void (check as Promise<unknown>).catch((err) => input.onCheckError?.(err));
  }
}

/**
 * While a selection is pending, the page being left must not write its country back.
 * Once the path shows the selected country, normal reconciliation runs again.
 */
export function shouldReconcilePathCountry(input: {
  pathIso: string | null;
  pendingCountry: string | null;
}): boolean {
  if (input.pendingCountry && input.pathIso !== input.pendingCountry) return false;
  return true;
}

export type LocationSyncPlan =
  | { action: "leave"; clearPending: boolean }
  | { action: "adopt"; countryCode: string; postalCode: string }
  | { action: "rewrite"; href: string; clearPending: boolean };

/**
 * A page country is adopted only when it is globally enabled.
 * With no list, only the USA is adoptable, so a guide URL does not clear a saved US location.
 */
export function planLocationCategorySync(input: {
  pathname: string;
  search?: string;
  searchCountry?: string | null;
  savedCountry?: string | null;
  savedPostal?: string;
  pendingCountry?: string | null;
  enabledCountryCodes?: readonly string[];
}): LocationSyncPlan {
  const pathIso = countryIsoFromPathname(input.pathname, input.searchCountry);
  const pending = input.pendingCountry ?? null;
  const enabled = new Set(
    (input.enabledCountryCodes ?? [SHOPPING_COUNTRY_ISO]).map((code) => code.trim().toUpperCase())
  );
  if (pathIso && !enabled.has(pathIso)) return { action: "leave", clearPending: false };
  const clearPending = Boolean(pathIso && pending && pathIso === pending);
  if (!shouldReconcilePathCountry({ pathIso, pendingCountry: pending })) {
    return { action: "leave", clearPending };
  }
  if (pathIso && input.savedCountry !== pathIso) {
    return { action: "adopt", countryCode: pathIso, postalCode: "" };
  }
  const search = input.search ?? "";
  const desired = preserveShopQuery(
    shopPathForLocation(input.pathname, input.savedCountry ?? pathIso ?? null),
    search
  );
  const current = preserveShopQuery(input.pathname, search);
  if (desired === current) return { action: "leave", clearPending };
  return { action: "rewrite", href: desired, clearPending };
}
