/**
 * Deployment-target checks shared by GitHub Actions and local tests.
 * Prints parameter overrides to stdout. Errors go to stderr.
 * Does not call AWS and does not read product data.
 */
import { spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

export const PROD_STACK = "blossompot-prod";
export const DEV_STACK = "blossompot-dev";
export const PROD_PRODUCTS_TABLE = "blossompot-products-prod";
export const DEV_PRODUCTS_TABLE = "blossompot-products-dev";
export const PROD_API_HOST = "6y37e2a4j1.execute-api.us-east-1.amazonaws.com";
export const PROD_CDN_HOST = "d2d01h4hac5hqs.cloudfront.net";
export const BLOSSOMPOT_AMPLIFY_APP_ID = "dsjdlmcsa1pdc";
export const USARAKHI_AMPLIFY_APP_ID = "d1vlvm5li37k6g";
export const BLOSSOMPOT_REPOSITORY = "https://github.com/sachinkapoor2025/blossompot.com";
export const DEV_AMPLIFY_BRANCH = "dev";

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

const SAFE_ENV_VALUE = /^[A-Za-z0-9_.:/@-]+$/;

export function resolveBlossomPotAmplifyAppId(configured: string | undefined): string {
  const value = configured?.trim() ?? "";
  if (!value) {
    throw new Error("Amplify app id is missing. Refusing to fall back to another app.");
  }
  if (value === USARAKHI_AMPLIFY_APP_ID) {
    throw new Error("Refusing Amplify app d1vlvm5li37k6g. That app is not BlossomPot.");
  }
  if (value !== BLOSSOMPOT_AMPLIFY_APP_ID) {
    throw new Error(
      `Refusing Amplify app ${value}. This repository only deploys ${BLOSSOMPOT_AMPLIFY_APP_ID}.`
    );
  }
  return value;
}

/** GitHub secret AMPLIFY_APP_ID must be the BlossomPot app. An empty value is not a fallback. */
export function resolveDevAmplifyAppId(secretValue: string | undefined): string {
  return resolveBlossomPotAmplifyAppId(secretValue);
}

export function assertBlossomPotAmplifyApp(app: { appId?: string; repository?: string }): void {
  const appId = resolveBlossomPotAmplifyAppId(app.appId);
  const repository = (app.repository ?? "").trim().replace(/\.git$/, "").replace(/\/$/, "");
  const accepted = new Set([
    BLOSSOMPOT_REPOSITORY,
    "git@github.com:sachinkapoor2025/blossompot.com",
  ]);
  if (!accepted.has(repository)) {
    throw new Error(
      `Amplify app ${appId} is not connected to ${BLOSSOMPOT_REPOSITORY}. Refusing to update it.`
    );
  }
}

export function assertDevAmplifyBranch(branchName: string | undefined): void {
  if (branchName !== DEV_AMPLIFY_BRANCH) {
    throw new Error(
      `Dev deployment only updates the Amplify dev branch. Refusing branch "${branchName ?? ""}".`
    );
  }
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
  const appId = resolveBlossomPotAmplifyAppId(input.appId);
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
    next.NEXT_PUBLIC_SITE_URL = `https://dev.${appId}.amplifyapp.com`;
  }
  return next;
}

export function devFrontendBuildEnv(
  env: Record<string, string | undefined>,
  amplifyAppId: string | undefined
): Record<string, string> {
  const appId = amplifyAppId?.trim() || BLOSSOMPOT_AMPLIFY_APP_ID;
  resolveBlossomPotAmplifyAppId(appId);
  const apiUrl = (env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
  if (!apiUrl) {
    throw new Error(
      "Dev build is missing NEXT_PUBLIC_API_URL. GitHub Actions must publish the blossompot-dev API URL before this build. Refusing to use the production API."
    );
  }
  assertApiUrl("dev", apiUrl);
  const pool = (env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "").trim();
  const client = (env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "").trim();
  if (!pool || pool === "None" || !client || client === "None") {
    throw new Error("Dev build is missing Cognito environment variables. Refusing to use production Cognito.");
  }
  const region = (env.NEXT_PUBLIC_COGNITO_REGION ?? "").trim();
  if (region !== "us-east-1") {
    throw new Error("Dev build NEXT_PUBLIC_COGNITO_REGION must be us-east-1.");
  }
  const cdn = (env.NEXT_PUBLIC_CDN_URL ?? "").trim().replace(/\/$/, "");
  if (!cdn.startsWith("https://") || cdn.includes(PROD_CDN_HOST)) {
    throw new Error("Dev build NEXT_PUBLIC_CDN_URL is missing or uses the production CloudFront distribution.");
  }
  if ((env.NEXT_PUBLIC_APP_ENV ?? "").trim() !== "dev") {
    throw new Error("Dev build NEXT_PUBLIC_APP_ENV must be dev.");
  }
  const gbo = (env.GBO_STOREFRONT_ENABLED ?? "").trim().toLowerCase();
  if (gbo === "true" || gbo === "1" || gbo === "yes") {
    throw new Error("Dev build refuses GBO_STOREFRONT_ENABLED=true.");
  }
  let site = (env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "");
  if (
    site === "" ||
    site === "https://www.blossompot.com" ||
    site === "https://blossompot.com" ||
    site === "http://blossompot.com" ||
    site === "http://www.blossompot.com"
  ) {
    site = `https://dev.${appId}.amplifyapp.com`;
  }
  const out: Record<string, string> = {
    NEXT_PUBLIC_APP_ENV: "dev",
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: pool,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: client,
    NEXT_PUBLIC_COGNITO_REGION: "us-east-1",
    NEXT_PUBLIC_CDN_URL: cdn,
    NEXT_PUBLIC_SITE_URL: site,
    GBO_STOREFRONT_ENABLED: "false",
  };
  const stripe = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (stripe?.startsWith("pk_test_")) out.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = stripe;
  const razor = (env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? env.RAZOR_KEY_ID)?.trim();
  if (razor?.startsWith("rzp_test_")) out.NEXT_PUBLIC_RAZORPAY_KEY_ID = razor;
  for (const [key, value] of Object.entries(out)) {
    if (!SAFE_ENV_VALUE.test(value)) {
      throw new Error(`${key} contains characters that cannot be written to the build env file.`);
    }
  }
  return out;
}

export function writeDevFrontendEnvFile(
  env: Record<string, string | undefined>,
  amplifyAppId: string | undefined,
  envFile: string
): Record<string, string> {
  const built = devFrontendBuildEnv(env, amplifyAppId);
  writeFileSync(
    envFile,
    Object.entries(built)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")
      .concat("\n"),
    { encoding: "utf8" }
  );
  return built;
}

export type AwsCommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: string;
};

