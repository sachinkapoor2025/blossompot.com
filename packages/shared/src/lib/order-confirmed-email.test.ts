import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Order } from "../schemas/order";
import {
  ORDER_CONFIRMED_FOLLOW_UP,
  ORDER_CONFIRMED_HEADING,
  buildOrderConfirmedEmailHtml,
  buildOrderConfirmedEmailText,
  buildOrderConfirmedWhatsAppMessage,
  buildOrderDeliveredEmailHtml,
  buildOrderDeliveredEmailText,
  buildOrderDeliveredWhatsAppMessage,
  containsEmoji,
  summarizeConfirmedOrder,
} from "./order-confirmed-email";

function sampleOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    orderNumber: "US10045",
    items: [
      {
        productSlug: "pink-rose-bouquet",
        name: "Pink Rose Bouquet",
        price: 49,
        currency: "USD",
        quantity: 1,
        image: "https://d2d01h4hac5hqs.cloudfront.net/uploads/editorial/home-banner-flowers.jpg",
      },
      {
        productSlug: "chocolate-cake",
        name: "Chocolate Cake",
        price: 32,
        currency: "USD",
        quantity: 2,
        addons: [{ id: "card", name: "Greeting card", price: 3, quantity: 1 }],
      },
    ],
    subtotal: 116,
    discount: 8,
    shipping: 5,
    tax: 0,
    total: 113,
    currency: "USD",
    status: "accepted",
    shippingAddress: {
      name: "Priya Sharma",
      line1: "12 Main St",
      city: "San Jose",
      state: "CA",
      postalCode: "95112",
      country: "US",
      phone: "+14085550100",
      email: "priya@example.com",
    },
    createdAt: "2026-08-27T10:00:00.000Z",
    updatedAt: "2026-08-27T11:00:00.000Z",
    ...overrides,
  };
}

describe("summarizeConfirmedOrder", () => {
  it("includes customer name, order number, lines, delivery, packaging, and discount", () => {
    const summary = summarizeConfirmedOrder(sampleOrder());
    assert.equal(summary.customerName, "Priya Sharma");
    assert.equal(summary.orderRef, "US10045");
    assert.equal(summary.lines.length, 2);
    assert.equal(summary.lines[1]!.unitPrice, 35);
    assert.equal(summary.lines[1]!.lineTotal, 70);
    assert.equal(summary.delivery, 5);
    assert.equal(summary.packaging, 0);
    assert.equal(summary.discount, 8);
    assert.equal(summary.total, 113);
  });
});

describe("buildOrderConfirmedEmailHtml", () => {
  it("renders the premium confirmation layout without delivery or payment sections", () => {
    const html = buildOrderConfirmedEmailHtml(sampleOrder());
    assert.match(html, /Your Order is Confirmed!/);
    assert.match(html, /Priya Sharma/);
    assert.match(html, /US10045/);
    assert.match(html, /Pink Rose Bouquet/);
    assert.match(html, /Chocolate Cake/);
    assert.match(html, /Order Details/);
    assert.match(html, /Delivery charges/);
    assert.match(html, /Packaging charges/);
    assert.match(html, /Discount/);
    assert.match(html, /Total amount/);
    assert.match(html, /We will send you another email once your order is on the way/);
    assert.match(html, /100% Secure Payment/);
    assert.match(html, /Fresh &amp; Premium Quality/);
    assert.match(html, /On-time Delivery/);
    assert.match(html, /instagram\.com\/blos\.sompot/);
    assert.match(html, /support@blossompot\.com/);
    assert.doesNotMatch(html, /16692603819/);
    assert.doesNotMatch(html, /\+1 \(669\) 260-3819/);
    assert.doesNotMatch(html, /Delivery Details/);
    assert.doesNotMatch(html, /Payment Details/);
    assert.equal(containsEmoji(html), false);
    assert.equal(containsEmoji(ORDER_CONFIRMED_HEADING), false);
    assert.equal(containsEmoji(ORDER_CONFIRMED_FOLLOW_UP), false);
  });

  it("omits the discount row when no discount applies", () => {
    const html = buildOrderConfirmedEmailHtml(sampleOrder({ discount: 0, total: 121 }));
    assert.doesNotMatch(html, /Discount/);
  });
});

describe("buildOrderConfirmedWhatsAppMessage", () => {
  it("includes the same essentials in a concise, emoji-free message", () => {
    const text = buildOrderConfirmedWhatsAppMessage(sampleOrder());
    assert.match(text, /Priya Sharma/);
    assert.match(text, /US10045/);
    assert.match(text, /Pink Rose Bouquet/);
    assert.match(text, /Total amount:/);
    assert.match(text, /order is confirmed/);
    assert.doesNotMatch(text, /Delivery Details/);
    assert.equal(containsEmoji(text), false);
    assert.equal(containsEmoji(buildOrderConfirmedEmailText(sampleOrder())), false);
  });
});

describe("buildOrderDeliveredEmailHtml", () => {
  it("renders delivered layout with review CTA and no delivery or payment sections", () => {
    const html = buildOrderDeliveredEmailHtml(sampleOrder({ status: "delivered" }), "delivered");
    assert.match(html, /Your Order Has Been Delivered!/);
    assert.match(html, /Priya Sharma/);
    assert.match(html, /US10045/);
    assert.match(html, /Pink Rose Bouquet/);
    assert.match(html, /Order Details/);
    assert.match(html, /Delivery charges/);
    assert.match(html, /Packaging charges/);
    assert.match(html, /We Value Your Feedback!/);
    assert.match(html, /Write a Review/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/reviews/);
    assert.match(html, /About BlossomPot/);
    assert.match(html, /fresh flowers/i);
    assert.match(html, /on-time delivery/i);
    assert.match(html, /100% Secure Payment/);
    assert.doesNotMatch(html, /Delivery Details/);
    assert.doesNotMatch(html, /Payment Details/);
    assert.equal(containsEmoji(html), false);
  });

  it("uses complete heading for the complete variant", () => {
    const html = buildOrderDeliveredEmailHtml(sampleOrder({ status: "complete" }), "complete");
    assert.match(html, /Your Order is Complete!/);
    assert.match(html, /Write a Review/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/reviews/);
    assert.doesNotMatch(html, /Your Order Has Been Delivered!/);
    assert.equal(containsEmoji(html), false);
  });
});

describe("buildOrderDeliveredWhatsAppMessage", () => {
  it("includes delivered confirmation, order details, total, and review link without emojis", () => {
    const text = buildOrderDeliveredWhatsAppMessage(sampleOrder({ status: "delivered" }), "delivered");
    assert.match(text, /Priya Sharma/);
    assert.match(text, /US10045/);
    assert.match(text, /has been delivered/);
    assert.match(text, /Pink Rose Bouquet/);
    assert.match(text, /Total amount:/);
    assert.match(text, /https:\/\/www\.blossompot\.com\/reviews/);
    assert.doesNotMatch(text, /Delivery Details/);
    assert.equal(containsEmoji(text), false);
    assert.equal(containsEmoji(buildOrderDeliveredEmailText(sampleOrder(), "delivered")), false);
  });

  it("uses complete wording for the complete variant", () => {
    const text = buildOrderDeliveredWhatsAppMessage(sampleOrder({ status: "complete" }), "complete");
    assert.match(text, /is complete/);
    assert.match(text, /https:\/\/www\.blossompot\.com\/reviews/);
    assert.doesNotMatch(text, /has been delivered/);
    assert.equal(containsEmoji(text), false);
  });
});
