import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  configKeys,
  homepageCatalogDataSchema,
  isHomepageCatalogFresh,
  type HomepageCatalogData,
} from "@blossompot/shared";
import { CONFIG_TABLE, docClient, now } from "../lib/db";
import { badRequest, notFound, ok } from "../lib/response";

const TTL_MS = 45_000;

function countryFromEvent(event: APIGatewayProxyEventV2): string | null {
  const raw = event.queryStringParameters?.country ?? "";
  const iso = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(iso) ? iso : null;
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

async function readItem(country: string): Promise<(HomepageCatalogData & { cachedAt?: string }) | null> {
  const key = configKeys.homepageCatalog(country);
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: key.pk, SK: key.sk },
    })
  );
  return (result.Item as (HomepageCatalogData & { cachedAt?: string }) | undefined) ?? null;
}

/**
 * Shared homepage record. Misses are 404 so the storefront recomputes with the existing catalog rules.
 * The response is no-store: freshness lives in the config item, not in a shared HTTP cache.
 */
export async function getHomepageCatalogCache(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const country = countryFromEvent(event);
  if (!country) return badRequest("country is required");

  const item = await readItem(country);
  if (!item?.cachedAt || !isHomepageCatalogFresh(item.cachedAt)) {
    return notFound("Homepage catalog cache miss");
  }

  const parsed = homepageCatalogDataSchema.safeParse(item);
  if (!parsed.success || parsed.data.country !== country) {
    return notFound("Homepage catalog cache miss");
  }

  return ok(parsed.data);
}

/**
 * Stores a homepage record computed by the storefront.
 * A fresh country record is left unchanged so a later writer cannot replace it inside the 45-second window.
 */
export async function putHomepageCatalogCache(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const country = countryFromEvent(event);
  if (!country) return badRequest("country is required");

  const body = parseBody(event);
  if (body == null) return badRequest("Invalid JSON");

  const parsed = homepageCatalogDataSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);
  if (parsed.data.country !== country) return badRequest("country does not match");

  const existing = await readItem(country);
  if (existing?.cachedAt && isHomepageCatalogFresh(existing.cachedAt)) {
    return ok({ stored: false });
  }

  const key = configKeys.homepageCatalog(country);
  const cachedAt = now();
  try {
    await docClient.send(
      new PutCommand({
        TableName: CONFIG_TABLE,
        Item: {
          PK: key.pk,
          SK: key.sk,
          ...parsed.data,
          cachedAt,
        },
        ConditionExpression: "attribute_not_exists(cachedAt) OR cachedAt <= :cutoff",
        ExpressionAttributeValues: {
          ":cutoff": new Date(Date.now() - TTL_MS).toISOString(),
        },
      })
    );
  } catch (err) {
    if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
      return ok({ stored: false });
    }
    throw err;
  }

  return ok({ stored: true });
}
