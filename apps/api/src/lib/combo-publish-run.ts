import { resolveComboPublishConfig, ComboPublishConfigError, type ComboPublishTarget } from "./combo-publish-config";
import type { ComboPublishResult } from "./combo-publish";

export { ComboPublishConfigError, resolveComboPublishConfig };
export type { ComboPublishTarget };

/**
 * Publish generated combos once, after the caller confirms the target.
 * This module does not connect to a database until the configuration is valid
 * and matches the process that will perform the write.
 */
export async function runExplicitComboPublish(input?: {
  env?: NodeJS.ProcessEnv;
  argv?: readonly string[];
}): Promise<ComboPublishResult> {
  const env = input?.env ?? process.env;
  const argv = input?.argv ?? process.argv;
  const target = resolveComboPublishConfig(env, argv);
  assertProcessMatches(target);

  const sources = await import("./combo-memory-init");
  const publishing = await import("./combo-publish");
  return publishing.publishGeneratedCombos(await sources.loadComboPublishInputs());
}

function assertProcessMatches(target: ComboPublishTarget): void {
  const productsTable = process.env.PRODUCTS_TABLE?.trim() ?? "";
  const configTable = process.env.CONFIG_TABLE?.trim() ?? "";
  const memory = process.env.USE_MEMORY_DB === "true";
  if (productsTable !== target.productsTable || configTable !== target.configTable || memory !== target.memory) {
    throw new ComboPublishConfigError(
      "The process environment does not match the resolved combo publish target."
    );
  }
  if (target.memory && process.env.DYNAMODB_ENDPOINT?.trim()) {
    throw new ComboPublishConfigError(
      "Refusing to publish combos when USE_MEMORY_DB=true and DYNAMODB_ENDPOINT are both set."
    );
  }
  if (!target.memory && (process.env.AWS_REGION?.trim() ?? "") !== target.region) {
    throw new ComboPublishConfigError("The process AWS_REGION does not match the resolved combo publish target.");
  }
}
