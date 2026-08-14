/**
 * Upsert Om+Pearl $6.99 combo; set Festive Ruby $14; Peach Lumba $6.99 (fixed prices).
 *
 *   ENVIRONMENT=prod npx tsx scripts/upsert-om-pearl-combo-and-prices.ts
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { productKeys } from "@blossompot/shared";
import catalog from "./data/blossompot-catalog.json";

const ENV = process.env.ENVIRONMENT ?? "prod";
const TABLE = process.env.PRODUCTS_TABLE ?? `blossompot-products-${ENV}`;
const REGION = process.env.AWS_DEFAULT_REGION ?? process.env.AWS_REGION ?? "us-east-1";

const COMBO_SLUG = "om-pearl-single-rakhi-combo";

function withFixedPriceTag(tags: unknown): string[] {
  const base = Array.isArray(tags) ? (tags as string[]) : [];
  return Array.from(new Set([...base, "fixed-price"]));
}

async function main() {
  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
  const ts = new Date().toISOString();

  const bundled = (catalog as { products: Array<Record<string, unknown>> }).products.find(
    (p) => p.slug === COMBO_SLUG
  );
  if (!bundled) {
    console.error(`Catalog missing ${COMBO_SLUG}`);
    process.exit(1);
  }

  const slug = String(bundled.slug);
  const key = { PK: productKeys.pk(slug), SK: productKeys.sk() };
  const existing = await doc.send(new GetCommand({ TableName: TABLE, Key: key }));
  const categorySlug = String(bundled.categorySlug ?? "rakhi-combo");

  const comboItem = {
    ...(existing.Item ?? {}),
    ...bundled,
    slug,
    categorySlug,
    currency: "USD",
    price: 6.99,
    compareAtPrice: 13.99,
    inventory: Number(bundled.inventory ?? 200),
    unitsSold: Math.max(Number(existing.Item?.unitsSold ?? 0), Number(bundled.unitsSold ?? 28)),
    weightOz: Number(bundled.weightOz ?? 12),
    tags: withFixedPriceTag([
      ...(Array.isArray(existing.Item?.tags) ? (existing.Item!.tags as string[]) : []),
      ...(Array.isArray(bundled.tags) ? (bundled.tags as string[]) : []),
      "combo",
      "fast-selling",
    ]),
    published: true,
    PK: key.PK,
    SK: key.SK,
    GSI1PK: productKeys.gsi1pk(categorySlug),
    GSI1SK: productKeys.gsi1sk(slug),
    createdAt: (existing.Item?.createdAt as string) ?? ts,
    updatedAt: ts,
  };

  await doc.send(new PutCommand({ TableName: TABLE, Item: comboItem }));
  console.log(
    `${existing.Item ? "Updated" : "Created"} ${slug} @ $${comboItem.price} unitsSold=${comboItem.unitsSold}`
  );

  for (const patch of [
    {
      slug: "festive-ruby-designer-single-rakhi",
      price: 14,
      compareAtPrice: 19.5,
      label: "Festive Ruby Designer Single Rakhi",
    },
    {
      slug: "designer-peach-lumba-rakhi-for-bhabhi",
      price: 6.99,
      compareAtPrice: 9.99,
      label: "Designer Peach Lumba Rakhi for Bhabhi",
    },
  ] as const) {
    const res = await doc.send(
      new GetCommand({
        TableName: TABLE,
        Key: { PK: productKeys.pk(patch.slug), SK: productKeys.sk() },
      })
    );
    if (!res.Item) {
      console.warn(`Missing ${patch.slug}`);
      continue;
    }
    await doc.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          ...res.Item,
          price: patch.price,
          compareAtPrice: Math.max(Number(res.Item.compareAtPrice ?? 0), patch.compareAtPrice),
          tags: withFixedPriceTag(res.Item.tags),
          updatedAt: ts,
        },
      })
    );
    console.log(`Updated ${patch.label} → $${patch.price}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
