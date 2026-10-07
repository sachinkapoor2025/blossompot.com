import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { cartAvailabilityLocation, parseLocationQuery, publicShoppingServiceability } from "./serviceability";

function event(query: Record<string, string>): APIGatewayProxyEventV2 {
  return { queryStringParameters: query } as APIGatewayProxyEventV2;
}

describe("catalog location query", () => {
  it("keeps a valid US ZIP", () => {
    assert.deepEqual(parseLocationQuery(event({ country: "US", postalCode: "90012" })), {
      countryCode: "US",
      postalCode: "90012",
      stateCode: undefined,
      city: undefined,
    });
  });

  it("keeps a requested delivery country for the enabled-country resolver", () => {
    assert.deepEqual(
      parseLocationQuery(event({ country: "GB", postalCode: "SW1A 1AA", city: "London" })),
      {
        countryCode: "GB",
        postalCode: "SW1A 1AA",
        stateCode: undefined,
        city: "London",
      }
    );
    assert.deepEqual(parseLocationQuery(event({ country: "CA", zip: "K1A 0B1" })), {
      countryCode: "CA",
      postalCode: "K1A 0B1",
      stateCode: undefined,
      city: undefined,
    });
  });

  it("drops an invalid US ZIP instead of filtering the catalog with it", () => {
    assert.deepEqual(parseLocationQuery(event({ country: "US", postalCode: "AB1" })), {
      countryCode: "US",
      postalCode: "",
      stateCode: undefined,
      city: undefined,
    });
  });

  it("clamps a Canada cart query to the United States", () => {
    assert.deepEqual(cartAvailabilityLocation("CA", "K1A 0B1"), {
      countryCode: "US",
      postalCode: "",
    });
    assert.deepEqual(cartAvailabilityLocation("US", "90012"), {
      countryCode: "US",
      postalCode: "90012",
    });
  });

  it("checks public serviceability as the United States when no other country is enabled", () => {
    assert.deepEqual(publicShoppingServiceability({ countryCode: "CA", postalCode: "K1A 0B1" }), {
      countryCode: "US",
      postalCode: "",
    });
    assert.deepEqual(publicShoppingServiceability({ countryCode: "US", postalCode: "90012" }), {
      countryCode: "US",
      postalCode: "90012",
    });
    assert.equal("error" in publicShoppingServiceability({ countryCode: "US", postalCode: "AB1" }), true);
  });

  it("keeps an enabled UK check and still rejects Canada when Canada is disabled", () => {
    assert.deepEqual(
      publicShoppingServiceability({
        countryCode: "GB",
        postalCode: "SW1A 1AA",
        enabledCountryCodes: ["US", "GB"],
      }),
      { countryCode: "GB", postalCode: "SW1A 1AA" }
    );
    assert.deepEqual(
      publicShoppingServiceability({
        countryCode: "CA",
        postalCode: "K1A 0B1",
        enabledCountryCodes: ["US", "GB"],
      }),
      { countryCode: "US", postalCode: "" }
    );
    assert.equal(
      "error" in
        publicShoppingServiceability({
          countryCode: "US",
          enabledCountryCodes: [],
        }),
      true
    );
  });
});
