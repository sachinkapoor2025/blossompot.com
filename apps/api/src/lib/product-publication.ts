import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { productKeys } from "@blossompot/shared";
import { docClient, PRODUCTS_TABLE } from "./db";

/**
 * A stored catalog row is unpublished only when `published` is exactly false.
 * A missing flag stays eligible, matching the product schema default of true.
 */
export function isStoredProductUnpublished(product: { published?: boolean } | null | undefined): boolean {
  return product?.published === false;
}

/** Same wording inventory uses when a cart line can no longer be bought. */
export function unpublishedProductMessage(name: string): string {
  const label = name.trim() || "This product";
  return `${label} is no longer available.`;
}

type StoredPublication = { found: boolean; unpublished: boolean; name: string; slug: string };

async function readStoredPublication(slug: string): Promise<StoredPublication> {
  const result = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
  const item = result.Item as { published?: boolean; name?: string; slug?: string } | undefined;
  if (!item) return { found: false, unpublished: false, name: "", slug };
  return {
    found: true,
    unpublished: isStoredProductUnpublished(item),
    name: typeof item.name === "string" ? item.name : "",
    slug: typeof item.slug === "string" && item.slug ? item.slug : slug,
  };
}

const PUBLICATION_READ_CHUNK = 25;

async function readPublishedFlag(slug: string): Promise<{ slug: string; published?: boolean } | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
      ProjectionExpression: "published, slug",
      ConsistentRead: true,
    })
  );
  const item = result.Item as { published?: boolean; slug?: string } | undefined;
  if (!item) return null;
  const published = typeof item.published === "boolean" ? item.published : undefined;
  return {
    slug: typeof item.slug === "string" && item.slug ? item.slug : slug,
    ...(published === undefined ? {} : { published }),
  };
}

/**
 * Current `published` flag for stored rows.
 * A missing attribute is `undefined` so callers keep the schema default.
 * Rows that are not in the table are omitted.
 */
export async function storedPublishedBySlug(slugs: readonly string[]): Promise<Map<string, boolean | undefined>> {
  const unique = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
  const flags = new Map<string, boolean | undefined>();
  for (let index = 0; index < unique.length; index += PUBLICATION_READ_CHUNK) {
    const slice = unique.slice(index, index + PUBLICATION_READ_CHUNK);
    const rows = await Promise.all(slice.map((slug) => readPublishedFlag(slug)));
    for (const row of rows) {
      if (!row) continue;
      flags.set(row.slug, row.published);
    }
  }
  return flags;
}

/** Slugs whose current catalog row is unpublished. Missing rows are not included. */
export async function slugsMarkedUnpublished(slugs: readonly string[]): Promise<Set<string>> {
  const unique = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
  const hidden = new Set<string>();
  for (let index = 0; index < unique.length; index += PUBLICATION_READ_CHUNK) {
    const slice = unique.slice(index, index + PUBLICATION_READ_CHUNK);
    const rows = await Promise.all(slice.map((slug) => readStoredPublication(slug)));
    for (const row of rows) {
      if (row.unpublished) hidden.add(row.slug);
    }
  }
  return hidden;
}

export async function readProductPublication(slug: string): Promise<StoredPublication> {
  return readStoredPublication(slug);
}
