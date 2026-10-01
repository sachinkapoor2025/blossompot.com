import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { HOMEPAGE_TILE_IDENTITY } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";

function event(method: string, country: string, body?: unknown): APIGatewayProxyEventV2 {
  return {
    rawPath: "/homepage-catalog",
    queryStringParameters: { country },
    body: body == null ? undefined : JSON.stringify(body),
    isBase64Encoded: false,
    requestContext: {
      http: { method, path: "/homepage-catalog" },
      stage: "$default",
    },
  } as unknown as APIGatewayProxyEventV2;
}

function read(result: APIGatewayProxyResultV2): { status: number; body: Record<string, unknown> } {
  if (typeof result === "string") return { status: 200, body: JSON.parse(result) as Record<string, unknown> };
  return {
    status: result.statusCode ?? 200,
    body: JSON.parse(result.body ?? "{}") as Record<string, unknown>,
  };
}

function sample(country: string, giftCount: number) {
  return {
    country,
    giftCount,
    categoryCount: 14,
    tiles: HOMEPAGE_TILE_IDENTITY.map((tile) => ({
      slug: tile.slug,
      label: tile.label,
      href: tile.href as string,
      image: "https://cdn.example.com/tile.jpg",
      alt: tile.label,
    })),
  };
}

describe("homepage catalog cache handler", () => {
  it("stores one country record and does not replace it while it is fresh", async () => {
    const { getHomepageCatalogCache, putHomepageCatalogCache } = await import("./homepage-catalog");

    const missing = read(await getHomepageCatalogCache(event("GET", "US")));
    assert.equal(missing.status, 404);

    const stored = read(await putHomepageCatalogCache(event("PUT", "US", sample("US", 478))));
    assert.equal(stored.status, 200);
    assert.equal(stored.body.stored, true);

    const hit = read(await getHomepageCatalogCache(event("GET", "US")));
    assert.equal(hit.status, 200);
    assert.equal(hit.body.giftCount, 478);
    assert.equal(Array.isArray(hit.body.tiles) ? (hit.body.tiles as unknown[]).length : 0, 13);

    const blocked = read(await putHomepageCatalogCache(event("PUT", "US", sample("US", 1))));
    assert.equal(blocked.body.stored, false);

    const still = read(await getHomepageCatalogCache(event("GET", "US")));
    assert.equal(still.body.giftCount, 478);

    const other = read(await getHomepageCatalogCache(event("GET", "GB")));
    assert.equal(other.status, 404);
  });

  it("rejects a tile list that does not match the carousel", async () => {
    const { putHomepageCatalogCache } = await import("./homepage-catalog");
    const bad = sample("AE", 10);
    bad.tiles[0] = { ...bad.tiles[0], href: "/somewhere-else" };
    const result = read(await putHomepageCatalogCache(event("PUT", "AE", bad)));
    assert.equal(result.status, 400);
  });
});
