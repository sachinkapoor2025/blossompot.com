import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDER_STATUS } from "../constants";
import {
  mapCarrierTrackingPhase,
  mergeTrackingEvents,
  orderStatusForCarrierPhase,
  shouldAdvanceOrderStatus,
  isActivelyTrackedStatus,
  customerTimelineStepIndex,
  CARRIER_TRACKING_PHASE,
  TRACKING_POLL_STATUSES,
} from "./carrier-tracking";

describe("mapCarrierTrackingPhase", () => {
  it("maps delivered mailbox copy", () => {
    assert.equal(
      mapCarrierTrackingPhase({
        status: "Delivered",
        statusDetail: "Delivered, In/At Mailbox",
      }),
      CARRIER_TRACKING_PHASE.DELIVERED
    );
  });

  it("maps out for delivery and in transit", () => {
    assert.equal(
      mapCarrierTrackingPhase({ status: "Out for Delivery" }),
      CARRIER_TRACKING_PHASE.OUT_FOR_DELIVERY
    );
    assert.equal(
      mapCarrierTrackingPhase({ status: "In Transit", statusDetail: "Moving Through Network" }),
      CARRIER_TRACKING_PHASE.IN_TRANSIT
    );
  });

  it("maps Orange County free-text USPS scan lines", () => {
    assert.equal(
      mapCarrierTrackingPhase({
        status: "Arrived at USPS Regional Destination Facility",
      }),
      CARRIER_TRACKING_PHASE.IN_TRANSIT
    );
    assert.equal(
      orderStatusForCarrierPhase(
        mapCarrierTrackingPhase({
          status: "Arrived at USPS Regional Destination Facility",
        })
      ),
      ORDER_STATUS.IN_TRANSIT
    );
    assert.equal(
      orderStatusForCarrierPhase(
        mapCarrierTrackingPhase({ status: "Delivered, In/At Mailbox" })
      ),
      ORDER_STATUS.DELIVERED
    );
  });

  it("maps accepted / label created", () => {
    assert.equal(
      mapCarrierTrackingPhase({ statusDetail: "USPS in possession of item" }),
      CARRIER_TRACKING_PHASE.UNKNOWN
    );
    assert.equal(
      mapCarrierTrackingPhase({ status: "Accepted", statusDetail: "Origin Acceptance" }),
      CARRIER_TRACKING_PHASE.SHIPPED
    );
    assert.equal(
      mapCarrierTrackingPhase({ statusDetail: "Shipping Label Created, USPS Awaiting Item" }),
      CARRIER_TRACKING_PHASE.LABEL_CREATED
    );
  });

  it("maps exceptions", () => {
    assert.equal(
      mapCarrierTrackingPhase({ statusDetail: "Delivery Exception — Notice Left" }),
      CARRIER_TRACKING_PHASE.DELIVERY_EXCEPTION
    );
  });
});

describe("shouldAdvanceOrderStatus", () => {
  it("advances shipped → in_transit → out_for_delivery → delivered", () => {
    assert.equal(shouldAdvanceOrderStatus(ORDER_STATUS.SHIPPED, ORDER_STATUS.IN_TRANSIT), true);
    assert.equal(
      shouldAdvanceOrderStatus(ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.OUT_FOR_DELIVERY),
      true
    );
    assert.equal(
      shouldAdvanceOrderStatus(ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED),
      true
    );
  });

  it("does not go backwards or overwrite locked statuses", () => {
    assert.equal(
      shouldAdvanceOrderStatus(ORDER_STATUS.DELIVERED, ORDER_STATUS.IN_TRANSIT),
      false
    );
    assert.equal(shouldAdvanceOrderStatus(ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERED), false);
    assert.equal(shouldAdvanceOrderStatus(ORDER_STATUS.REFUNDED, ORDER_STATUS.DELIVERED), false);
    assert.equal(shouldAdvanceOrderStatus(ORDER_STATUS.COMPLETE, ORDER_STATUS.DELIVERED), false);
  });

  it("maps phases to order statuses", () => {
    assert.equal(orderStatusForCarrierPhase(CARRIER_TRACKING_PHASE.DELIVERED), ORDER_STATUS.DELIVERED);
    assert.equal(
      orderStatusForCarrierPhase(CARRIER_TRACKING_PHASE.OUT_FOR_DELIVERY),
      ORDER_STATUS.OUT_FOR_DELIVERY
    );
    assert.equal(orderStatusForCarrierPhase(CARRIER_TRACKING_PHASE.LABEL_CREATED), null);
  });
});

describe("mergeTrackingEvents", () => {
  it("dedupes and sorts", () => {
    const merged = mergeTrackingEvents(
      [{ date: "2026-08-11", description: "Accepted" }],
      [
        { date: "2026-08-11", description: "Accepted" },
        { date: "2026-08-12", description: "In Transit" },
      ]
    );
    assert.equal(merged.length, 2);
    assert.equal(merged[1]!.description, "In Transit");
  });
});

describe("active tracking poll set", () => {
  it("polls shipment statuses and excludes delivered/complete/cancelled", () => {
    for (const s of TRACKING_POLL_STATUSES) {
      assert.equal(isActivelyTrackedStatus(s), true);
    }
    assert.equal(isActivelyTrackedStatus(ORDER_STATUS.DELIVERED), false);
    assert.equal(isActivelyTrackedStatus(ORDER_STATUS.COMPLETE), false);
    assert.equal(isActivelyTrackedStatus(ORDER_STATUS.CANCELLED), false);
    assert.equal(isActivelyTrackedStatus(ORDER_STATUS.REFUNDED), false);
  });

  it("allows shipped → delivered jump (skip intermediate scans)", () => {
    assert.equal(shouldAdvanceOrderStatus(ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED), true);
  });
});

describe("customerTimelineStepIndex", () => {
  it("highlights delivered for delivered/complete", () => {
    const deliveredIdx = customerTimelineStepIndex(ORDER_STATUS.DELIVERED);
    const completeIdx = customerTimelineStepIndex(ORDER_STATUS.COMPLETE);
    assert.equal(deliveredIdx, completeIdx);
    assert.ok(deliveredIdx >= 0);
  });

  it("highlights in_transit / out_for_delivery steps", () => {
    assert.notEqual(
      customerTimelineStepIndex(ORDER_STATUS.IN_TRANSIT),
      customerTimelineStepIndex(ORDER_STATUS.OUT_FOR_DELIVERY)
    );
  });
});
