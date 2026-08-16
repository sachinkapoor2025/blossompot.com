/**
 * Seed built-in vendor coverage (BlossomPot + Orange County).
 * Marketplace vendors keep their own admin-managed areas.
 *
 * Run: npm run seed:serviceability
 * Requires AWS credentials and CONFIG_TABLE / ENVIRONMENT.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  VENDOR_BLOSSOMPOT,
  VENDOR_ORANGE_COUNTY,
  defaultBlossompotAreas,
  defaultOrangeCountyAreas,
  vendorCoverageKeys,
} from "@blossompot/shared";

const ENV = process.env.ENVIRONMENT ?? "prod";
const TABLE = process.env.CONFIG_TABLE ?? `blossompot-config-${ENV}`;
const REGION = process.env.AWS_DEFAULT_REGION ?? process.env.AWS_REGION ?? "us-east-1";
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

async function putAreas(vendorSlug: string, areas: ReturnType<typeof defaultBlossompotAreas>) {
  const now = new Date().toISOString();
  for (const area of areas) {
    await doc.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          PK: vendorCoverageKeys.pk(vendorSlug),
          SK: vendorCoverageKeys.areaSk(area.areaId),
          ...area,
          updatedAt: now,
        },
      })
    );
  }
  await doc.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: vendorCoverageKeys.pk(vendorSlug),
        SK: vendorCoverageKeys.metaSk(),
        vendorSlug,
        updatedAt: now,
      },
    })
  );
}

async function main() {
  console.log(`Seeding serviceability defaults into ${TABLE}`);
  await putAreas(VENDOR_BLOSSOMPOT, defaultBlossompotAreas());
  await putAreas(VENDOR_ORANGE_COUNTY, defaultOrangeCountyAreas());
  console.log("Seeded BlossomPot (US country) and Orange County prefixes 926/927/928/906/907");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
