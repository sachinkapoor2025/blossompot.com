import { TransactWriteCommand, type TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import {
  SKU_OWNER_CONDITION,
  catalogSkuReservationItem,
  normalizeCatalogSku,
  productKeys,
  productSkuKeys,
} from "@blossompot/shared";
import { PRODUCTS_TABLE, docClient } from "./db";

type TransactItem = NonNullable<TransactWriteCommandInput["TransactItems"]>[number];

export const SKU_TAKEN_MESSAGE = "This SKU is already reserved by another product.";

export function isTransactionConflict(err: unknown): boolean {
  const name = err && typeof err === "object" && "name" in err ? String((err as { name: string }).name) : "";
  return name === "TransactionCanceledException" || name === "ConditionalCheckFailedException";
}

export function productSkuGuard(currentSku: unknown): {
  ConditionExpression: string;
  ExpressionAttributeValues?: Record<string, unknown>;
} {
  if (typeof currentSku === "string") {
    return {
      ConditionExpression: "attribute_exists(PK) AND sku = :currentSku",
      ExpressionAttributeValues: { ":currentSku": currentSku },
    };
  }
  return { ConditionExpression: "attribute_exists(PK) AND attribute_not_exists(sku)" };
}

export function skuClaimPut(
  tableName: string,
  sku: string,
  productSlug: string,
  extra: Record<string, unknown> = {}
): TransactItem | null {
  const item = catalogSkuReservationItem(sku, productSlug, extra);
  if (!item) return null;
  return {
    Put: {
      TableName: tableName,
      Item: item,
      ConditionExpression: SKU_OWNER_CONDITION,
      ExpressionAttributeValues: { ":skuOwner": productSlug },
    },
  };
}

export function skuReleaseDelete(tableName: string, sku: string, productSlug: string): TransactItem | null {
  const normalized = normalizeCatalogSku(sku);
  if (!normalized) return null;
  return {
    Delete: {
      TableName: tableName,
      Key: { PK: productSkuKeys.pk(normalized), SK: productSkuKeys.sk() },
      ConditionExpression: SKU_OWNER_CONDITION,
      ExpressionAttributeValues: { ":skuOwner": productSlug },
    },
  };
}

function skuActions(tableName: string, slug: string, previousSku: unknown, nextSku: string | undefined, extra?: Record<string, unknown>): TransactItem[] {
  const previous = typeof previousSku === "string" ? previousSku : undefined;
  const previousKey = normalizeCatalogSku(previous);
  const nextKey = normalizeCatalogSku(nextSku);
  const actions: TransactItem[] = [];
  if (nextSku && nextKey) {
    const claim = skuClaimPut(tableName, nextSku, slug, extra);
    if (claim) actions.push(claim);
  }
  if (previous && previousKey && previousKey !== nextKey) {
    const release = skuReleaseDelete(tableName, previous, slug);
    if (release) actions.push(release);
  }
  return actions;
}

export async function transactCatalogItems(items: TransactItem[]): Promise<void> {
  if (items.length === 0) return;
  if (items.length > 100) {
    throw new Error("Catalog write exceeds the DynamoDB transaction action limit.");
  }
  await docClient.send(new TransactWriteCommand({ TransactItems: items }));
}

/** Insert a product and, when it has a SKU, reserve that SKU. Fails if either key exists for someone else. */
export async function insertCatalogProduct(item: Record<string, unknown>, extraSku: Record<string, unknown> = {}): Promise<void> {
  const slug = String(item.slug ?? "");
  const actions: TransactItem[] = [
    {
      Put: {
        TableName: PRODUCTS_TABLE,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)",
      },
    },
  ];
  if (typeof item.sku === "string") actions.push(...skuActions(PRODUCTS_TABLE, slug, undefined, item.sku, extraSku));
  await transactCatalogItems(actions);
}

/**
 * Replace a product the caller already read.
 * The product condition keeps a concurrent SKU change from being overwritten.
 * A changed SKU is reserved and the previous reservation released in the same transaction.
 * Passing the same normalized SKU does not rewrite the reservation.
 */
export async function replaceCatalogProduct(input: {
  item: Record<string, unknown>;
  previousSku: unknown;
  nextSku: string | undefined;
}): Promise<void> {
  const slug = String(input.item.slug ?? "");
  const guard = productSkuGuard(input.previousSku);
  await transactCatalogItems([
    {
      Put: {
        TableName: PRODUCTS_TABLE,
        Item: input.item,
        ConditionExpression: guard.ConditionExpression,
        ...(guard.ExpressionAttributeValues ? { ExpressionAttributeValues: guard.ExpressionAttributeValues } : {}),
      },
    },
    ...skuActions(PRODUCTS_TABLE, slug, input.previousSku, input.nextSku),
  ]);
}

/**
 * Remove a product created by an import whose later source-pointer write failed.
 * Both the product and its reservation must still belong to this import.
 * A concurrent SKU change cancels the transaction and leaves that product in place.
 */
export async function deleteImportedProductIfUnchanged(input: {
  slug: string;
  sku: string;
  sourceUrl: string;
}): Promise<"deleted" | "kept"> {
  const normalized = normalizeCatalogSku(input.sku);
  if (!normalized) return "kept";
  try {
    await transactCatalogItems([
      {
        Delete: {
          TableName: PRODUCTS_TABLE,
          Key: { PK: productKeys.pk(input.slug), SK: productKeys.sk() },
          ConditionExpression: "sourceUrl = :sourceUrl AND sku = :importedSku",
          ExpressionAttributeValues: {
            ":sourceUrl": input.sourceUrl,
            ":importedSku": input.sku,
          },
        },
      },
      {
        Delete: {
          TableName: PRODUCTS_TABLE,
          Key: { PK: productSkuKeys.pk(normalized), SK: productSkuKeys.sk() },
          ConditionExpression: "attribute_exists(PK) AND productSlug = :skuOwner",
          ExpressionAttributeValues: { ":skuOwner": input.slug },
        },
      },
    ]);
    return "deleted";
  } catch (err) {
    if (!isTransactionConflict(err)) throw err;
    return "kept";
  }
}

export async function deleteCatalogProduct(slug: string, sku: unknown): Promise<void> {
  const actions: TransactItem[] = [
    {
      Delete: {
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
        ConditionExpression: "attribute_exists(PK)",
      },
    },
  ];
  if (typeof sku === "string") {
    const release = skuReleaseDelete(PRODUCTS_TABLE, sku, slug);
    if (release) actions.push(release);
  }
  await transactCatalogItems(actions);
}
