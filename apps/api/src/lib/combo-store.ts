import { GetCommand, QueryCommand, type QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import {
  ComboNotFoundError,
  ComboSlugConflictError,
  comboKeys,
  comboSchema,
  createStoredCombo,
  parseGboSlug,
  productKeys,
  updateStoredCombo,
  type StoredCombo,
} from "@blossompot/shared";
import { getBundledUsarakhiProduct } from "./blossompot-catalog";
import { isTransactionConflict, transactCatalogItems } from "./catalog-sku-write";
import { docClient, now, PRODUCTS_TABLE } from "./db";
import { getBundledOrangeCountyProduct } from "./orange-county-catalog";

function comboKey(slug: string) {
  return { PK: comboKeys.pk(slug), SK: comboKeys.sk() };
}

async function readCombo(slug: string): Promise<StoredCombo | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: comboKey(slug),
    })
  );
  return result.Item as StoredCombo | undefined;
}

/** True when the slug is already a catalog product, including one with no DynamoDB row yet. */
function productSlugAssigned(slug: string): boolean {
  return (
    getBundledUsarakhiProduct(slug) != null ||
    getBundledOrangeCountyProduct(slug) != null ||
    parseGboSlug(slug) != null
  );
}

/** The same product-slug collision insertCombo enforces, without writing a combo row. */
export async function comboSlugTakenByProduct(slug: string): Promise<boolean> {
  if (productSlugAssigned(slug)) return true;
  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
  return existing.Item != null;
}

/** Insert a combo. An existing COMBO#{slug} row is left unchanged. */
export async function insertCombo(input: unknown, timestamp = now()): Promise<StoredCombo> {
  const parsed = comboSchema.parse(input);
  const existing = await readCombo(parsed.slug);
  const item = createStoredCombo(parsed, timestamp, existing);
  if (productSlugAssigned(parsed.slug)) throw new ComboSlugConflictError();
  try {
    await transactCatalogItems([
      {
        Put: {
          TableName: PRODUCTS_TABLE,
          Item: item,
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
      {
        ConditionCheck: {
          TableName: PRODUCTS_TABLE,
          Key: { PK: productKeys.pk(parsed.slug), SK: productKeys.sk() },
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
    ]);
  } catch (err) {
    if (isTransactionConflict(err)) throw new ComboSlugConflictError();
    throw err;
  }
  return item;
}

/** Replace the mutable combo fields. createdAt and the slug stay as stored. */
export async function updateCombo(slug: string, patch: unknown, timestamp = now()): Promise<StoredCombo> {
  const existing = await readCombo(slug);
  if (!existing) throw new ComboNotFoundError();
  const item = updateStoredCombo(existing, patch, timestamp);
  try {
    await transactCatalogItems([
      {
        Put: {
          TableName: PRODUCTS_TABLE,
          Item: item,
          ConditionExpression: "attribute_exists(PK)",
        },
      },
    ]);
  } catch (err) {
    if (isTransactionConflict(err)) throw new ComboNotFoundError();
    throw err;
  }
  return item;
}

/** List combo rows by merchandising order. Uses GSI1, not a table scan. */
export async function queryCombos(): Promise<StoredCombo[]> {
  const items: StoredCombo[] = [];
  let ExclusiveStartKey: QueryCommandInput["ExclusiveStartKey"];
  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: PRODUCTS_TABLE,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": comboKeys.gsi1pk() },
        ExclusiveStartKey,
      })
    );
    if (result.Items?.length) items.push(...(result.Items as StoredCombo[]));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}
