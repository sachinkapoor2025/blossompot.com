/**
 * Dedicated Gift Baskets Overseas wrapper API.
 * Storefront/admin stay on the main HttpApi — this gateway only exposes GBO catalog + order routes.
 */
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import {
  gboCategoriesHandler,
  gboCountriesHandler,
  gboCreateOrderHandler,
  gboGiftDetailHandler,
  gboGiftsHandler,
  gboGetOrderHandler,
  gboHealthHandler,
  requireDedicatedGboKey,
} from "./handlers/gbo";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

const routes: Array<{
  method: string;
  pattern: RegExp;
  handler: Handler;
  params?: string[];
  public?: boolean;
}> = [
  { method: "GET", pattern: /^\/health$/, handler: gboHealthHandler, public: true },
  { method: "GET", pattern: /^\/countries$/, handler: gboCountriesHandler },
  { method: "POST", pattern: /^\/countries$/, handler: gboCountriesHandler },
  { method: "GET", pattern: /^\/categories$/, handler: gboCategoriesHandler },
  { method: "POST", pattern: /^\/categories$/, handler: gboCategoriesHandler },
  { method: "GET", pattern: /^\/gifts$/, handler: gboGiftsHandler },
  { method: "POST", pattern: /^\/gifts$/, handler: gboGiftsHandler },
  {
    method: "GET",
    pattern: /^\/gifts\/([^/]+)$/,
    handler: gboGiftDetailHandler,
    params: ["productId"],
  },
  {
    method: "POST",
    pattern: /^\/gifts\/([^/]+)$/,
    handler: gboGiftDetailHandler,
    params: ["productId"],
  },
  { method: "POST", pattern: /^\/orders$/, handler: gboCreateOrderHandler },
  {
    method: "GET",
    pattern: /^\/orders\/([^/]+)$/,
    handler: gboGetOrderHandler,
    params: ["orderId"],
  },
  {
    method: "POST",
    pattern: /^\/orders\/get$/,
    handler: gboGetOrderHandler,
  },
];

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Gbo-Api-Key",
  };
}

export async function handler(
  event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext?.http?.method ?? "GET";
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  let path = event.rawPath ?? event.requestContext?.http?.path ?? "/";
  const stage = event.requestContext?.stage;
  if (stage && path.startsWith(`/${stage}/`)) {
    path = path.slice(stage.length + 1);
  } else if (stage && path === `/${stage}`) {
    path = "/";
  }

  try {
    for (const route of routes) {
      if (route.method !== method) continue;
      const match = path.match(route.pattern);
      if (!match) continue;
      if (route.params?.length) {
        const params: Record<string, string> = {};
        route.params.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        event.pathParameters = { ...(event.pathParameters ?? {}), ...params };
      }
      if (!route.public) {
        const denied = requireDedicatedGboKey(event);
        if (denied) return denied;
      }
      return await route.handler(event);
    }
    return {
      statusCode: 404,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (err) {
    console.error("GBO API error", err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
    };
  }
}
