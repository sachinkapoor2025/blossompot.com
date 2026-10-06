import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

process.env.USE_MEMORY_DB = "true";

function card(slug: string) {
  return {
    slug,
    name: slug,
    price: 49,
    currency: "USD",
    categorySlug: "flowers",
    images: ["https://cdn.example.com/flower.jpg"],
    inventory: 4,
    published: true,
  };
}

function sample(country: "GB" | "CA", count: number) {
  const slug = country === "GB" ? "uk" : "canada";
  return {
    country,
    slug,
    products: Array.from({ length: count }, (_, i) => card(`${slug}-${i}`)),
  };
}

function event(method: string, country: string, body?: unknown): APIGatewayProxyEventV2 {
  return {
    rawPath: "/flower-guide-cards",
    queryStringParameters: { country },
    body: body == null ? undefined : JSON.stringify(body),
    isBase64Encoded: false,
    requestContext: {
      http: { method, path: "/flower-guide-cards" },
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

describe("flower guide card cache handler", () => {
  it("stores one country and does not replace it while it is fresh", async () => {
    const { getFlowerGuideCardsCache, putFlowerGuideCardsCache } = await import("./flower-guide-cards");

    const missing = read(await getFlowerGuideCardsCache(event("GET", "GB")));
    assert.equal(missing.status, 404);

    const stored = read(await putFlowerGuideCardsCache(event("PUT", "GB", sample("GB", 10))));
    assert.equal(stored.status, 200);
    assert.equal(stored.body.stored, true);

    const hit = read(await getFlowerGuideCardsCache(event("GET", "GB")));
    assert.equal(hit.status, 200);
    assert.equal(hit.body.country, "GB");
    assert.equal(hit.body.slug, "uk");
    assert.equal(Array.isArray(hit.body.products) ? (hit.body.products as unknown[]).length : 0, 10);
    assert.equal((hit.body.products as { price: number }[])[0]?.price, 49);

    const blocked = read(await putFlowerGuideCardsCache(event("PUT", "GB", sample("GB", 1))));
    assert.equal(blocked.body.stored, false);

    const still = read(await getFlowerGuideCardsCache(event("GET", "GB")));
    assert.equal(Array.isArray(still.body.products) ? (still.body.products as unknown[]).length : 0, 10);

    const other = read(await getFlowerGuideCardsCache(event("GET", "CA")));
    assert.equal(other.status, 404);
  });

  it("treats a record older than 45 seconds as a miss and stores the rebuild", async () => {
    const { PutCommand } = await import("@aws-sdk/lib-dynamodb");
    const { configKeys } = await import("@blossompot/shared");
    const { CONFIG_TABLE, docClient } = await import("../lib/db");
    const { getFlowerGuideCardsCache, putFlowerGuideCardsCache } = await import("./flower-guide-cards");

    const key = configKeys.flowerGuideCards("CA");
    await docClient.send(
      new PutCommand({
        TableName: CONFIG_TABLE,
        Item: {
          PK: key.pk,
          SK: key.sk,
          ...sample("CA", 10),
          cachedAt: new Date(Date.now() - 46_000).toISOString(),
        },
      })
    );

    const stale = read(await getFlowerGuideCardsCache(event("GET", "CA")));
    assert.equal(stale.status, 404);

    const stored = read(await putFlowerGuideCardsCache(event("PUT", "CA", sample("CA", 8))));
    assert.equal(stored.body.stored, true);

    const fresh = read(await getFlowerGuideCardsCache(event("GET", "CA")));
    assert.equal(fresh.status, 200);
    assert.equal(fresh.body.country, "CA");
    assert.equal(Array.isArray(fresh.body.products) ? (fresh.body.products as unknown[]).length : 0, 8);
  });

  it("rejects a guide that does not match the country", async () => {
    const { putFlowerGuideCardsCache } = await import("./flower-guide-cards");
    const bad = sample("GB", 1);
    bad.country = "US" as "GB";
    const result = read(await putFlowerGuideCardsCache(event("PUT", "US", bad)));
    assert.equal(result.status, 400);
  });
});
