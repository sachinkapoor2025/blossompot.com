import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDER_STATUS } from "../constants";
import {
  clipGboGiftCardText,
  formatGboProductSlug,
  formatGboSku,
  gboCartLineUnavailableMessage,
  gboGiftToProduct,
  gboImageUrl,
  gboPartnerOrderId,
  isGboFulfillmentLine,
  isGboHiddenFromStorefront,
  isGboStorefrontEnabled,
  isGboStorefrontHold,
  isPublicGboCatalogPath,
  mapGboGiftStorefrontCategories,
  orderIncludesGboProduct,
  mapGboStatusToOrderStatus,
  parseGboContentsLines,
  parseGboLineRef,
  parseGboSku,
  parseGboSlug,
  productMatchesSearchQuery,
  productVisibleForDeliveryCountry,
} from "./gbo";

describe("gbo helpers", () => {
  it("parses sku and slug refs", () => {
    assert.deepEqual(parseGboSku("gbo:US:10215"), { country: "US", productId: 10215 });
    assert.deepEqual(parseGboSlug("gbo-gb-7-beary-special"), { country: "GB", productId: 7 });
    assert.deepEqual(parseGboSlug("gbo-us-10215-natural-selection"), { country: "US", productId: 10215 });
    assert.deepEqual(parseGboSlug(encodeURIComponent("gbo-us-3-the-peak-of-celebration")), {
      country: "US",
      productId: 3,
    });
    assert.equal(parseGboSlug("gbo-us-NaN-broken"), null);
    assert.equal(parseGboSlug("signature-birthday-balloon-set"), null);
    assert.equal(parseGboSku("TFUSRH2026-16"), null);
    assert.deepEqual(parseGboLineRef({ sku: "gbo:in:9", productSlug: "other" }), {
      country: "IN",
      productId: 9,
    });
    assert.equal(formatGboSku("us", 1), "gbo:US:1");
    assert.equal(formatGboProductSlug("US", 3, "The Peak of Celebration"), "gbo-us-3-the-peak-of-celebration");
    assert.equal(gboImageUrl("/img/a.jpg"), "https://www.giftbasketsoverseas.com/img/a.jpg");
  });

  it("strips GBO HTML contents into readable lines", () => {
    const lines = parseGboContentsLines(
      "<b>ATTENTION: Do not substitute brands without our approval</b> <b>- Apple AirPods Pro 2nd Generation;</b> - Bottle of Dry Red Wine 0,75 L (Italian, Argentinian, French Or Spanish)"
    );
    assert.deepEqual(lines, [
      "Apple AirPods Pro 2nd Generation",
      "Bottle of Dry Red Wine 0,75 L (Italian, Argentinian, French Or Spanish)",
    ]);
    const product = gboGiftToProduct("ve", {
      id: 1,
      name: "Wine and Apple AirPods Pro Deluxe Basket",
      price: "10",
      contents:
        "<b>ATTENTION: Do not substitute brands without our approval</b><b>- Apple AirPods Pro 2nd Generation;</b>",
    });
    assert.equal(product.description.includes("<b>"), false);
    assert.ok(product.description.includes("Apple AirPods Pro 2nd Generation"));
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
    assert.equal(product.categorySlug, "gift-hampers");
    assert.ok(product.additionalCategorySlugs?.includes("overseas-gifts"));
    assert.equal(product.deliveryFee, 0);
  });

  it("filters storefront catalog by destination country", () => {
    assert.equal(
      productVisibleForDeliveryCountry(
        { slug: "gbo-us-3-peak", sku: "gbo:US:3", vendorSlug: "gift-baskets-overseas" },
        "AM"
      ),
      false
    );
    assert.equal(
      productVisibleForDeliveryCountry(
        { slug: "gbo-am-3-peak", sku: "gbo:AM:3", vendorSlug: "gift-baskets-overseas" },
        "AM"
      ),
      true
    );
    assert.equal(
      productVisibleForDeliveryCountry({ slug: "red-roses-dozen", sku: "BP-ROSES" }, "AM"),
      true
    );
    assert.equal(
      productVisibleForDeliveryCountry({ slug: "red-roses-dozen", sku: "BP-ROSES" }, "US"),
      true
    );
    assert.equal(
      productVisibleForDeliveryCountry(
        { slug: "gbo-us-3-peak", sku: "gbo:US:3", internationalDelivery: true },
        "GB"
      ),
      false
    );
    assert.equal(
      productVisibleForDeliveryCountry({ internationalDelivery: true, slug: "overseas-gift" }, "GB"),
      false
    );
  });

  it("maps GBO flower tags onto Flowers / Bouquets nav categories", () => {
    const mapped = mapGboGiftStorefrontCategories({
      name: "Cheerful Plush Tan Bear",
      categories: ["Flowers", "Birthday-Gifts"],
    });
    assert.equal(mapped.categorySlug, "flowers");
    assert.ok(mapped.additionalCategorySlugs.includes("birthday-gifts"));
    assert.ok(mapped.additionalCategorySlugs.includes("same-day-gifts"));
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

  it("keeps the GBO storefront off unless explicitly enabled", () => {
    assert.equal(isGboStorefrontEnabled({}), false);
    assert.equal(isGboStorefrontEnabled({ GBO_STOREFRONT_ENABLED: "" }), false);
    assert.equal(isGboStorefrontEnabled({ GBO_STOREFRONT_ENABLED: "false" }), false);
    assert.equal(isGboStorefrontEnabled({ GBO_STOREFRONT_ENABLED: "no" }), false);
    assert.equal(isGboStorefrontEnabled({ GBO_STOREFRONT_ENABLED: "true" }), true);
    assert.equal(isGboStorefrontEnabled({ GBO_STOREFRONT_ENABLED: "TRUE" }), true);
    assert.equal(isGboStorefrontEnabled({ GBO_STOREFRONT_ENABLED: "1" }), true);
    assert.equal(isGboStorefrontEnabled({ GBO_STOREFRONT_ENABLED: "yes" }), true);
  });

  it("hides GBO catalog rows only while the storefront switch is off", () => {
    const gift = { slug: "gbo-us-3-peak", sku: "gbo:US:3", vendorSlug: "gift-baskets-overseas" };
    const local = { slug: "blush-bloom", vendorSlug: "blossompot" };
    const off = { GBO_STOREFRONT_ENABLED: "false" };
    const on = { GBO_STOREFRONT_ENABLED: "true" };
    assert.equal(isGboHiddenFromStorefront(gift, off), true);
    assert.equal(isGboHiddenFromStorefront(local, off), false);
    assert.equal(isGboHiddenFromStorefront(gift, on), false);
    assert.equal(isGboFulfillmentLine({ productSlug: "gbo-gb-7-bear", sku: "gbo:GB:7" }), true);
    assert.equal(
      orderIncludesGboProduct({ items: [{ productSlug: "blush-bloom" }, { sku: "gbo:US:3" }] }),
      true
    );
    assert.equal(orderIncludesGboProduct({ items: [{ productSlug: "blush-bloom", vendorSlug: "blossompot" }] }), false);
  });

  it("names the overseas cart line without dropping it from the message", () => {
    const message = gboCartLineUnavailableMessage([
      { name: "Sunset roses", productSlug: "sunset-roses" },
      { name: "London hamper", productSlug: "gbo-gb-7-bear", sku: "gbo:GB:7" },
    ]);
    assert.match(message, /London hamper/);
    assert.match(message, /temporarily unavailable/);
    assert.doesNotMatch(message, /Sunset roses/);
  });

  it("recognizes public GBO catalog paths and storefront holds", () => {
    assert.equal(isPublicGboCatalogPath("/gbo/gifts"), true);
    assert.equal(isPublicGboCatalogPath("/gbo/gifts/10215"), true);
    assert.equal(isPublicGboCatalogPath("/admin/gbo/gifts"), false);
    assert.equal(isPublicGboCatalogPath("/gifts"), false);
    assert.equal(isPublicGboCatalogPath("/gbo/countries"), false);
    assert.equal(
      isGboStorefrontHold({
        gbo: { lastError: "GBO storefront is disabled; this order was not submitted to Gift Baskets Overseas." },
      }),
      true
    );
    assert.equal(
      isGboStorefrontHold({
        gbo: { invoice: "INV1", lastError: "GBO storefront is disabled; this order was not submitted to Gift Baskets Overseas." },
      }),
      false
    );
    assert.equal(isGboStorefrontHold({ gbo: { invoice: "INV1", placedAt: "2026-10-01T00:00:00.000Z" } }), false);
  });

  it("matches GBO gifts in storefront search by name, contents, and tags", () => {
    const product = gboGiftToProduct("us", {
      id: 27,
      name: "Cheerful Plush Tan Bear",
      price: "10",
      contents: "Plush teddy with chocolate",
      categories: ["Birthday", "Hampers"],
    });
    assert.equal(productMatchesSearchQuery(product, "bear"), true);
    assert.equal(productMatchesSearchQuery(product, "chocolate"), true);
    assert.equal(productMatchesSearchQuery(product, "birthday"), true);
    assert.equal(productMatchesSearchQuery(product, "rakhi"), false);
  });
});
