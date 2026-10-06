import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  configKeys,
  flowerGuideCardsSchema,
  isFlowerGuideCardsFresh,
  FLOWER_GUIDE_CARDS_TTL_SECONDS,
  type FlowerGuideCardsData,
} from "@blossompot/shared";
import { CONFIG_TABLE, docClient, now } from "../lib/db";
import { badRequest, notFound, ok } from "../lib/response";

const TTL_MS = FLOWER_GUIDE_CARDS_TTL_SECONDS * 1000;

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

async function readItem(country: string): Promise<(FlowerGuideCardsData & { cachedAt?: string }) | null> {
  const key = configKeys.flowerGuideCards(country);
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: key.pk, SK: key.sk },
    })
  );
  return (result.Item as (FlowerGuideCardsData & { cachedAt?: string }) | undefined) ?? null;
}

/**
 * Selected flower-guide cards for one country.
 * A miss is 404 so the storefront rebuilds with the existing selection rules.
 * The response is no-store: freshness lives on the config item, not in a shared HTTP cache.
 */
export async function getFlowerGuideCardsCache(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const country = countryFromEvent(event);
  if (!country) return badRequest("country is required");

  const item = await readItem(country);
  const fresh = Boolean(item?.cachedAt && isFlowerGuideCardsFresh(item.cachedAt));
  console.info(
    `flower-guide-cards country=${country} found=${Boolean(item)} fresh=${fresh} table=${CONFIG_TABLE}`
  );
  if (!item?.cachedAt || !fresh) {
    return notFound("Flower guide card cache miss");
  }

  const parsed = flowerGuideCardsSchema.safeParse(item);
  if (!parsed.success || parsed.data.country !== country) {
    return notFound("Flower guide card cache miss");
  }

  return ok(parsed.data);
}

/**
 * Stores the cards the storefront already selected for one guide.
 * A fresh country record is left unchanged for the rest of the 45-second window.
 */
export async function putFlowerGuideCardsCache(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const country = countryFromEvent(event);
  if (!country) return badRequest("country is required");

  const body = parseBody(event);
  if (body == null) return badRequest("Invalid JSON");

  const parsed = flowerGuideCardsSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);
  if (parsed.data.country !== country) return badRequest("country does not match");

  const existing = await readItem(country);
  if (existing?.cachedAt && isFlowerGuideCardsFresh(existing.cachedAt)) {
    return ok({ stored: false });
  }

  const key = configKeys.flowerGuideCards(country);
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
