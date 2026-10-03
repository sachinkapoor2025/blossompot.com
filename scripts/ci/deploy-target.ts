/**
 * Deployment-target checks shared by GitHub Actions and local tests.
 * Prints parameter overrides to stdout. Errors go to stderr.
 * Does not call AWS and does not read product data.
 */
import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

export const PROD_STACK = "blossompot-prod";
export const DEV_STACK = "blossompot-dev";
export const PROD_PRODUCTS_TABLE = "blossompot-products-prod";
export const DEV_PRODUCTS_TABLE = "blossompot-products-dev";
export const PROD_API_HOST = "6y37e2a4j1.execute-api.us-east-1.amazonaws.com";
export const PROD_CDN_HOST = "d2d01h4hac5hqs.cloudfront.net";

const DEV_API_URL =
  /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9.-]+\.amazonaws\.com\/dev$/;
const PROD_API_URL =
  /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9.-]+\.amazonaws\.com\/prod$/;

/** Parameters forced empty on dev so a previous stack value cannot keep live credentials. */
export const DEV_CLEARED_PARAMETERS = [
  "StripeSecretKey",
  "StripeWebhookSecret",
  "RazorpayKeyId",
  "RazorpayKeySecret",
  "RazorpayWebhookSecret",
  "SmtpPassword",
  "MarketingSmtpPassword",
  "WhatsAppToken",
  "WhatsAppPhoneNumberId",
  "WhatsAppTemplateName",
  "TwilioAccountSid",
  "TwilioAuthToken",
  "TwilioWhatsAppFrom",
  "OrangeCountyVendorApiKey",
  "GboApiToken",
  "GboInternalApiKey",
  "UspsClientId",
  "UspsClientSecret",
  "UspsSecretArn",
  "UspsPaymentAuthorizationToken",
  "UspsEpsAccountNumber",
  "UspsCrid",
  "UspsMid",
] as const;

export type SamSection = {
  stackName: string;
  parameterOverrides: string;
};

export function parseSamconfig(text: string): Record<string, SamSection> {
  const sections: Record<string, SamSection> = {};
  let current: string | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const header = line.match(/^\[([^\]]+)\]$/);
    if (header) {
      const name = header[1];
      if (name.endsWith(".deploy.parameters")) {
        current = name.split(".")[0] ?? null;
        if (current && !sections[current]) {
          sections[current] = { stackName: "", parameterOverrides: "" };
        }
      } else {
        current = null;
      }
      continue;
    }
    if (!current || !line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    const section = sections[current];
    if (!section) continue;
    if (key === "stack_name") section.stackName = value;
    if (key === "parameter_overrides") section.parameterOverrides = value;
  }
  return sections;
}

export function assertSamTarget(
  text: string,
  configEnv: string,
  stack: string,
  environment: "dev" | "prod"
): void {
  const sections = parseSamconfig(text);
  const section = sections[configEnv];
  if (!section) {
    throw new Error(`samconfig has no [${configEnv}.deploy.parameters] section.`);
  }
  if (section.stackName !== stack) {
    throw new Error(
      `samconfig [${configEnv}] stack_name is "${section.stackName}", expected "${stack}".`
    );
  }
  const tokens = section.parameterOverrides.split(/\s+/).filter(Boolean);
  if (!tokens.includes(`Environment=${environment}`)) {
    throw new Error(
      `samconfig [${configEnv}] parameter_overrides must include Environment=${environment}.`
    );
  }
  const other = environment === "prod" ? "dev" : "prod";
  if (tokens.includes(`Environment=${other}`)) {
    throw new Error(`samconfig [${configEnv}] must not set Environment=${other}.`);
  }
}

export function assertApiUrl(environment: "dev" | "prod", url: string): void {
  const trimmed = url.trim().replace(/\/$/, "");
  if (environment === "dev") {
    if (trimmed.includes(PROD_API_HOST) || !DEV_API_URL.test(trimmed)) {
      throw new Error(
        "Dev ApiUrl must be an execute-api URL ending in /dev and must not use the production API host."
      );
    }
    return;
  }
  if (!PROD_API_URL.test(trimmed)) {
    throw new Error("Production ApiUrl must be an execute-api URL ending in /prod.");
  }
}

