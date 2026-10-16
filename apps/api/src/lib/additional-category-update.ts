import { productKeys } from "@blossompot/shared";
import { PRODUCTS_TABLE } from "./db";
import { isTransactionConflict, transactCatalogItems } from "./catalog-sku-write";

/**
 * `null` means the product has no `additionalCategorySlugs` attribute.
 * An empty array is a different stored state.
 */
export type StoredAdditionalCategories = readonly string[] | null;

export class AdditionalCategoryConflictError extends Error {
  constructor() {
    super("The product category state changed or the product does not exist.");
    this.name = "AdditionalCategoryConflictError";
  }
}

export type AppendProductAdditionalCategoryInput = {
  slug: string;
  expectedCategorySlug: string;
  expectedAdditionalCategorySlugs: StoredAdditionalCategories;
  additionalSlug: string;
};

function sameList(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/**
 * Append one additional category with a conditional update.
 * The write sets only `additionalCategorySlugs`. Primary category and GSI keys stay as stored.
 * A missing product or a different primary/additional state cancels the update.
 */
export async function appendProductAdditionalCategory(
  input: AppendProductAdditionalCategoryInput
): Promise<{ additionalCategorySlugs: string[] }> {
  const slug = input.slug.trim();
  const expectedCategorySlug = input.expectedCategorySlug.trim();
  const additionalSlug = input.additionalSlug.trim();
  if (!slug) throw new Error("A product slug is required.");
  if (!expectedCategorySlug) throw new Error("The expected primary category is required.");
  if (!additionalSlug) throw new Error("An additional category slug is required.");

  const current = [...(input.expectedAdditionalCategorySlugs ?? [])];
  const next = [...current];
  if (additionalSlug !== expectedCategorySlug && !next.includes(additionalSlug)) next.push(additionalSlug);
  if (input.expectedAdditionalCategorySlugs == null ? next.length === 0 : sameList(next, current)) {
    return { additionalCategorySlugs: next };
  }

  const values: Record<string, unknown> = {
    ":primary": expectedCategorySlug,
    ":next": next,
  };
  const additionalGuard =
    input.expectedAdditionalCategorySlugs == null
      ? "attribute_not_exists(additionalCategorySlugs)"
      : "additionalCategorySlugs = :expectedAdditional";
  if (input.expectedAdditionalCategorySlugs != null) {
    values[":expectedAdditional"] = [...input.expectedAdditionalCategorySlugs];
  }

  try {
    await transactCatalogItems([
      {
        Update: {
          TableName: PRODUCTS_TABLE,
          Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
          UpdateExpression: "SET additionalCategorySlugs = :next",
          ConditionExpression: `attribute_exists(PK) AND categorySlug = :primary AND ${additionalGuard}`,
          ExpressionAttributeValues: values,
        },
      },
    ]);
  } catch (err) {
    if (isTransactionConflict(err)) throw new AdditionalCategoryConflictError();
    throw err;
  }

  return { additionalCategorySlugs: next };
}
