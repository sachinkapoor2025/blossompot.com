/**
 * Create the four catalog vendor rows in CONFIG_TABLE when they are missing.
 * Existing rows are left unchanged. The storefront does not require this script:
 * missing rows use the code defaults.
 *
 * Run: npm run seed:catalog-vendors
 * Dry run: npm run seed:catalog-vendors -- --dry-run
 *
 * Refuses ENVIRONMENT=prod or production. Does not touch service areas or products.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  CATALOG_VENDOR_SLUGS,
  catalogVendorKeys,
  defaultCatalogVendor,
} from "@blossompot/shared";

const dryRun = process.argv.includes("--dry-run");
const ENV = (process.env.ENVIRONMENT ?? "dev").trim().toLowerCase();
const TABLE = process.env.CONFIG_TABLE ?? `blossompot-config-${ENV}`;
const REGION = process.env.AWS_DEFAULT_REGION ?? process.env.AWS_REGION ?? "us-east-1";

async function main() {
  if (ENV === "prod" || ENV === "production") {
    console.error("Refusing to seed catalog vendors when ENVIRONMENT is production.");
    process.exit(1);
  }

  console.log(`${dryRun ? "Dry run" : "Seeding"} catalog vendors into ${TABLE}`);
  const now = new Date().toISOString();
  const doc = dryRun
    ? null
    : DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
        marshallOptions: { removeUndefinedValues: true },
      });

  for (const slug of CATALOG_VENDOR_SLUGS) {
    const vendor = { ...defaultCatalogVendor(slug), updatedAt: now, updatedBy: "seed:catalog-vendors" };
    const item = {
      PK: catalogVendorKeys.pk(slug),
      SK: catalogVendorKeys.sk(),
      ...vendor,
    };
    if (dryRun || !doc) {
      console.log(`would create ${item.PK} if missing`);
      continue;
    }
    try {
      await doc.send(
        new PutCommand({
          TableName: TABLE,
          Item: item,
          ConditionExpression: "attribute_not_exists(PK)",
        })
      );
      console.log(`created ${item.PK}`);
    } catch (err) {
      const name = err && typeof err === "object" && "name" in err ? String(err.name) : "";
      if (name === "ConditionalCheckFailedException") {
        console.log(`exists, skipped ${item.PK}`);
        continue;
      }
      throw err;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
