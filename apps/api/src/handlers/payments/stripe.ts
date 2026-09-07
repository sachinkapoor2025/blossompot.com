import Stripe from "stripe";
import type { Order } from "@blossompot/shared";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { ok, badRequest, serverError, unauthorized, notFound, forbidden } from "../../lib/response";
import { markOrderPaid, markOrderPaymentFailed, getOrderById } from "../orders";
import { getUserOrSessionKey } from "../../lib/auth";
import { isLoadTestMode } from "../../lib/load-test";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

function getRawBody(event: APIGatewayProxyEventV2): string {
  if (!event.body) return "";
  if (event.isBase64Encoded) return Buffer.from(event.body, "base64").toString("utf8");
  return event.body;
}

function getHeader(event: APIGatewayProxyEventV2, name: string): string | undefined {
  const headers = event.headers ?? {};
  const lower = name.toLowerCase();
  return headers[lower] ?? headers[name];
}

export async function createStripePaymentIntent(order: Order) {
  if (isLoadTestMode()) {
    return {
      paymentIntentId: `pi_loadtest_${order.orderId}`,
      clientSecret: `pi_loadtest_${order.orderId}_secret`,
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return {
      paymentIntentId: `pi_dev_${order.orderId}`,
      clientSecret: `pi_dev_${order.orderId}_secret`,
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: order.currency.toLowerCase(),
    metadata: { orderId: order.orderId },
    automatic_payment_methods: { enabled: true },
    ...(order.shippingAddress.email
      ? { receipt_email: order.shippingAddress.email.trim() }
      : {}),
  });

  return {
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret!,
  };
}

export async function confirmStripePayment(event: APIGatewayProxyEventV2) {
  const userKey = getUserOrSessionKey(event);
  if (!userKey) return unauthorized("Session or auth required");

  const body = JSON.parse(event.body ?? "{}");
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const paymentIntentId =
    typeof body.paymentIntentId === "string" ? body.paymentIntentId.trim() : "";
  if (!orderId) return badRequest("orderId required");

  const order = await getOrderById(orderId);
  if (!order) return notFound("Order not found");

  const stripe = getStripe();
  if (!stripe) return badRequest("Stripe is not configured on the API");

  const piId = paymentIntentId || order.paymentIntentId || "";
  if (!piId || piId.includes("_dev_") || piId.includes("_loadtest_")) {
    return badRequest("No Stripe payment to confirm");
  }
  if (order.paymentIntentId && order.paymentIntentId !== piId) {
    return forbidden("Payment does not match this order");
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(piId);
    if (intent.metadata?.orderId && intent.metadata.orderId !== orderId) {
      return forbidden("Payment does not match this order");
    }
    if (intent.status !== "succeeded") {
      return ok({ paid: false, status: intent.status });
    }
    await markOrderPaid(orderId, { paymentIntentId: intent.id });
    const updated = await getOrderById(orderId);
    return ok({ paid: true, order: updated });
  } catch (err) {
    console.error("Stripe confirm failed:", err);
    return serverError(err instanceof Error ? err.message : "Stripe confirm failed");
  }
}

export async function stripeWebhook(event: APIGatewayProxyEventV2) {
  const stripe = getStripe();
  if (!stripe) return ok({ received: true, mode: "dev" });

  const sig = getHeader(event, "stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!sig || !webhookSecret) {
    return badRequest("Missing webhook signature");
  }

  const rawBody = getRawBody(event);

  try {
    const stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    if (stripeEvent.type === "payment_intent.succeeded") {
      const intent = stripeEvent.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await markOrderPaid(orderId, { paymentIntentId: intent.id });
      }
      if (intent.metadata?.type === "gifting_subscription" && intent.metadata.subscriptionId && intent.metadata.userId) {
        const { activatePaidSubscriptionById } = await import("../gifting");
        await activatePaidSubscriptionById(intent.metadata.subscriptionId, intent.metadata.userId);
      }
    }

    if (stripeEvent.type === "payment_intent.payment_failed") {
      const intent = stripeEvent.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await markOrderPaymentFailed(orderId, "Stripe payment failed");
      }
    }

    if (stripeEvent.type === "payment_intent.canceled") {
      const intent = stripeEvent.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await markOrderPaymentFailed(orderId, "Stripe payment cancelled");
      }
    }

    return ok({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return serverError(String(err));
  }
}