export function assertProductsTable(environment: "dev" | "prod", tableName: string): void {
  const expected = environment === "dev" ? DEV_PRODUCTS_TABLE : PROD_PRODUCTS_TABLE;
  if (tableName.trim() !== expected) {
    throw new Error(`Products table is "${tableName.trim()}", expected "${expected}".`);
  }
}

function assignment(key: string, value: string): string {
  if (value === "") return `${key}=`;
  if (!/^[A-Za-z0-9_.:/+@=-]+$/.test(value)) {
    throw new Error(`${key} contains characters that cannot be passed safely to sam deploy.`);
  }
  return `${key}=${value}`;
}

function optionalTestValue(
  env: Record<string, string | undefined>,
  name: string,
  prefix: string
): string | undefined {
  const value = env[name]?.trim();
  if (!value) return undefined;
  if (!value.startsWith(prefix)) {
    throw new Error(`${name} must start with ${prefix}. Refusing to deploy it to the dev stack.`);
  }
  return value;
}

/**
 * Dev overrides never read production secret names (STRIPE_SECRET_KEY, SMTP_PASSWORD, …).
 * Empty values are explicit so CloudFormation does not keep a previous live value.
 */
export function devParameterOverrides(env: Record<string, string | undefined>): string {
  const stripeKey = optionalTestValue(env, "STRIPE_SECRET_KEY_TEST", "sk_test_");
  const stripeWebhook = env.STRIPE_WEBHOOK_SECRET_TEST?.trim();
  if (stripeWebhook && !stripeKey) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET_TEST is set without STRIPE_SECRET_KEY_TEST. Refusing to attach it to dev."
    );
  }
  if (stripeWebhook && !stripeWebhook.startsWith("whsec_")) {
    throw new Error("STRIPE_WEBHOOK_SECRET_TEST must start with whsec_.");
  }
  const razorpayKey = optionalTestValue(env, "RAZORPAY_KEY_ID_TEST", "rzp_test_");
  const razorpaySecret = env.RAZORPAY_KEY_SECRET_TEST?.trim();
  const razorpayWebhook = env.RAZORPAY_WEBHOOK_SECRET_TEST?.trim();
  if ((razorpaySecret || razorpayWebhook) && !razorpayKey) {
    throw new Error(
      "Razorpay test secrets are set without RAZORPAY_KEY_ID_TEST starting with rzp_test_."
    );
  }

  const values = new Map<string, string>();
  for (const key of DEV_CLEARED_PARAMETERS) values.set(key, "");
  if (stripeKey) values.set("StripeSecretKey", stripeKey);
  if (stripeWebhook) values.set("StripeWebhookSecret", stripeWebhook);
  if (razorpayKey) values.set("RazorpayKeyId", razorpayKey);
  if (razorpaySecret) values.set("RazorpayKeySecret", razorpaySecret);
  if (razorpayWebhook) values.set("RazorpayWebhookSecret", razorpayWebhook);

  const parts = [
    assignment("Environment", "dev"),
    assignment("GboStorefrontEnabled", "false"),
    assignment("GboSandbox", "true"),
    ...DEV_CLEARED_PARAMETERS.map((key) => assignment(key, values.get(key) ?? "")),
  ];
  const joined = parts.join(" ");
  if (joined.includes("Environment=prod") || /sk_live_|rk_live_|pk_live_/.test(joined)) {
    throw new Error("Dev parameter overrides include a production target or live payment key.");
  }
  return joined;
}

