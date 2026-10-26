/**
 * Report or insert generated combo rows for the database named by the environment.
 * Without --publish, this prints the candidate report and writes nothing.
 * Existing combo rows, including admin edits, are left unchanged.
 * Product-slug conflicts are skipped.
 *
 * This file is not imported by the API, the web app, or the test suite.
 *
 * Required:
 *   --country XX
 *   PRODUCTS_TABLE
 *   CONFIG_TABLE
 *   ENVIRONMENT=local|dev|prod
 *   AWS_REGION, unless USE_MEMORY_DB=true
 *
 * A production write also requires --publish and --confirm-production.
 *
 * Example:
 *   ENVIRONMENT=dev PRODUCTS_TABLE=blossompot-products-dev CONFIG_TABLE=blossompot-config-dev AWS_REGION=us-east-1 npm run publish:combos -- --country US
 *   ENVIRONMENT=prod PRODUCTS_TABLE=blossompot-products-prod CONFIG_TABLE=blossompot-config-prod AWS_REGION=us-east-1 npm run publish:combos -- --country US --publish --confirm-production
 */
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { ComboPublishConfigError, resolveComboPublishConfig, runExplicitComboPublish } from "../apps/api/src/lib/combo-publish-run";

async function main() {
  const target = resolveComboPublishConfig(process.env, process.argv);
  const accountId = target.memory ? "local" : await resolveAccount(target.region ?? "");
  const report = await runExplicitComboPublish({ accountId });
  console.log(JSON.stringify(report, null, 2));
}

async function resolveAccount(region: string): Promise<string> {
  const identity = await new STSClient({ region }).send(new GetCallerIdentityCommand({}));
  const accountId = identity.Account?.trim() ?? "";
  if (!accountId) {
    throw new ComboPublishConfigError(
      "Refusing to publish combos. The AWS account was not resolved before reading the catalog."
    );
  }
  return accountId;
}

const entry = process.argv[1]?.replace(/\\/g, "/");
if (entry?.endsWith("/scripts/publish-combos.ts") || entry?.endsWith("/scripts/publish-combos.js")) {
  main().catch((err: unknown) => {
    if (err instanceof ComboPublishConfigError) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}
