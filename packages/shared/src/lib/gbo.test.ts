import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDER_STATUS } from "../constants";
import {
  clipGboGiftCardText,
  formatGboProductSlug,
  formatGboSku,
  gboGiftToProduct,
  gboImageUrl,
  gboPartnerOrderId,
  mapGboStatusToOrderStatus,
  parseGboLineRef,
  parseGboSku,
  parseGboSlug,
} from "./gbo";

describe("gbo helpers", () => {
  it("parses sku and slug refs", () => {
    assert.deepEqual(parseGboSku("gbo:US:10215"), { country: "US", productId: 10215 });
    assert.deepEqual(parseGboSlug("gbo-gb-7-beary-special"), { country: "GB", productId: 7 });
    assert.equal(parseGboSku("TFUSRH2026-16"), null);
    assert.deepEqual(parseGboLineRef({ sku: "gbo:in:9", productSlug: "other" }), {
      country: "IN",
      productId: 9,
    });
    assert.equal(formatGboSku("us", 1), "gbo:US:1");
    assert.equal(formatGboProductSlug("US", 3, "The Peak of Celebration"), "gbo-us-3-the-peak-of-celebration");
    assert.equal(gboImageUrl("/img/a.jpg"), "https://www.giftbasketsoverseas.com/img/a.jpg");
  });

  it("maps GBO gifts to storefront products at retail with reseller cost", () => {
    const product = gboGiftToProduct("us", {
      id: 3,
      name: "The Peak of Celebration",
      price: "256.46",
      price_retail: "284.95",
      image: "https://example.com/a.jpg",
      contents: "Gourmet treats",
    });
    assert.equal(product.slug, "gbo-us-3-the-peak-of-celebration");
    assert.equal(product.sku, "gbo:US:3");
    assert.equal(product.price, 284.95);
    assert.equal(product.vendorCost, 256.46);
    assert.equal(product.vendorSlug, "gift-baskets-overseas");
    assert.equal(product.internationalDelivery, true);
    assert.equal(product.couponExcluded, true);
    assert.equal(product.allowsAddons, false);
    assert.equal(product.indexable, false);
  });

  it("namespaces partner order ids", () => {
    assert.equal(gboPartnerOrderId({ orderNumber: "US10001", orderId: "uuid" }), 110001);
    assert.equal(gboPartnerOrderId({ orderNumber: "BP10002", orderId: "uuid" }), 110002);
    assert.equal(gboPartnerOrderId({ orderNumber: "OC10001", orderId: "uuid" }), 210001);
    assert.notEqual(
      gboPartnerOrderId({ orderId: "449cd53d-8a7e-4494-9479-b3c342380828" }),
      0
    );
  });

  it("maps GBO status ids", () => {
    assert.equal(mapGboStatusToOrderStatus(0), ORDER_STATUS.ACCEPTED);
    assert.equal(mapGboStatusToOrderStatus(13), ORDER_STATUS.PROCESSING);
    assert.equal(mapGboStatusToOrderStatus(4), ORDER_STATUS.OUT_FOR_DELIVERY);
    assert.equal(mapGboStatusToOrderStatus(12), ORDER_STATUS.ON_HOLD);
    assert.equal(mapGboStatusToOrderStatus(3), ORDER_STATUS.ON_HOLD);
    assert.equal(mapGboStatusToOrderStatus(1), ORDER_STATUS.DELIVERED);
    assert.equal(mapGboStatusToOrderStatus(15), ORDER_STATUS.DELIVERED);
    assert.equal(mapGboStatusToOrderStatus("99"), null);
  });

  it("clips gift card text to 180 chars", () => {
    assert.equal(clipGboGiftCardText("  hi  "), "hi");
    assert.equal(clipGboGiftCardText("x".repeat(200))?.length, 180);
  });
});
