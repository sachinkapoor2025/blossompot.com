/**
 * Admin console for Gift Baskets Overseas (GBO) API.
 * Cognito admin auth — GBO token and internal wrapper key stay on the server.
 */
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAdmin } from "../lib/auth";
import { badRequest, forbidden, ok } from "../lib/response";
import { gboTokenConfigured } from "../lib/gbo-client";
import {
  gboCategoriesHandler,
  gboCountriesHandler,
  gboCreateOrderHandler,
  gboGiftDetailHandler,
  gboGiftsHandler,
  gboGetOrderHandler,
  gboHealthHandler,
} from "./gbo";
import { placeOrSyncGboByOrderId } from "../lib/gbo-orders";
import { resolveOrderByIdOrNumber } from "../lib/order-numbers";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

const PUBLIC_GBO_BASE = "https://gbo.blossompot.com";

function parseHandlerResult(result: APIGatewayProxyResultV2): {
  statusCode: number;
  body: unknown;
} {
  if (typeof result === "string") {
    try {
      return { statusCode: 200, body: JSON.parse(result) };
    } catch {
      return { statusCode: 200, body: result };
    }
  }
  const statusCode = result.statusCode ?? 200;
  const raw = result.body ?? "";
  if (!raw) return { statusCode, body: null };
  try {
    return { statusCode, body: JSON.parse(raw) };
  } catch {
    return { statusCode, body: raw };
  }
}

async function proxy(
  event: APIGatewayProxyEventV2,
  handler: Handler,
  meta: { action: string; path: string }
) {
  if (!requireAdmin(event)) return forbidden();
  const result = await handler(event);
  const parsed = parseHandlerResult(result);
  return ok({
    action: meta.action,
    publicBaseUrl: PUBLIC_GBO_BASE,
    gboPath: meta.path,
    tokenConfigured: gboTokenConfigured(),
    statusCode: parsed.statusCode,
    body: parsed.body,
  });
}

export async function adminGboHealth(event: APIGatewayProxyEventV2) {
  return proxy(event, gboHealthHandler, { action: "health", path: "/health" });
}

export async function adminGboCountries(event: APIGatewayProxyEventV2) {
  return proxy(event, gboCountriesHandler, { action: "countries", path: "/countries" });
}

export async function adminGboCategories(event: APIGatewayProxyEventV2) {
  return proxy(event, gboCategoriesHandler, { action: "categories", path: "/categories" });
}

export async function adminGboGifts(event: APIGatewayProxyEventV2) {
  return proxy(event, gboGiftsHandler, { action: "gifts", path: "/gifts" });
}

export async function adminGboGiftDetail(event: APIGatewayProxyEventV2) {
  return proxy(event, gboGiftDetailHandler, { action: "gift-detail", path: "/gifts/{productId}" });
}

export async function adminGboCreateOrder(event: APIGatewayProxyEventV2) {
  return proxy(event, gboCreateOrderHandler, { action: "create-order", path: "/orders" });
}

export async function adminGboGetOrder(event: APIGatewayProxyEventV2) {
  return proxy(event, gboGetOrderHandler, { action: "get-order", path: "/orders/{orderId}" });
}

export async function adminGboPlaceBlossompotOrder(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const orderId = event.pathParameters?.orderId?.trim();
  if (!orderId) return badRequest("orderId is required");
  const resolved = await resolveOrderByIdOrNumber(orderId);
  if (!resolved) return badRequest("Order not found");
  const force =
    event.queryStringParameters?.force === "1" || event.queryStringParameters?.force === "true";
  const result = await placeOrSyncGboByOrderId(resolved.orderId, "place", force);
  return ok({
    action: "place-blossompot-order",
    publicBaseUrl: PUBLIC_GBO_BASE,
    orderId: resolved.orderId,
    orderNumber: resolved.orderNumber,
    tokenConfigured: gboTokenConfigured(),
    result,
  });
}

export async function adminGboSyncBlossompotOrder(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const orderId = event.pathParameters?.orderId?.trim();
  if (!orderId) return badRequest("orderId is required");
  const resolved = await resolveOrderByIdOrNumber(orderId);
  if (!resolved) return badRequest("Order not found");
  const result = await placeOrSyncGboByOrderId(resolved.orderId, "sync");
  return ok({
    action: "sync-blossompot-order",
    publicBaseUrl: PUBLIC_GBO_BASE,
    orderId: resolved.orderId,
    orderNumber: resolved.orderNumber,
    tokenConfigured: gboTokenConfigured(),
    result,
  });
}
