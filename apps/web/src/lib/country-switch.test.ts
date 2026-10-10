import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  applyDeliveryCheck,
  countryMenuDestination,
  createSelectionGuard,
  deliverToDestination,
  navigateAfterLocationCommit,
  planLocationCategorySync,
  shouldReconcilePathCountry,
  type DeliveryCheckState,
} from "./country-switch";

const blank: DeliveryCheckState = {
  serviceable: null,
  vendorSlugs: [],
  message: null,
  error: null,
};

describe("country switch navigation", () => {
  it("navigates before the serviceability response resolves", async () => {
    let resolved = false;
    let release: () => void = () => undefined;
    const check = new Promise<void>((resolve) => {
      release = () => {
        resolved = true;
        resolve();
      };
    });
    let navigated = false;

    navigateAfterLocationCommit({
      href: countryMenuDestination("/", "GB", ""),
      commit: () => check,
      navigate: (href) => {
        assert.equal(resolved, false);
        assert.equal(href, "/?country=GB");
        navigated = true;
      },
    });

    assert.equal(navigated, true);
    assert.equal(resolved, false);
    release();
    await check;
    assert.equal(resolved, true);
  });

  it("lets the latest selection win when responses arrive out of order", () => {
    const guard = createSelectionGuard();
    const gb = guard.start();
    const us = guard.start();
    const afterGb = applyDeliveryCheck(blank, {
      latest: guard.isLatest(gb),
      ok: true,
      serviceable: true,
      vendorSlugs: ["gb-vendor"],
      message: "We can deliver to United Kingdom.",
    });
    const afterUs = applyDeliveryCheck(afterGb, {
      latest: guard.isLatest(us),
      ok: true,
      serviceable: true,
      vendorSlugs: ["us-vendor"],
      message: "We can deliver to United States.",
    });

    assert.equal(guard.isLatest(gb), false);
    assert.equal(guard.isLatest(us), true);
    assert.deepEqual(afterGb, blank);
    assert.deepEqual(afterUs, {
      serviceable: true,
      vendorSlugs: ["us-vendor"],
      message: "We can deliver to United States.",
      error: null,
    });
  });

  it("does not let an older response replace the latest serviceability fields", () => {
    const current: DeliveryCheckState = {
      serviceable: true,
      vendorSlugs: ["us-vendor"],
      message: "We can deliver to United States.",
      error: null,
    };
    const next = applyDeliveryCheck(current, {
      latest: false,
      ok: true,
      serviceable: false,
      vendorSlugs: ["gb-vendor"],
      message: "We can deliver to United Kingdom.",
    });
    assert.equal(next, current);
  });

  it("keeps a failed check as a failure", () => {
    const next = applyDeliveryCheck(blank, {
      latest: true,
      ok: false,
      error: "Could not check this location",
    });
    assert.deepEqual(next, {
      serviceable: null,
      vendorSlugs: [],
      message: null,
      error: "Could not check this location",
    });
  });

  it("does not treat a failed location write as a successful navigation", () => {
    let navigated = false;
    let reported: unknown;
    navigateAfterLocationCommit({
      href: "/?country=CA",
      commit: () => {
        throw new Error("Could not save this location");
      },
      navigate: () => {
        navigated = true;
      },
      onCheckError: (error) => {
        reported = error;
      },
    });
    assert.equal(navigated, false);
    assert.equal(reported instanceof Error ? reported.message : "", "Could not save this location");
  });

  it("does not write the page being left over a newer selection", () => {
    assert.equal(shouldReconcilePathCountry({ pathIso: "US", pendingCountry: "GB" }), false);
  });

  it("reconciles the path again once navigation has settled", () => {
    assert.equal(shouldReconcilePathCountry({ pathIso: "GB", pendingCountry: "GB" }), true);
    assert.equal(shouldReconcilePathCountry({ pathIso: "GB", pendingCountry: null }), true);
  });

  it("keeps the homepage dialog on the homepage", () => {
    assert.equal(deliverToDestination("/", "CA", ""), "/?country=CA");
    assert.equal(deliverToDestination("/", "gb", "country=US"), "/?country=GB");
  });

  it("adopts an enabled UK page and still leaves a disabled Canada page alone", () => {
    const uk = planLocationCategorySync({
      pathname: "/flower-delivery-uk",
      savedCountry: "US",
      savedPostal: "90012",
      pendingCountry: null,
      enabledCountryCodes: ["US", "GB"],
    });
    assert.deepEqual(uk, { action: "adopt", countryCode: "GB", postalCode: "" });
    const canada = planLocationCategorySync({
      pathname: "/flower-delivery-canada",
      savedCountry: "US",
      savedPostal: "90012",
      pendingCountry: null,
      enabledCountryCodes: ["US", "GB"],
    });
    assert.deepEqual(canada, { action: "leave", clearPending: false });
  });

  it("does not clear a saved US ZIP when a guide or non-US shop URL opens", () => {
    const saved = { savedCountry: "US", savedPostal: "90012", pendingCountry: null as string | null };
    for (const pathname of ["/flower-delivery-uk", "/locations/canada", "/flowers-to-uk"]) {
      const plan = planLocationCategorySync({ pathname, ...saved });
      assert.deepEqual(plan, { action: "leave", clearPending: false });
    }
    assert.equal(saved.savedPostal, "90012");
  });

  it("keeps the countries menu on the same destination as the delivery dialog", () => {
    const cases: Array<[string, string, string]> = [
      ["/", "CA", ""],
      ["/flowers-to-usa", "GB", ""],
      ["/flower-delivery-usa", "GB", ""],
      ["/cakes", "GB", ""],
      ["/locations", "GB", ""],
      ["/about", "GB", ""],
      ["/flower-delivery-usa", "IN", ""],
    ];
    for (const [pathname, country, search] of cases) {
      assert.equal(
        countryMenuDestination(pathname, country, search),
        deliverToDestination(pathname, country, search),
        `${pathname} ${country}`
      );
    }
    assert.equal(countryMenuDestination("/", "CA", ""), "/?country=CA");
    assert.equal(countryMenuDestination("/flowers-to-usa", "GB", "sort=featured"), "/flowers-to-uk?sort=featured");
    assert.equal(countryMenuDestination("/flower-delivery-usa", "GB", ""), "/flower-delivery-uk");
    assert.equal(countryMenuDestination("/cakes", "GB", ""), "/cakes-to-uk");
    assert.equal(countryMenuDestination("/locations", "GB", ""), "/locations?country=GB");
    assert.equal(countryMenuDestination("/about", "GB", ""), "/about?country=GB");
    assert.equal(countryMenuDestination("/flower-delivery-usa", "IN", ""), "/flower-delivery-usa?country=IN");
  });

  it("offers the countries menu from the enabled country list", () => {
    const header = readFileSync(path.join(__dirname, "../components/Header.tsx"), "utf8");
    assert.equal(header.includes("COUNTRY_GUIDE_HREF"), false);
    assert.match(header, /useGboDeliveryCountries/);
    assert.match(header, /countryMenuDestination\(pathname, countryCode, searchParams\.toString\(\)\)/);
    assert.match(header, /countryMenuDestination\(pathname, c\.countryCode, searchParams\.toString\(\)\)/);
  });
});
