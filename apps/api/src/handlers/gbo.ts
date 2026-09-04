import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  gboCreateOrderSchema,
  gboGiftDetailQuerySchema,
  gboGiftQuerySchema,
} from "@blossompot/shared";
import {
  GboClientError,
  gboCreateOrder,
  gboGetGift,
  gboGetOrder,
  gboHealth,
  gboListCategories,
  gboListCountries,
  gboListGifts,
} from "../lib/gbo-client";
import { json, ok, badRequest, unauthorized } from "../lib/response";

function query(event: APIGatewayProxyEventV2): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(event.queryStringParameters ?? {})) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function parseBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sandboxFlag(event: APIGatewayProxyEventV2): boolean | undefined {
  const q = query(event);
  const v = (q.sandbox ?? "").trim().toLowerCase();
  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false") return false;
  return undefined;
}

function gboFail(err: unknown): APIGatewayProxyResultV2 {
  if (err instanceof GboClientError) {
    return json(err.status, { error: err.message, details: err.details });
  }
  return json(502, { error: err instanceof Error ? err.message : "GBO request failed" });
}

/** Dedicated GBO wrapper API auth (not the vendor token). */
export function dedicatedGboKeyOk(event: APIGatewayProxyEventV2): boolean {
  const key =
    event.headers?.["x-gbo-api-key"] ??
    event.headers?.["X-Gbo-Api-Key"] ??
    event.headers?.["X-GBO-Api-Key"] ??
    "";
  const expected = process.env.GBO_INTERNAL_API_KEY?.trim();
  return Boolean(expected && key && key === expected);
}

export async function gboHealthHandler(): Promise<APIGatewayProxyResultV2> {
  const body = await gboHealth();
  return ok({ service: "gbo-api", ...body });
}

export async function gboCountriesHandler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const countries = await gboListCountries({ sandbox: sandboxFlag(event) });
    return ok({ count: countries.length, countries });
  } catch (err) {
    return gboFail(err);
  }
}

export async function gboCategoriesHandler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const country = (query(event).country || query(event).country_iso_alpha2 || "").trim();
  if (country.length !== 2) return badRequest("country (ISO-2) is required");
  try {
    const categories = await gboListCategories(country, { sandbox: sandboxFlag(event) });
    return ok({ country: country.toUpperCase(), count: categories.length, categories });
  } catch (err) {
    return gboFail(err);
  }
}

export async function gboGiftsHandler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const q = query(event);
  const parsed = gboGiftQuerySchema.safeParse({
    country: q.country || q.country_iso_alpha2,
    priceMin: q.price_min || q.priceMin,
    priceMax: q.price_max || q.priceMax,
    category: q.category,
    sandbox: q.sandbox,
  });
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid gift query");
  try {
    const gifts = await gboListGifts(parsed.data, { sandbox: parsed.data.sandbox ?? sandboxFlag(event) });
    return ok({
      country: parsed.data.country,
      count: gifts.length,
      gifts,
    });
  } catch (err) {
    return gboFail(err);
  }
}

export async function gboGiftDetailHandler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const q = query(event);
  const parsed = gboGiftDetailQuerySchema.safeParse({
    country: q.country || q.country_iso_alpha2,
    productId: event.pathParameters?.productId || q.product_id || q.productId,
    sandbox: q.sandbox,
  });
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "country and productId required");
  try {
    const gift = await gboGetGift(parsed.data.country, parsed.data.productId, {
      sandbox: parsed.data.sandbox ?? sandboxFlag(event),
    });
    return ok({ gift });
  } catch (err) {
    return gboFail(err);
  }
}

export async function gboCreateOrderHandler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const body = parseBody(event);
  if (body == null) return badRequest("Invalid JSON body");
  const parsed = gboCreateOrderSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid order payload");
  try {
    const created = await gboCreateOrder(parsed.data, { sandbox: parsed.data.sandbox ?? sandboxFlag(event) });
    return json(201, { invoice: created.invoice, orderId: created.order_id, data: created.raw });
  } catch (err) {
    return gboFail(err);
  }
}

export async function gboGetOrderHandler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const orderId =
    event.pathParameters?.orderId || query(event).order_id || query(event).orderId || "";
  if (!orderId.trim()) return badRequest("orderId is required");
  try {
    const order = await gboGetOrder(orderId.trim(), { sandbox: sandboxFlag(event) });
    return ok({ order });
  } catch (err) {
    return gboFail(err);
  }
}

export function requireDedicatedGboKey(event: APIGatewayProxyEventV2): APIGatewayProxyResultV2 | null {
  if (dedicatedGboKeyOk(event)) return null;
  if (!process.env.GBO_INTERNAL_API_KEY?.trim()) {
    return json(503, { error: "GBO_INTERNAL_API_KEY is not configured on this API" });
  }
  return unauthorized("Valid X-Gbo-Api-Key required");
}
