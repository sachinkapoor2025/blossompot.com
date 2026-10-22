/**
 * Insert generated combo rows into the database named by the environment.
 * Existing combo rows, including admin edits, are left unchanged.
 * Product-slug conflicts are skipped.
 *
 * This file is not imported by the API, the web app, or the test suite.
 *
 * Required:
 *   --publish
 *   PRODUCTS_TABLE
 *   CONFIG_TABLE
 *   AWS_REGION, unless USE_MEMORY_DB=true
 *
 * Example:
 *   PRODUCTS_TABLE=... CONFIG_TABLE=... AWS_REGION=... npm run publish:combos -- --publish
 */
import { ComboPublishConfigError, resolveComboPublishConfig, runExplicitComboPublish } from "../apps/api/src/lib/combo-publish-run";

async function main() {
  const target = resolveComboPublishConfig(process.env, process.argv);
  const where = target.memory ? "in-memory database" : `region ${target.region}`;
  console.log(
    `Publishing combos into products table ${target.productsTable} and config table ${target.configTable} (${where}).`
  );
  const result = await runExplicitComboPublish();
  console.log(
    `Generated ${result.generated}, inserted ${result.inserted}, skipped ${result.skipped}.`
  );
  for (const skip of result.skips) {
    console.log(`skipped ${skip.slug} (${skip.reason})`);
  }
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
