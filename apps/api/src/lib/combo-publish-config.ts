export class ComboPublishConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComboPublishConfigError";
  }
}

export type ComboPublishTarget = {
  productsTable: string;
  configTable: string;
  memory: boolean;
  region: string | null;
  endpoint: string | null;
};

/**
 * Resolve the database for an explicit combo publish.
 * Table names and region come only from the supplied environment.
 * A missing confirmation, table, or region stops before any database call.
 */
export function resolveComboPublishConfig(
  env: NodeJS.ProcessEnv,
  argv: readonly string[]
): ComboPublishTarget {
  if (!argv.includes("--publish")) {
    throw new ComboPublishConfigError(
      "Refusing to publish combos without --publish. Ordinary builds, tests, and API startup do not pass this flag."
    );
  }

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
  if (!memory && !region) {
    throw new ComboPublishConfigError(
      "Set AWS_REGION before publishing combos to a configured database. The publisher does not assume a region."
    );
  }

  return { productsTable, configTable, memory, region, endpoint };
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
