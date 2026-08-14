import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatOrderNumber,
  isHumanOrderNumber,
  orderNumberPrefixForItems,
  displayOrderRef,
  ORDER_NUMBER_START,
} from "./order-number";
import { VENDOR_ORANGE_COUNTY } from "../constants";

describe("order-number", () => {
  it("formats OC/US sequences from 10001", () => {
    assert.equal(formatOrderNumber("OC", ORDER_NUMBER_START), "OC10001");
    assert.equal(formatOrderNumber("US", 10042), "US10042");
  });

  it("detects human order numbers", () => {
    assert.equal(isHumanOrderNumber("OC10001"), true);
    assert.equal(isHumanOrderNumber("US10999"), true);
    assert.equal(isHumanOrderNumber("449cd53d-8a7e-4494-9479-b3c342380828"), false);
  });

  it("picks OC prefix when cart has orange-county lines", () => {
    assert.equal(
      orderNumberPrefixForItems([{ vendorSlug: VENDOR_ORANGE_COUNTY }]),
      "OC"
    );
    assert.equal(orderNumberPrefixForItems([{ vendorSlug: undefined }]), "US");
  });

  it("prefers orderNumber for display", () => {
    assert.equal(
      displayOrderRef({ orderId: "uuid-here-long", orderNumber: "OC10007" }),
      "OC10007"
    );
  });
});
