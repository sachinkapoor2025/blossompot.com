import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { GBO_STOREFRONT_HOLD_ERROR } from "@blossompot/shared";
import { gboTrackingBatch } from "./gbo-orders";

const previous = process.env.GBO_STOREFRONT_ENABLED;

afterEach(() => {
  if (previous === undefined) delete process.env.GBO_STOREFRONT_ENABLED;
  else process.env.GBO_STOREFRONT_ENABLED = previous;
});

function hold(orderId: string) {
  return {
    orderId,
    gbo: { lastError: GBO_STOREFRONT_HOLD_ERROR, partnerOrderId: 1 },
  };
}

function awaitingFirstSubmit(orderId: string) {
  return {
    orderId,
    gbo: { partnerOrderId: 2, lastError: null, invoice: null, placedAt: null },
  };
}

function alreadySubmitted(orderId: string) {
  return {
    orderId,
    gbo: { invoice: "INV-1", partnerOrderId: 3, placedAt: "2026-09-01T00:00:00.000Z" },
  };
}

describe("gboTrackingBatch", () => {
  it("drops storefront holds before the 30-order cap", () => {
    process.env.GBO_STOREFRONT_ENABLED = "false";
    const orders = [...Array.from({ length: 31 }, (_, i) => hold(`hold-${i}`)), alreadySubmitted("sync-1")];
    const batch = gboTrackingBatch(orders);
    assert.deepEqual(
      batch.map((order) => order.orderId),
      ["sync-1"]
    );
  });

  it("still selects eligible orders that sit after more than 30 holds", () => {
    process.env.GBO_STOREFRONT_ENABLED = "false";
    const orders = [
      ...Array.from({ length: 31 }, (_, i) => hold(`hold-${i}`)),
      awaitingFirstSubmit("place-1"),
      alreadySubmitted("sync-1"),
    ];
    const batch = gboTrackingBatch(orders);
    assert.deepEqual(
      batch.map((order) => order.orderId),
      ["place-1", "sync-1"]
    );
  });

  it("keeps unsubmitted and already-submitted orders while the storefront switch is off", () => {
    process.env.GBO_STOREFRONT_ENABLED = "false";
    const orders = [
      hold("hold-1"),
      awaitingFirstSubmit("place-1"),
      alreadySubmitted("sync-1"),
      hold("hold-2"),
    ];
    const batch = gboTrackingBatch(orders);
    assert.deepEqual(
      batch.map((order) => order.orderId),
      ["place-1", "sync-1"]
    );
  });

  it("keeps held orders in the batch after the storefront switch is enabled", () => {
    process.env.GBO_STOREFRONT_ENABLED = "true";
    const orders = [hold("hold-1"), alreadySubmitted("sync-1"), awaitingFirstSubmit("place-1")];
    const batch = gboTrackingBatch(orders);
    assert.deepEqual(
      batch.map((order) => order.orderId),
      ["hold-1", "sync-1", "place-1"]
    );
  });
});
