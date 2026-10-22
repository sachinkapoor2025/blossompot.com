/**
 * Create CONFIG#CATALOG_COUNTRIES in CONFIG_TABLE when it is missing.
 * The only enabled country is the United States. Existing rows are left unchanged.
 * Does not touch catalog vendors, products, service areas, or GBO settings.
 *
 * Run: npm run seed:catalog-countries
 * Dry run: npm run seed:catalog-countries -- --dry-run
 *
 * Refuses ENVIRONMENT=prod or production.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { catalogCountryKeys, defaultCatalogCountries } from "@blossompot/shared";

const dryRun = process.argv.includes("--dry-run");
const ENV = (process.env.ENVIRONMENT ?? "dev").trim().toLowerCase();
const TABLE = process.env.CONFIG_TABLE ?? `blossompot-config-${ENV}`;
const REGION = process.env.AWS_DEFAULT_REGION ?? process.env.AWS_REGION ?? "us-east-1";

async function main() {
  if (ENV === "prod" || ENV === "production") {
    console.error("Refusing to seed catalog countries when ENVIRONMENT is production.");
    process.exit(1);
  }

  const now = new Date().toISOString();
  const item = {
    PK: catalogCountryKeys.pk,
    SK: catalogCountryKeys.sk,
    countries: defaultCatalogCountries(),
    defaultCountry: "US",
    updatedAt: now,
    updatedBy: "seed:catalog-countries",
  };
  console.log(`${dryRun ? "Dry run" : "Seeding"} ${item.PK} into ${TABLE} (${REGION})`);
  if (dryRun) {
    console.log("would create CONFIG#CATALOG_COUNTRIES if missing", item.countries);
    return;
  }

  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    marshallOptions: { removeUndefinedValues: true },
  });
  try {
    await doc.send(
      new PutCommand({
        TableName: TABLE,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );
    console.log("created CONFIG#CATALOG_COUNTRIES");
  } catch (err) {
    const name = err && typeof err === "object" && "name" in err ? String(err.name) : "";
    if (name === "ConditionalCheckFailedException") {
      console.log("exists, skipped CONFIG#CATALOG_COUNTRIES");
      return;
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
