import { getDeliveryCountry } from "@blossompot/shared";

export class ComboPublishConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComboPublishConfigError";
  }
}

/** Same AWS account used by the existing dev catalog checks. Dev and prod share it. */
export const COMBO_PUBLISH_ACCOUNT = "796174527529";
export const COMBO_PUBLISH_REGION = "us-east-1";

export const COMBO_PUBLISH_TABLES = {
  dev: {
    products: "blossompot-products-dev",
    config: "blossompot-config-dev",
  },
  prod: {
    products: "blossompot-products-prod",
    config: "blossompot-config-prod",
  },
} as const;

export type ComboPublishEnvironment = "local" | "dev" | "prod";

export type ComboPublishTarget = {
  productsTable: string;
  configTable: string;
  memory: boolean;
  region: string | null;
  endpoint: string | null;
  /** False is a dry-run. It reports candidates and does not write. */
  publish: boolean;
  country: string;
  environment: ComboPublishEnvironment;
  confirmProduction: boolean;
};

/**
 * Resolve an explicit combo publish or dry-run.
 * Table names come only from the supplied environment.
 * A missing country, table, region, or production confirmation stops before any database call.
 */
export function resolveComboPublishConfig(
  env: NodeJS.ProcessEnv,
  argv: readonly string[]
): ComboPublishTarget {
  const publish = argv.includes("--publish");
  const confirmProduction = argv.includes("--confirm-production");
  const country = requiredCountry(argv);
  const productsTable = requiredTable(env.PRODUCTS_TABLE, "PRODUCTS_TABLE");
  const configTable = requiredTable(env.CONFIG_TABLE, "CONFIG_TABLE");
  const memory = memoryMode(env.USE_MEMORY_DB);
  const endpoint = env.DYNAMODB_ENDPOINT?.trim() || null;
  if (memory && endpoint) {
    throw new ComboPublishConfigError(
      "Refusing to publish combos when USE_MEMORY_DB=true and DYNAMODB_ENDPOINT are both set."
    );
  }

  const region = env.AWS_REGION?.trim() || null;
  const environment = requiredEnvironment(env.ENVIRONMENT);
  assertEnvironmentTables({ environment, productsTable, configTable, memory, region });
  if (publish && environment === "prod" && !confirmProduction) {
    throw new ComboPublishConfigError(
      "Refusing to write production combos without --confirm-production. A dry-run omits --publish."
    );
  }
  if (!memory && !region) {
    throw new ComboPublishConfigError(
      "Set AWS_REGION before publishing combos to a configured database. The publisher does not assume a region."
    );
  }

  return {
    productsTable,
    configTable,
    memory,
    region,
    endpoint,
    publish,
    country,
    environment,
    confirmProduction,
  };
}

/** Remote publishes must observe this account. Memory runs do not call AWS. */
export function assertComboPublishAccount(target: ComboPublishTarget, accountId: string): void {
  if (target.memory) return;
  if (accountId !== COMBO_PUBLISH_ACCOUNT) {
    throw new ComboPublishConfigError(
      `Refusing to publish combos. AWS account ${accountId || "(missing)"} does not match the BlossomPot account.`
    );
  }
}

function requiredCountry(argv: readonly string[]): string {
  const values = countryValues(argv);
  if (values.length === 0) {
    throw new ComboPublishConfigError(
      "Set --country to the delivery country for this run. The publisher does not choose a country."
    );
  }
  const unique = [...new Set(values)];
  if (unique.length !== 1) {
    throw new ComboPublishConfigError("Refusing to publish combos when --country is set more than once.");
  }
  const country = unique[0] ?? "";
  if (!/^[A-Z]{2}$/.test(country) || !getDeliveryCountry(country)) {
    throw new ComboPublishConfigError(
      `Refusing to publish combos. "${country || "(missing)"}" is not a known delivery country.`
    );
  }
  return country;
}

function countryValues(argv: readonly string[]): string[] {
  const values: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? "";
    if (arg === "--country") {
      const value = argv[index + 1] ?? "";
      if (!value || value.startsWith("--")) {
        throw new ComboPublishConfigError(
          "Set --country to the delivery country for this run. The publisher does not choose a country."
        );
      }
      values.push(value.trim().toUpperCase());
      index += 1;
      continue;
    }
    if (arg.startsWith("--country=")) {
      values.push(arg.slice("--country=".length).trim().toUpperCase());
    }
  }
  return values;
}

function requiredEnvironment(value: string | undefined): ComboPublishEnvironment {
  const environment = value?.trim().toLowerCase() ?? "";
  if (environment === "local" || environment === "dev" || environment === "prod") return environment;
  throw new ComboPublishConfigError(
    "Set ENVIRONMENT to local, dev, or prod. The publisher does not infer the environment from a table name."
  );
}

function assertEnvironmentTables(input: {
  environment: ComboPublishEnvironment;
  productsTable: string;
  configTable: string;
  memory: boolean;
  region: string | null;
}): void {
  if (input.environment === "local") {
    if (!input.memory) {
      throw new ComboPublishConfigError(
        "Refusing to publish combos. ENVIRONMENT=local requires USE_MEMORY_DB=true."
      );
    }
    if (isDeployedTable(input.productsTable) || isDeployedTable(input.configTable)) {
      throw new ComboPublishConfigError(
        "Refusing to publish combos. A local memory run cannot use the dev or production tables."
      );
    }
    return;
  }

  if (input.memory) {
    throw new ComboPublishConfigError(
      `Refusing to publish combos. ENVIRONMENT=${input.environment} cannot use USE_MEMORY_DB=true.`
    );
  }
  const expected = COMBO_PUBLISH_TABLES[input.environment];
  if (input.productsTable !== expected.products || input.configTable !== expected.config) {
    throw new ComboPublishConfigError(
      `Refusing to publish combos. ENVIRONMENT=${input.environment} does not match the products and config tables.`
    );
  }
  if (input.region !== COMBO_PUBLISH_REGION) {
    throw new ComboPublishConfigError(
      `Refusing to publish combos. ENVIRONMENT=${input.environment} requires AWS_REGION=${COMBO_PUBLISH_REGION}.`
    );
  }
}

function isDeployedTable(table: string): boolean {
  return (
    table === COMBO_PUBLISH_TABLES.dev.products ||
    table === COMBO_PUBLISH_TABLES.dev.config ||
    table === COMBO_PUBLISH_TABLES.prod.products ||
    table === COMBO_PUBLISH_TABLES.prod.config
  );
}

function requiredTable(value: string | undefined, name: string): string {
  const table = value?.trim() ?? "";
  if (!table || table !== value) {
    throw new ComboPublishConfigError(
      `Set ${name} to the database table for this run. The publisher does not choose a table from ENVIRONMENT.`
    );
  }
  return table;
}

function memoryMode(value: string | undefined): boolean {
  if (value == null || value === "" || value === "false") return false;
  if (value === "true") return true;
  throw new ComboPublishConfigError(
    "USE_MEMORY_DB must be true, false, or unset. Any other value leaves the database target ambiguous."
  );
}
