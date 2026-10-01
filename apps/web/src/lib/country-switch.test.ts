import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COUNTRY_GUIDE_HREF } from "./gbo-delivery-countries";
import {
  applyDeliveryCheck,
  countryMenuDestination,
  createSelectionGuard,
  deliverToDestination,
  navigateAfterLocationCommit,
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
      href: countryMenuDestination("GB", COUNTRY_GUIDE_HREF.GB),
      commit: () => check,
      navigate: (href) => {
        assert.equal(resolved, false);
        assert.equal(href, "/flower-delivery-uk?country=GB");
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

  it("keeps the five country-menu guide destinations", () => {
    assert.equal(countryMenuDestination("US", COUNTRY_GUIDE_HREF.US), "/flower-delivery-usa?country=US");
    assert.equal(countryMenuDestination("GB", COUNTRY_GUIDE_HREF.GB), "/flower-delivery-uk?country=GB");
    assert.equal(countryMenuDestination("CA", COUNTRY_GUIDE_HREF.CA), "/flower-delivery-canada?country=CA");
    assert.equal(countryMenuDestination("AU", COUNTRY_GUIDE_HREF.AU), "/flower-delivery-australia?country=AU");
    assert.equal(countryMenuDestination("AE", COUNTRY_GUIDE_HREF.AE), "/flower-delivery-uae?country=AE");
    assert.equal(countryMenuDestination("FR"), "/?country=FR");
  });
});
