import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DELIVERY_COUNTRIES,
  SHOPPING_COUNTRY_ISO,
  clampShoppingCountry,
  defaultOrangeCountyAreas,
  getDeliveryCountry,
} from "@blossompot/shared";
import { shoppingCountryOptions } from "./gbo-delivery-countries";
import {
  GLOBAL_COUNTRY_REQUIRED_MESSAGE,
  applyStoredGlobalCountries,
  applyVendorDeliveryCountries,
  filterCountryChoices,
  formatDeliveryCountryList,
  globalCountrySaveRequest,
  toggleCountryChoice,
  vendorCountrySaveRequest,
} from "./admin-country-management";

const catalogName = (code: string) => getDeliveryCountry(code)?.countryName;

describe("global country admin", () => {
  it("loads configured countries with the United States enabled and other catalog countries disabled", () => {
    const rows = applyStoredGlobalCountries([{ countryCode: "US", enabled: true }]);
    assert.equal(rows.length, DELIVERY_COUNTRIES.length);
    assert.equal(rows.find((row) => row.countryCode === "US")?.selected, true);
    assert.equal(rows.find((row) => row.countryCode === "GB")?.selected, false);
    assert.equal(rows.find((row) => row.countryCode === "CA")?.selected, false);
    assert.equal(rows.find((row) => row.countryCode === "AU")?.selected, false);
    assert.equal(rows.find((row) => row.countryCode === "AE")?.selected, false);
    const canada = DELIVERY_COUNTRIES.find((country) => country.countryCode === "CA");
    assert.equal(canada?.enabled, true);
    assert.equal(rows.find((row) => row.countryCode === "CA")?.selected, false);
  });

  it("enables and disables the United Kingdom without changing other countries", () => {
    const initial = applyStoredGlobalCountries([{ countryCode: "US", enabled: true }]);
    const enabled = toggleCountryChoice(initial, "GB", true);
    assert.equal(enabled.find((row) => row.countryCode === "GB")?.selected, true);
    assert.equal(enabled.find((row) => row.countryCode === "US")?.selected, true);
    assert.equal(enabled.find((row) => row.countryCode === "CA")?.selected, false);
    const disabled = toggleCountryChoice(enabled, "gb", false);
    assert.equal(disabled.find((row) => row.countryCode === "GB")?.selected, false);
    assert.equal(disabled.find((row) => row.countryCode === "US")?.selected, true);
  });

  it("sends the complete country configuration", () => {
    const rows = toggleCountryChoice(
      applyStoredGlobalCountries([{ countryCode: "US", enabled: true }]),
      "GB",
      true
    );
    const request = globalCountrySaveRequest(rows);
    assert.equal("error" in request, false);
    if ("error" in request) return;
    assert.equal(request.path, "/admin/catalog-countries");
    assert.equal(request.method, "PUT");
    assert.equal(request.body.countries.length, DELIVERY_COUNTRIES.length);
    assert.deepEqual(
      request.body.countries.find((country) => country.countryCode === "US"),
      { countryCode: "US", enabled: true }
    );
    assert.deepEqual(
      request.body.countries.find((country) => country.countryCode === "GB"),
      { countryCode: "GB", enabled: true }
    );
    assert.deepEqual(
      request.body.countries.find((country) => country.countryCode === "CA"),
      { countryCode: "CA", enabled: false }
    );
    assert.equal(
      request.body.countries.some((country) => !("deliveryCountries" in country)),
      true
    );
  });

  it("rejects zero enabled countries", () => {
    const rows = applyStoredGlobalCountries([{ countryCode: "US", enabled: true }]).map((row) => ({
      ...row,
      selected: false,
    }));
    const request = globalCountrySaveRequest(rows);
    assert.deepEqual(request, { error: GLOBAL_COUNTRY_REQUIRED_MESSAGE });
  });

  it("searches the delivery catalog by name and code", () => {
    const rows = applyStoredGlobalCountries([{ countryCode: "US", enabled: true }]);
    const unitedKingdom = filterCountryChoices(rows, "United Kingdom");
    assert.deepEqual(
      unitedKingdom.map((row) => row.countryCode),
      ["GB"]
    );
    assert.deepEqual(
      filterCountryChoices(rows, "canada").map((row) => row.countryCode),
      ["CA"]
    );
    assert.deepEqual(
      filterCountryChoices(rows, "Australia").map((row) => row.countryCode),
      ["AU"]
    );
    assert.deepEqual(
      filterCountryChoices(rows, "emirates").map((row) => row.countryCode),
      ["AE"]
    );
    assert.equal(unitedKingdom[0]?.countryName, catalogName("GB"));
    assert.equal(filterCountryChoices(rows, "ae")[0]?.countryName, catalogName("AE"));
  });

  it("uses delivery-catalog names", () => {
    const rows = applyStoredGlobalCountries([{ countryCode: "US", enabled: true }]);
    for (const country of DELIVERY_COUNTRIES) {
      assert.equal(
        rows.find((row) => row.countryCode === country.countryCode)?.countryName,
        country.countryName
      );
    }
    assert.equal(formatDeliveryCountryList(["US", "GB"]), `${catalogName("US")}, ${catalogName("GB")}`);
  });
});

