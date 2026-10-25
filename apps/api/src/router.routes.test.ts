import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";

type RouteFn = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let route: RouteFn;

before(async () => {
  ({ route } = await import("./router"));
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function event(method: string, path: string, body?: unknown, stage = "local"): APIGatewayProxyEventV2 {
  const rawPath = stage && stage !== "local" ? `/${stage}${path}` : path;
  return {
    version: "2.0",
    rawPath,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {},
    requestContext: {
      stage,
      http: { method, path: rawPath, sourceIp: "127.0.0.1" },
    },
  } as APIGatewayProxyEventV2;
}

describe("storefront and admin routes", () => {
  it("accepts the guest serviceability POST before any catalog lookup", async () => {
    const missing = resultOf(await route(event("POST", "/location/check-serviceability", {})));
    assert.notEqual(missing.statusCode, 404);
    assert.equal(missing.statusCode, 400);
    assert.equal(String(missing.body.error).startsWith("Route not found"), false);

    const staged = resultOf(
      await route(event("POST", "/location/check-serviceability", {}, "dev"))
    );
    assert.equal(staged.statusCode, 400);
  });

  it("keeps catalog vendors on the admin API", async () => {
    const listed = resultOf(await route(event("GET", "/admin/catalog-vendors")));
    assert.equal(listed.statusCode, 403);
    assert.equal(listed.body.error, "Forbidden");

    const staged = resultOf(await route(event("GET", "/admin/catalog-vendors", undefined, "dev")));
    assert.equal(staged.statusCode, 403);
  });

  it("still reports an unknown path as missing", async () => {
    const missing = resultOf(await route(event("GET", "/not-a-route")));
    assert.equal(missing.statusCode, 404);
    assert.equal(missing.body.error, "Route not found: GET /not-a-route");
  });
});