function requireAws(result: AwsCommandResult, operation: string): string {
  if (result.error || result.status !== 0) {
    const detail = [result.error, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`AWS ${operation} failed for the BlossomPot dev Amplify app.\n${detail}`);
  }
  return result.stdout;
}

/**
 * Reads blossompot-dev outputs already exported by GitHub Actions, verifies the
 * Amplify app, replaces only the dev branch environment, and starts one release.
 * update-branch does not start a build, so start-job is required.
 * Auto-build is turned off so the git webhook does not start a second build
 * before these environment variables exist.
 */
export function publishDevAmplifyConfig(
  env: Record<string, string | undefined>,
  run: (args: string[]) => AwsCommandResult
): { jobId: string; environment: Record<string, string> } {
  if (env.GITHUB_REF === "refs/heads/main") {
    throw new Error("Refusing to publish dev Amplify settings from the main branch.");
  }
  if ((env.AWS_REGION ?? "us-east-1").trim() !== "us-east-1") {
    throw new Error("Dev Amplify publish must run in us-east-1.");
  }
  const appId = resolveDevAmplifyAppId(env.AMPLIFY_APP_ID);
  const appStdout = requireAws(
    run(["amplify", "get-app", "--region", "us-east-1", "--app-id", appId, "--output", "json"]),
    "amplify get-app"
  );
  let app: { app?: { appId?: string; repository?: string } };
  try {
    app = JSON.parse(appStdout) as { app?: { appId?: string; repository?: string } };
  } catch {
    throw new Error("Amplify get-app returned unreadable output.");
  }
  if (app.app?.appId && app.app.appId !== appId) {
    throw new Error("Amplify get-app returned a different app id.");
  }
  assertBlossomPotAmplifyApp({ appId, repository: app.app?.repository });

  const branchStdout = requireAws(
    run([
      "amplify",
      "get-branch",
      "--region",
      "us-east-1",
      "--app-id",
      appId,
      "--branch-name",
      DEV_AMPLIFY_BRANCH,
      "--output",
      "json",
    ]),
    "amplify get-branch"
  );
  let branch: { branch?: { branchName?: string; environmentVariables?: Record<string, string> } };
  try {
    branch = JSON.parse(branchStdout) as {
      branch?: { branchName?: string; environmentVariables?: Record<string, string> };
    };
  } catch {
    throw new Error("Amplify get-branch returned unreadable output.");
  }
  assertDevAmplifyBranch(branch.branch?.branchName);
  const merged = devAmplifyEnvironment(branch.branch?.environmentVariables ?? {}, {
    apiUrl: env.NEXT_PUBLIC_API_URL ?? "",
    productsTable: env.DEV_PRODUCTS_TABLE ?? "",
    userPoolId: env.DEV_USER_POOL_ID ?? "",
    userPoolClientId: env.DEV_USER_POOL_CLIENT_ID ?? "",
    cdnDomain: env.DEV_CDN ?? "",
    appId,
    stripePublishableKeyTest: env.STRIPE_PK_TEST,
    razorpayKeyIdTest: env.RAZOR_KEY_ID_TEST,
  });
  requireAws(
    run([
      "amplify",
      "update-branch",
      "--region",
      "us-east-1",
      "--cli-input-json",
      JSON.stringify({
        appId,
        branchName: DEV_AMPLIFY_BRANCH,
        enableAutoBuild: false,
        environmentVariables: merged,
      }),
    ]),
    "amplify update-branch"
  );
  const commitId = env.GITHUB_SHA?.trim() ?? "";
  if (!/^[0-9a-f]{40}$/i.test(commitId)) {
    throw new Error("Refusing to start an Amplify dev build without the GitHub commit SHA.");
  }
  const jobStdout = requireAws(
    run([
      "amplify",
      "start-job",
      "--region",
      "us-east-1",
      "--cli-input-json",
      JSON.stringify({
        appId,
        branchName: DEV_AMPLIFY_BRANCH,
        jobType: "RELEASE",
        commitId,
        jobReason: "GitHub Actions dev deploy",
      }),
    ]),
    "amplify start-job"
  );
  let job: { jobSummary?: { jobId?: string } };
  try {
    job = JSON.parse(jobStdout) as { jobSummary?: { jobId?: string } };
  } catch {
    throw new Error("Amplify start-job returned unreadable output.");
  }
  const jobId = job.jobSummary?.jobId?.trim() ?? "";
  if (!jobId) throw new Error("Amplify start-job did not return a job id.");
  return { jobId, environment: merged };
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
      "--region",
      "us-east-1",
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
  if (!devWeb.includes("publish-dev-amplify")) {
    throw new Error("deploy-web-dev must publish the dev branch through publish-dev-amplify.");
  }
  if (!devWeb.includes(BLOSSOMPOT_AMPLIFY_APP_ID)) {
    throw new Error("deploy-web-dev must name the BlossomPot Amplify app.");
  }
  if (devWeb.includes(USARAKHI_AMPLIFY_APP_ID) || devWeb.includes("AMPLIFY_APP_ID:-")) {
    throw new Error("deploy-web-dev must not fall back to another Amplify app.");
  }
  if (devWeb.includes("--branch-name main") || devWeb.includes("blossompot-prod")) {
    throw new Error("deploy-web-dev must not update the production branch or stack.");
  }
  if (!devWeb.includes("--region us-east-1") || !devWeb.includes("--stack-name blossompot-dev")) {
    throw new Error("deploy-web-dev must read blossompot-dev in us-east-1.");
  }
  if (devWeb.includes("2>/dev/null")) {
    throw new Error("deploy-web-dev must not hide AWS errors.");
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
  const devBranch = amplifyYml.split('if [ "$BRANCH" = "dev" ]')[1]?.split('elif [ "$BRANCH" = "main" ]')[0];
  if (!devBranch) throw new Error("amplify.yml is missing the dev branch build.");
  if (devBranch.includes("describe-stacks") || devBranch.includes("dev-stack-outputs.ts") || devBranch.includes("blossompot-prod")) {
    throw new Error("amplify.yml dev branch must not call CloudFormation or select the production stack.");
  }
  if (!devBranch.includes("write-dev-frontend-env")) {
    throw new Error("amplify.yml dev branch must validate the published dev environment before building.");
  }
  if (devBranch.includes("2>/dev/null")) {
    throw new Error("amplify.yml dev branch must not hide AWS CLI errors.");
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
  if (command === "amplify-app-id") {
    const appId = resolveDevAmplifyAppId(process.env.AMPLIFY_APP_ID);
    process.stdout.write(appId);
    return;
  }
  if (command === "assert-amplify-app") {
    const parsed = JSON.parse(process.env.APP_JSON || "{}") as {
      app?: { appId?: string; repository?: string };
    };
    assertBlossomPotAmplifyApp({
      appId: parsed.app?.appId,
      repository: parsed.app?.repository,
    });
    console.error(`Confirmed Amplify app ${BLOSSOMPOT_AMPLIFY_APP_ID} is connected to ${BLOSSOMPOT_REPOSITORY}.`);
    return;
  }
  if (command === "write-dev-frontend-env") {
    const envFile = readFlag("--out");
    if (!envFile) throw new Error("Usage: deploy-target.ts write-dev-frontend-env --out <path>");
    writeDevFrontendEnvFile(process.env, process.env.AWS_APP_ID, envFile);
    console.error("Validated the dev frontend environment. Values were not logged.");
    return;
  }
  if (command === "publish-dev-amplify") {
    const { jobId } = publishDevAmplifyConfig(process.env, (args) => {
      const result = spawnSync("aws", args, { encoding: "utf8" });
      return {
        status: result.status,
        stdout: result.stdout ?? "",
        stderr: result.stderr ?? "",
        error: result.error?.message,
      };
    });
    console.error(`Started Amplify dev release ${jobId} on ${BLOSSOMPOT_AMPLIFY_APP_ID} branch dev.`);
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
    "Usage: deploy-target.ts <assert|assert-url|assert-stack|dev-overrides|dev-amplify-env|amplify-app-id|assert-amplify-app|write-dev-frontend-env|publish-dev-amplify>"
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
