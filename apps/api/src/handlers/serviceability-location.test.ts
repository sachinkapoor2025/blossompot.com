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

  it("does not let a non-US country or its postal code hide the US catalog", () => {
    assert.deepEqual(
      parseLocationQuery(event({ country: "GB", postalCode: "SW1A 1AA", city: "London" })),
      {
        countryCode: "US",
        postalCode: "",
        stateCode: undefined,
        city: undefined,
      }
    );
    assert.deepEqual(parseLocationQuery(event({ country: "CA", zip: "K1A 0B1" })), {
      countryCode: "US",
      postalCode: "",
      stateCode: undefined,
      city: undefined,
    });
  });

  it("ignores an invalid US ZIP instead of filtering the catalog with it", () => {
    assert.equal(parseLocationQuery(event({ country: "US", postalCode: "AB1" })), null);
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

  it("checks public serviceability as the United States", () => {
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
});