export function devAmplifyEnvironment(
  existing: Record<string, string>,
  input: {
    apiUrl: string;
    productsTable: string;
    userPoolId: string;
    userPoolClientId: string;
    cdnDomain: string;
    appId: string;
    stripePublishableKeyTest?: string;
    razorpayKeyIdTest?: string;
  }
): Record<string, string> {
  assertApiUrl("dev", input.apiUrl);
  assertProductsTable("dev", input.productsTable);
  const userPoolId = input.userPoolId.trim();
  const userPoolClientId = input.userPoolClientId.trim();
  const cdnDomain = input.cdnDomain.trim();
  if (!userPoolId || userPoolId === "None" || !userPoolClientId || userPoolClientId === "None") {
    throw new Error("Dev stack is missing Cognito outputs.");
  }
  if (!cdnDomain || cdnDomain === "None" || cdnDomain === PROD_CDN_HOST) {
    throw new Error("Dev stack CloudFront domain must not be empty or the production distribution.");
  }
  const stripeKey = input.stripePublishableKeyTest?.trim();
  if (stripeKey && !stripeKey.startsWith("pk_test_")) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST must start with pk_test_.");
  }
  const razorpayKey = input.razorpayKeyIdTest?.trim();
  if (razorpayKey && !razorpayKey.startsWith("rzp_test_")) {
    throw new Error("RAZORPAY_KEY_ID_TEST must start with rzp_test_.");
  }

  const next: Record<string, string> = { ...existing };
  delete next.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  delete next.RAZOR_KEY_ID;
  delete next.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (stripeKey) next.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = stripeKey;
  if (razorpayKey) {
    next.RAZOR_KEY_ID = razorpayKey;
    next.NEXT_PUBLIC_RAZORPAY_KEY_ID = razorpayKey;
  }
  next.NEXT_PUBLIC_API_URL = input.apiUrl.trim().replace(/\/$/, "");
  next.NEXT_PUBLIC_APP_ENV = "dev";
  next.NEXT_PUBLIC_COGNITO_USER_POOL_ID = userPoolId;
  next.NEXT_PUBLIC_COGNITO_CLIENT_ID = userPoolClientId;
  next.NEXT_PUBLIC_COGNITO_REGION = "us-east-1";
  next.NEXT_PUBLIC_CDN_URL = `https://${cdnDomain}`;
  next.GBO_STOREFRONT_ENABLED = "false";
  const site = (next.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "");
  if (
    site === "" ||
    site === "https://www.blossompot.com" ||
    site === "https://blossompot.com" ||
    site === "http://blossompot.com" ||
    site === "http://www.blossompot.com"
  ) {
    if (!input.appId.trim()) throw new Error("Amplify app id is required to set the dev site URL.");
    next.NEXT_PUBLIC_SITE_URL = `https://dev.${input.appId.trim()}.amplifyapp.com`;
  }
  return next;
}

