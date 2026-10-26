import { normalizedFulfillmentVendorSlug, type ComboDraft } from "@blossompot/shared";
import {
  assertComboPublishAccount,
  resolveComboPublishConfig,
  ComboPublishConfigError,
  type ComboPublishTarget,
} from "./combo-publish-config";
import type { ComboPublishSkip } from "./combo-publish";
import type { ComboPublishInputs } from "./combo-memory-init";

export { ComboPublishConfigError, resolveComboPublishConfig, assertComboPublishAccount };
export type { ComboPublishTarget };

export type ComboPublishCandidate = {
  slug: string;
  name: string;
  resolvedVendorSlug: string;
  components: Array<{ name: string; slug: string; resolvedVendorSlug: string }>;
};

export type ComboPublishReport = {
  mode: "dry-run" | "publish";
  accountId: string;
  region: string | null;
  environment: ComboPublishTarget["environment"];
  productsTable: string;
  configTable: string;
  country: string;
  scannedProducts: number;
  eligibleProducts: number;
  vendorsConsidered: number;
  candidateCombosByVendor: Record<string, number>;
  candidates: ComboPublishCandidate[];
  exclusions: ComboPublishInputs["exclusions"];
  skips: ComboPublishSkip[];
  skipped: number;
  expectedWrites: number;
  inserted?: number;
};

/**
 * Report or publish generated combos after the caller confirms the target.
 * This module does not connect to a database until the configuration is valid
 * and matches the process that will perform the read or write.
 * A dry-run reads the catalog and writes nothing.
 */
export async function runExplicitComboPublish(input?: {
  env?: NodeJS.ProcessEnv;
  argv?: readonly string[];
  accountId?: string;
}): Promise<ComboPublishReport> {
  const env = input?.env ?? process.env;
  const argv = input?.argv ?? process.argv;
  const target = resolveComboPublishConfig(env, argv);
  assertProcessMatches(target);
  const accountId = input?.accountId ?? (target.memory ? "local" : "");
  if (!target.memory && !input?.accountId) {
    throw new ComboPublishConfigError(
      "Refusing to publish combos. The AWS account was not resolved before reading the catalog."
    );
  }
  assertComboPublishAccount(target, accountId);

  const sources = await import("./combo-memory-init");
  const inputs = await sources.loadComboPublishInputs(target.country);
  const publishing = await import("./combo-publish");
  const plan = await publishing.planComboPublication({
    products: inputs.products,
    vendors: inputs.vendors,
  });
  const report = buildReport(target, accountId, inputs, plan.drafts, plan.skips, plan.writes.length);

  if (!target.publish) return report;

  const written = await publishing.publishGeneratedCombos({
    products: inputs.products,
    vendors: inputs.vendors,
  });
  return {
    ...report,
    skips: written.skips,
    skipped: written.skipped,
    inserted: written.inserted,
  };
}

function buildReport(
  target: ComboPublishTarget,
  accountId: string,
  inputs: ComboPublishInputs,
  drafts: readonly ComboDraft[],
  skips: readonly ComboPublishSkip[],
  expectedWrites: number
): ComboPublishReport {
  const bySlug = new Map(inputs.products.map((product) => [product.slug, product]));
  const byVendor = new Map<string, number>();
  const candidates: ComboPublishCandidate[] = drafts.map((draft) => {
    const components = draft.productSlugs.map((slug) => {
      const product = bySlug.get(slug);
      const resolvedVendorSlug = product ? normalizedFulfillmentVendorSlug(product) : "";
      return {
        name: product?.name ?? slug,
        slug,
        resolvedVendorSlug,
      };
    });
    const resolvedVendorSlug = components[0]?.resolvedVendorSlug ?? "";
    byVendor.set(resolvedVendorSlug, (byVendor.get(resolvedVendorSlug) ?? 0) + 1);
    return {
      slug: draft.slug,
      name: draft.name,
      resolvedVendorSlug,
      components,
    };
  });
  const vendors = new Set(
    inputs.products.map((product) => normalizedFulfillmentVendorSlug(product)).filter((slug) => slug.length > 0)
  );
  return {
    mode: target.publish ? "publish" : "dry-run",
    accountId,
    region: target.region,
    environment: target.environment,
    productsTable: target.productsTable,
    configTable: target.configTable,
    country: target.country,
    scannedProducts: inputs.scannedProducts,
    eligibleProducts: inputs.products.length,
    vendorsConsidered: vendors.size,
    candidateCombosByVendor: Object.fromEntries([...byVendor.entries()].sort(([left], [right]) => left.localeCompare(right))),
    candidates,
    exclusions: inputs.exclusions,
    skips: [...skips],
    skipped: skips.length,
    expectedWrites,
  };
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
