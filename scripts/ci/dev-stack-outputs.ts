/**
 * Optional local reader for blossompot-dev outputs.
 * The Amplify dev build does not call this. GitHub Actions publishes those
 * outputs onto the dev branch, and the build only validates that environment.
 * Describes only blossompot-dev, only in us-east-1. Does not print output values.
 */
import { spawnSync } from "child_process";
import { writeFileSync } from "fs";
import { DEV_PRODUCTS_TABLE, DEV_STACK, PROD_API_HOST, PROD_CDN_HOST } from "./deploy-target.ts";

export const DEV_STACK_REGION = "us-east-1";

export const DEV_STACK_OUTPUT_KEYS = [
  "UserPoolId",
  "UserPoolClientId",
  "ApiUrl",
  "CloudFrontDomain",
  "ProductsTableName",
] as const;

const DEV_API_URL = /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9.-]+\.amazonaws\.com\/dev$/;
const SAFE_ENV_VALUE = /^[A-Za-z0-9_.:/@-]+$/;

export type CloudFormationOutput = { OutputKey?: string; OutputValue?: string };

export function assertDevReadTarget(stack: string, region: string): void {
  if (stack !== DEV_STACK) {
    throw new Error(`Refusing to read stack "${stack}". Dev builds only read ${DEV_STACK}.`);
  }
  if (region !== DEV_STACK_REGION) {
    throw new Error(`Refusing to read ${DEV_STACK} outside ${DEV_STACK_REGION}.`);
  }
}

export function devStackDescribeArgs(): string[] {
  return [
    "cloudformation",
    "describe-stacks",
    "--region",
    DEV_STACK_REGION,
    "--stack-name",
    DEV_STACK,
    "--output",
    "json",
  ];
}

export function mapStackOutputs(outputs: CloudFormationOutput[] | undefined): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const output of outputs ?? []) {
    const key = output.OutputKey?.trim();
    const value = output.OutputValue?.trim();
    if (!key || !value || value === "None") continue;
    mapped[key] = value;
  }
  return mapped;
}

export function devBuildEnvFromOutputs(outputs: CloudFormationOutput[] | undefined): Record<string, string> {
  const mapped = mapStackOutputs(outputs);
  const missing = DEV_STACK_OUTPUT_KEYS.filter((key) => !mapped[key]);
  if (missing.length > 0) {
    const present = Object.keys(mapped).sort().join(", ") || "(none)";
    throw new Error(
      `Dev stack ${DEV_STACK} in ${DEV_STACK_REGION} is missing output key(s): ${missing.join(", ")}. Present keys: ${present}.`
    );
  }

  const apiUrl = mapped.ApiUrl.replace(/\/$/, "");
  if (!DEV_API_URL.test(apiUrl) || apiUrl.includes(PROD_API_HOST)) {
    throw new Error(
      "Dev stack ApiUrl must be an execute-api URL ending in /dev and must not use the production API host."
    );
  }
  if (mapped.ProductsTableName !== DEV_PRODUCTS_TABLE) {
    throw new Error(
      `Dev stack products table is "${mapped.ProductsTableName}", expected ${DEV_PRODUCTS_TABLE}.`
    );
  }
  if (mapped.CloudFrontDomain === PROD_CDN_HOST) {
    throw new Error("Refusing to build the dev site with the production CloudFront distribution.");
  }

  const env = {
    NEXT_PUBLIC_APP_ENV: "dev",
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: mapped.UserPoolId,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: mapped.UserPoolClientId,
    NEXT_PUBLIC_COGNITO_REGION: DEV_STACK_REGION,
    NEXT_PUBLIC_CDN_URL: `https://${mapped.CloudFrontDomain}`,
  };
  for (const [key, value] of Object.entries(env)) {
    if (!SAFE_ENV_VALUE.test(value)) {
      throw new Error(`${key} from ${DEV_STACK} contains characters that cannot be written to the build env file.`);
    }
  }
  return env;
}

export function renderEnvAssignments(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
    .concat("\n");
}

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

export function devStackReadError(stderr: string, spawnError?: string): string {
  const detail = [spawnError, stderr].filter(Boolean).join("\n").trim();
  if (/Unable to locate credentials|Could not load credentials|ExpiredToken|InvalidClientTokenId/i.test(detail)) {
    return [
      `The Amplify build has no usable AWS credentials, so it cannot read stack ${DEV_STACK} in ${DEV_STACK_REGION}.`,
      "This is not a missing stack output. The BlossomPot Amplify app needs a service role that can call cloudformation:DescribeStacks on that stack.",
      "A compute role does not provide credentials to this build step.",
      "This build will not use the production API.",
      detail,
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (/AccessDenied/i.test(detail)) {
    return [
      `The Amplify build identity is not allowed to describe stack ${DEV_STACK} in ${DEV_STACK_REGION}.`,
      "This is not a missing stack output. Grant only cloudformation:DescribeStacks on that stack.",
      "This build will not use the production API.",
      detail,
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (/does not exist|Stack with id/i.test(detail)) {
    return [
      `Stack ${DEV_STACK} was not found in ${DEV_STACK_REGION}.`,
      "This build will not use the production API.",
      detail,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `Could not describe stack ${DEV_STACK} in ${DEV_STACK_REGION}.`,
    "This build will not use the production API.",
    detail,
  ]
    .filter(Boolean)
    .join("\n");
}

export type AwsCliResult = {
  status: number | null;
  stdout?: string;
  stderr?: string;
  error?: string;
};

export function outputsFromCliResult(result: AwsCliResult): CloudFormationOutput[] {
  if (result.error || result.status !== 0) {
    throw new Error(devStackReadError((result.stderr ?? "").trim(), result.error));
  }
  let parsed: { Stacks?: { Outputs?: CloudFormationOutput[] }[] };
  try {
    parsed = JSON.parse(result.stdout ?? "") as { Stacks?: { Outputs?: CloudFormationOutput[] }[] };
  } catch {
    throw new Error(`CloudFormation returned unreadable output for ${DEV_STACK} in ${DEV_STACK_REGION}.`);
  }
  return parsed.Stacks?.[0]?.Outputs ?? [];
}

/**
 * Writes the dev env file only after the stack read and output checks succeed.
 * A thrown lookup leaves any existing file untouched.
 */
export function materializeDevBuildEnv(input: {
  stack: string;
  region: string;
  envFile: string;
  run: () => AwsCliResult;
}): Record<string, string> {
  assertDevReadTarget(input.stack, input.region);
  const env = devBuildEnvFromOutputs(outputsFromCliResult(input.run()));
  writeFileSync(input.envFile, renderEnvAssignments(env), { encoding: "utf8" });
  return env;
}

function describeWithAwsCli(): AwsCliResult {
  const result = spawnSync("aws", devStackDescribeArgs(), { encoding: "utf8" });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error?.message,
  };
}

function main(): void {
  const stack = readFlag("--stack");
  const region = readFlag("--region");
  const envFile = readFlag("--out");
  if (!stack || !region || !envFile) {
    throw new Error(
      "Usage: dev-stack-outputs.ts --stack blossompot-dev --region us-east-1 --out <path>"
    );
  }
  materializeDevBuildEnv({
    stack,
    region,
    envFile,
    run: describeWithAwsCli,
  });
}

const invoked = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/ci/dev-stack-outputs.ts");
if (invoked) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