describe("vendor delivery countries", () => {
  it("shows the vendor's current delivery countries with the United States selected", () => {
    const rows = applyVendorDeliveryCountries(["US"]);
    assert.equal(rows.find((row) => row.countryCode === "US")?.selected, true);
    assert.equal(rows.find((row) => row.countryCode === "GB")?.selected, false);
    assert.equal(rows.find((row) => row.countryCode === "US")?.countryName, catalogName("US"));
    assert.equal(formatDeliveryCountryList(["US"]), catalogName("US"));
  });

  it("selects the United Kingdom and several countries without forcing the United States", () => {
    const withKingdom = toggleCountryChoice(applyVendorDeliveryCountries(["US"]), "GB", true);
    assert.equal(withKingdom.find((row) => row.countryCode === "US")?.selected, true);
    assert.equal(withKingdom.find((row) => row.countryCode === "GB")?.selected, true);
    const several = toggleCountryChoice(toggleCountryChoice(withKingdom, "CA", true), "US", false);
    const request = vendorCountrySaveRequest("blossompot", true, several);
    assert.equal("error" in request, false);
    if ("error" in request) return;
    assert.equal(request.path, "/admin/catalog-vendors/blossompot");
    assert.equal(request.method, "PUT");
    assert.deepEqual(request.body, {
      enabled: true,
      deliveryCountries: ["CA", "GB"],
    });
    assert.equal(request.body.deliveryCountries.includes("US"), false);
    assert.equal("countries" in request.body, false);
  });

  it("preserves a disabled vendor and does not write global countries", () => {
    const rows = toggleCountryChoice(applyVendorDeliveryCountries(["US"]), "GB", true);
    const request = vendorCountrySaveRequest("orange-county", false, rows);
    assert.equal("error" in request, false);
    if ("error" in request) return;
    assert.deepEqual(request.body, {
      enabled: false,
      deliveryCountries: ["US", "GB"],
    });
    assert.equal(request.path.startsWith("/admin/catalog-vendors/"), true);
    assert.equal(request.path.includes("catalog-countries"), false);
  });

  it("rejects an enabled vendor with no delivery countries", () => {
    const rows = applyVendorDeliveryCountries(["US"]).map((row) => ({ ...row, selected: false }));
    assert.deepEqual(vendorCountrySaveRequest("fnp", true, rows), {
      error: "An enabled vendor needs at least one delivery country.",
    });
    const disabled = vendorCountrySaveRequest("fnp", false, rows);
    assert.equal("error" in disabled, false);
    if ("error" in disabled) return;
    assert.deepEqual(disabled.body.deliveryCountries, []);
  });
});

describe("storefront regression", () => {
  it("keeps shopping in the United States and Orange County ZIP prefixes", () => {
    assert.equal(clampShoppingCountry("GB"), "US");
    assert.equal(clampShoppingCountry("CA"), SHOPPING_COUNTRY_ISO);
    const selector = shoppingCountryOptions().map((country) => country.countryCode);
    for (const code of ["US", "GB", "CA", "AU", "AE"]) {
      assert.equal(selector.includes(code), true, code);
    }
    assert.deepEqual(
      defaultOrangeCountyAreas().map((area) => area.postalPrefix),
      ["926", "927", "928", "906", "907"]
    );
  });
});