function stackOutput(stack: string, key: string): string {
  if (stack !== DEV_STACK && stack !== PROD_STACK) {
    throw new Error(`Refusing to describe unexpected stack "${stack}".`);
  }
  if (!/^[A-Za-z0-9]+$/.test(key)) throw new Error(`Unexpected output key "${key}".`);
  const result = spawnSync(
    "aws",
    [
      "cloudformation",
      "describe-stacks",
      "--stack-name",
      stack,
      "--query",
      `Stacks[0].Outputs[?OutputKey=='${key}'].OutputValue | [0]`,
      "--output",
      "text",
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    if (result.stderr) console.error(result.stderr.trim());
    throw new Error(`Unable to read ${key} from ${stack}.`);
  }
  return (result.stdout ?? "").trim();
}

export function assertWorkflowIsolation(workflow: string): void {
  const prodApi = jobBlock(workflow, "deploy-api-prod");
  const devApi = jobBlock(workflow, "deploy-api-dev");
  const prodWeb = jobBlock(workflow, "deploy-web-prod");
  const devWeb = jobBlock(workflow, "deploy-web-dev");
  const build = jobBlock(workflow, "build");

  for (const [name, block] of [
    ["deploy-api-prod", prodApi],
    ["deploy-api-dev", devApi],
    ["deploy-web-prod", prodWeb],
    ["deploy-web-dev", devWeb],
  ] as const) {
    if (!block.includes("needs:") || !block.includes("build")) {
      throw new Error(`${name} must depend on the build job.`);
    }
    if (!block.includes("success()")) {
      throw new Error(`${name} must require success() so a failed build cannot deploy.`);
    }
    if (block.includes("feature/")) {
      throw new Error(`${name} must not deploy feature branches.`);
    }
  }

  if (!prodApi.includes("refs/heads/main") || !prodApi.includes("inputs.environment == 'prod'")) {
    throw new Error("deploy-api-prod must run only for main or a manual prod selection on main.");
  }
  if (!devApi.includes("refs/heads/dev") || !devApi.includes("inputs.environment == 'dev'")) {
    throw new Error("deploy-api-dev must run only for dev or a manual dev selection on dev.");
  }
  if (!prodApi.includes("--config-env prod") || !prodApi.includes("--stack-name blossompot-prod")) {
    throw new Error("deploy-api-prod must target blossompot-prod.");
  }
  if (!prodApi.includes("Environment=prod")) {
    throw new Error("deploy-api-prod must pass Environment=prod.");
  }
  if (prodApi.includes("--config-env default") || prodApi.includes("blossompot-dev")) {
    throw new Error("deploy-api-prod must not reference the dev stack.");
  }
  if (!devApi.includes("--config-env default") || !devApi.includes("--stack-name blossompot-dev")) {
    throw new Error("deploy-api-dev must target the default samconfig stack blossompot-dev.");
  }
  if (devApi.includes("--config-env prod") || devApi.includes("Environment=prod")) {
    throw new Error("deploy-api-dev must not deploy the production configuration.");
  }
  for (const secret of [
    "secrets.STRIPE_SECRET_KEY",
    "secrets.STRIPE_WEBHOOK_SECRET",
    "secrets.SMTP_PASSWORD",
    "secrets.MARKETING_SMTP_PASS",
    "secrets.RAZOR_KEY_ID",
    "secrets.RAZOR_KEY_SECRET",
    "secrets.RAZORPAY_WEBHOOK_SECRET",
    "secrets.GBO_API_TOKEN",
    "secrets.WHATSAPP_TOKEN",
    "secrets.TWILIO_AUTH_TOKEN",
    "secrets.USPS_CLIENT_SECRET",
    "secrets.ORANGE_COUNTY_VENDOR_API_KEY",
  ]) {
    const pattern = new RegExp(`${secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!_TEST)`);
    if (pattern.test(devApi) || pattern.test(devWeb)) {
      throw new Error(`Dev jobs must not reference production secret ${secret}.`);
    }
  }
  if (!prodApi.includes("secrets.STRIPE_SECRET_KEY") || !prodApi.includes("secrets.SMTP_PASSWORD")) {
    throw new Error("Production API deploy must keep its existing payment and email secrets.");
  }
  if (!prodWeb.includes('--branch-name main') && !prodWeb.includes("--branch-name main")) {
    throw new Error("deploy-web-prod must update only the main Amplify branch.");
  }
  if (!devWeb.includes("--branch-name dev")) {
    throw new Error("deploy-web-dev must update only the dev Amplify branch.");
  }
  if (prodWeb.includes("GITHUB_REF_NAME") || devWeb.includes("GITHUB_REF_NAME")) {
    throw new Error("Amplify branch updates must use the selected environment, not the git ref name.");
  }
  if (!build.includes("npm test") || !build.includes("npm run build")) {
    throw new Error("The build job must run tests and the application build.");
  }
  if (build.includes("sam deploy")) {
    throw new Error("The build job must not deploy.");
  }
  if (!workflow.includes("required: true") || !workflow.includes("default: dev")) {
    throw new Error("Manual dispatch must require an environment and must not default to prod.");
  }
}

export function assertAmplifyIsolation(amplifyYml: string): void {
  if (amplifyYml.includes("STACK_NAME=${STACK_NAME:-blossompot-prod}")) {
    throw new Error("amplify.yml must not default an unknown branch to blossompot-prod.");
  }
  if (!amplifyYml.includes('STACK_NAME="blossompot-dev"')) {
    throw new Error("amplify.yml must select blossompot-dev for the dev branch.");
  }
  if (!amplifyYml.includes("blossompot-prod")) {
    throw new Error("amplify.yml must still build main from blossompot-prod.");
  }
  if (!amplifyYml.includes("Refusing to build")) {
    throw new Error("amplify.yml must fail unknown branches.");
  }
  if (!amplifyYml.includes(PROD_API_HOST)) {
    throw new Error("amplify.yml must reject the production API host on dev builds.");
  }
}

function jobBlock(workflow: string, name: string): string {
  const match = workflow.match(
    new RegExp(`(?:\\r?\\n)  ${name}:(?:\\r?\\n)([\\s\\S]*?)(?=(?:\\r?\\n)  [a-z0-9-]+:(?:\\r?\\n)|$)`)
  );
  if (!match?.[1]) throw new Error(`Workflow is missing job ${name}.`);
  return match[1];
}

function repoRoot(): string {
  return resolve(import.meta.dirname, "../..");
}

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function main(): void {
  const command = process.argv[2];
  const samconfigPath = readFlag("--samconfig") ?? resolve(repoRoot(), "infrastructure/samconfig.toml");
  if (command === "assert") {
    const configEnv = readFlag("--config-env");
    const stack = readFlag("--stack");
    const environment = readFlag("--environment");
    if (!configEnv || !stack || (environment !== "dev" && environment !== "prod")) {
      throw new Error(
        "Usage: deploy-target.ts assert --config-env <env> --stack <stack> --environment <dev|prod>"
      );
    }
    assertSamTarget(readFileSync(samconfigPath, "utf8"), configEnv, stack, environment);
    console.error(`Confirmed samconfig [${configEnv}] → ${stack} Environment=${environment}`);
    return;
  }
  if (command === "dev-overrides") {
    process.stdout.write(devParameterOverrides(process.env));
    return;
  }
  if (command === "assert-url") {
    const environment = readFlag("--environment");
    const url = readFlag("--url");
    const table = readFlag("--table");
    if ((environment !== "dev" && environment !== "prod") || !url || !table) {
      throw new Error("Usage: deploy-target.ts assert-url --environment <dev|prod> --url <url> --table <table>");
    }
    assertApiUrl(environment, url);
    assertProductsTable(environment, table);
    console.error(`Confirmed ${environment} API stage and products table.`);
    return;
  }
  if (command === "assert-stack") {
    const environment = readFlag("--environment");
    const stack = readFlag("--stack");
    if (environment !== "dev" && environment !== "prod") {
      throw new Error("Usage: deploy-target.ts assert-stack --environment <dev|prod> --stack <stack>");
    }
    const expectedStack = environment === "dev" ? DEV_STACK : PROD_STACK;
    if (stack !== expectedStack) {
      throw new Error(`Refusing to verify stack "${stack ?? ""}" for ${environment}.`);
    }
    assertApiUrl(environment, stackOutput(stack, "ApiUrl"));
    assertProductsTable(environment, stackOutput(stack, "ProductsTableName"));
    if (environment === "dev" && stackOutput(stack, "CloudFrontDomain") === PROD_CDN_HOST) {
      throw new Error("Dev stack is using the production CloudFront distribution.");
    }
    console.error(`Confirmed deployed stack ${stack}.`);
    return;
  }
  if (command === "dev-amplify-env") {
    const existing = JSON.parse(process.env.EXISTING || "{}") as Record<string, string>;
    const next = devAmplifyEnvironment(existing, {
      apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
      productsTable: process.env.DEV_PRODUCTS_TABLE ?? "",
      userPoolId: process.env.DEV_USER_POOL_ID ?? "",
      userPoolClientId: process.env.DEV_USER_POOL_CLIENT_ID ?? "",
      cdnDomain: process.env.DEV_CDN ?? "",
      appId: process.env.APP_ID ?? "",
      stripePublishableKeyTest: process.env.STRIPE_PK_TEST,
      razorpayKeyIdTest: process.env.RAZOR_KEY_ID_TEST,
    });
    process.stdout.write(JSON.stringify(next));
    return;
  }
  throw new Error(
    "Usage: deploy-target.ts <assert|assert-url|assert-stack|dev-overrides|dev-amplify-env>"
  );
}

const invoked = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/ci/deploy-target.ts");
if (invoked) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
