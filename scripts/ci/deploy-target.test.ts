import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { test } from "node:test";
import {
  DEV_CLEARED_PARAMETERS,
  DEV_PRODUCTS_TABLE,
  DEV_STACK,
  PROD_API_HOST,
  PROD_CDN_HOST,
  PROD_PRODUCTS_TABLE,
  PROD_STACK,
  BLOSSOMPOT_AMPLIFY_APP_ID,
  BLOSSOMPOT_REPOSITORY,
  USARAKHI_AMPLIFY_APP_ID,
  assertAmplifyIsolation,
  assertApiUrl,
  assertBlossomPotAmplifyApp,
  assertDevAmplifyBranch,
  assertProductsTable,
  assertSamTarget,
  assertCatalogVerificationIsReadOnly,
  assertReadOnlyDevCatalogWorkflow,
  assertWorkflowIsolation,
  devAmplifyEnvironment,
  devFrontendBuildEnv,
  devParameterOverrides,
  publishDevAmplifyConfig,
  resolveBlossomPotAmplifyAppId,
  resolveDevAmplifyAppId,
  writeDevFrontendEnvFile,
  type AwsCommandResult,
} from "./deploy-target.ts";
import {
  DEV_STACK_REGION,
  assertDevReadTarget,
  devBuildEnvFromOutputs,
  devStackDescribeArgs,
  devStackReadError,
  materializeDevBuildEnv,
  type AwsCliResult,
} from "./dev-stack-outputs.ts";

const root = resolve(import.meta.dirname, "../..");

test("samconfig dev and prod targets stay on their own stacks", () => {
  const text = readFileSync(resolve(root, "infrastructure/samconfig.toml"), "utf8");
  assertSamTarget(text, "default", DEV_STACK, "dev");
  assertSamTarget(text, "prod", PROD_STACK, "prod");
  assert.throws(() => assertSamTarget(text, "prod", DEV_STACK, "prod"));
  assert.throws(() => assertSamTarget(text, "default", PROD_STACK, "dev"));
});

test("API URL and products table checks reject a crossed environment", () => {
  assertApiUrl("dev", "https://abc123.execute-api.us-east-1.amazonaws.com/dev");
  assert.throws(() =>
    assertApiUrl("dev", "https://6y37e2a4j1.execute-api.us-east-1.amazonaws.com/prod")
  );
  assert.throws(() =>
    assertApiUrl("dev", "https://6y37e2a4j1.execute-api.us-east-1.amazonaws.com/dev")
  );
  assert.throws(() => assertApiUrl("prod", "https://abc123.execute-api.us-east-1.amazonaws.com/dev"));
  assertProductsTable("dev", DEV_PRODUCTS_TABLE);
  assertProductsTable("prod", PROD_PRODUCTS_TABLE);
  assert.throws(() => assertProductsTable("dev", PROD_PRODUCTS_TABLE));
});

test("dev overrides clear live payment, email, and partner credentials", () => {
  const overrides = devParameterOverrides({
    STRIPE_SECRET_KEY: "sk_live_should_not_be_copied",
    SMTP_PASSWORD: "prod-smtp-secret",
    GBO_API_TOKEN: "prod-gbo-token",
  });
  assert.match(overrides, /(^|\s)Environment=dev(\s|$)/);
  assert.doesNotMatch(overrides, /Environment=prod/);
  assert.doesNotMatch(overrides, /sk_live_|prod-smtp-secret|prod-gbo-token/);
  assert.match(overrides, /GboStorefrontEnabled=false/);
  assert.match(overrides, /GboSandbox=true/);
  for (const key of DEV_CLEARED_PARAMETERS) {
    assert.match(overrides, new RegExp(`(^|\\s)${key}=(\\s|$)`));
  }
});

test("dev overrides accept Stripe and Razorpay test keys only", () => {
  const overrides = devParameterOverrides({
    STRIPE_SECRET_KEY_TEST: "sk_test_abc123",
    STRIPE_WEBHOOK_SECRET_TEST: "whsec_test",
    RAZORPAY_KEY_ID_TEST: "rzp_test_key",
    RAZORPAY_KEY_SECRET_TEST: "testsecret",
  });
  assert.match(overrides, /StripeSecretKey=sk_test_abc123/);
  assert.match(overrides, /RazorpayKeyId=rzp_test_key/);
  assert.doesNotMatch(overrides, /StripeSecretKey=(\s|$)/);
  assert.throws(() => devParameterOverrides({ STRIPE_SECRET_KEY_TEST: "sk_live_nope" }));
  assert.throws(() => devParameterOverrides({ RAZORPAY_KEY_ID_TEST: "rzp_live_nope" }));
  assert.throws(() =>
    devParameterOverrides({ STRIPE_WEBHOOK_SECRET_TEST: "whsec_only" })
  );
});

test("dev Amplify env drops live payment keys and keeps the dev API", () => {
  const env = devAmplifyEnvironment(
    {
      NEXT_PUBLIC_API_URL: "https://6y37e2a4j1.execute-api.us-east-1.amazonaws.com/prod",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_should_not_remain",
      RAZOR_KEY_ID: "rzp_live_should_not_remain",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_should_not_remain",
      NEXT_PUBLIC_SITE_URL: "https://www.blossompot.com",
      NEXT_PUBLIC_GTM_ID: "GTM-KEEP",
    },
    {
      apiUrl: "https://abc123.execute-api.us-east-1.amazonaws.com/dev",
      productsTable: DEV_PRODUCTS_TABLE,
      userPoolId: "us-east-1_devpool",
      userPoolClientId: "devclient",
      cdnDomain: "d111111abcdef.cloudfront.net",
      appId: BLOSSOMPOT_AMPLIFY_APP_ID,
      stripePublishableKeyTest: "pk_test_only",
    }
  );
  assert.equal(env.NEXT_PUBLIC_API_URL, "https://abc123.execute-api.us-east-1.amazonaws.com/dev");
  assert.equal(env.NEXT_PUBLIC_APP_ENV, "dev");
  assert.equal(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, "pk_test_only");
  assert.equal(env.RAZOR_KEY_ID, undefined);
  assert.equal(env.GBO_STOREFRONT_ENABLED, "false");
  assert.equal(env.NEXT_PUBLIC_SITE_URL, `https://dev.${BLOSSOMPOT_AMPLIFY_APP_ID}.amplifyapp.com`);
  assert.equal(env.NEXT_PUBLIC_GTM_ID, "GTM-KEEP");
  assert.throws(() =>
    devAmplifyEnvironment(
      { NEXT_PUBLIC_CLARITY_ID: "clarity-keep" },
      {
        apiUrl: "https://abc123.execute-api.us-east-1.amazonaws.com/dev",
        productsTable: DEV_PRODUCTS_TABLE,
        userPoolId: "us-east-1_devpool",
        userPoolClientId: "devclient",
        cdnDomain: "d111111abcdef.cloudfront.net",
        appId: USARAKHI_AMPLIFY_APP_ID,
      }
    )
  );
  assert.equal(env.NEXT_PUBLIC_GTM_ID, "GTM-KEEP");
  assert.throws(() =>
    devAmplifyEnvironment(
      {},
      {
        apiUrl: "https://6y37e2a4j1.execute-api.us-east-1.amazonaws.com/prod",
        productsTable: DEV_PRODUCTS_TABLE,
        userPoolId: "pool",
        userPoolClientId: "client",
        cdnDomain: "d111111abcdef.cloudfront.net",
        appId: BLOSSOMPOT_AMPLIFY_APP_ID,
      }
    )
  );
});

test("Amplify app selection rejects a missing id, UsaRakhi, and the wrong repository", () => {
  assert.throws(() => resolveBlossomPotAmplifyAppId(undefined), /missing/);
  assert.throws(() => resolveBlossomPotAmplifyAppId(""), /missing/);
  assert.throws(() => resolveBlossomPotAmplifyAppId(USARAKHI_AMPLIFY_APP_ID), /not BlossomPot/);
  assert.equal(resolveBlossomPotAmplifyAppId(BLOSSOMPOT_AMPLIFY_APP_ID), BLOSSOMPOT_AMPLIFY_APP_ID);
  assert.equal(resolveDevAmplifyAppId(""), BLOSSOMPOT_AMPLIFY_APP_ID);
  assert.equal(resolveDevAmplifyAppId(undefined), BLOSSOMPOT_AMPLIFY_APP_ID);
  assert.throws(() => resolveDevAmplifyAppId(USARAKHI_AMPLIFY_APP_ID), /not BlossomPot/);
  assertBlossomPotAmplifyApp({
    appId: BLOSSOMPOT_AMPLIFY_APP_ID,
    repository: BLOSSOMPOT_REPOSITORY,
  });
  assert.throws(
    () => assertBlossomPotAmplifyApp({ appId: BLOSSOMPOT_AMPLIFY_APP_ID, repository: "https://github.com/example/other" }),
    /not connected/
  );
  assertDevAmplifyBranch("dev");
  assert.throws(() => assertDevAmplifyBranch("main"), /only updates the Amplify dev branch/);
});

const devPublishInput = {
  AMPLIFY_APP_ID: BLOSSOMPOT_AMPLIFY_APP_ID,
  AWS_REGION: "us-east-1",
  GITHUB_SHA: "a".repeat(40),
  NEXT_PUBLIC_API_URL: "https://abc123.execute-api.us-east-1.amazonaws.com/dev",
  DEV_PRODUCTS_TABLE: DEV_PRODUCTS_TABLE,
  DEV_USER_POOL_ID: "us-east-1_DevPool",
  DEV_USER_POOL_CLIENT_ID: "devclient123",
  DEV_CDN: "d111111abcdef.cloudfront.net",
  STRIPE_PK_TEST: "pk_test_only",
};

function amplifyResponses(branchName: string, repository = BLOSSOMPOT_REPOSITORY): (args: string[]) => AwsCommandResult {
  return (args) => {
    const command = args[1];
    if (command === "get-app") {
      return {
        status: 0,
        stdout: JSON.stringify({ app: { appId: BLOSSOMPOT_AMPLIFY_APP_ID, repository } }),
        stderr: "",
      };
    }
    if (command === "get-branch") {
      return {
        status: 0,
        stdout: JSON.stringify({
          branch: {
            branchName,
            environmentVariables: {
              NEXT_PUBLIC_GTM_ID: "GTM-KEEP",
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_should_not_remain",
            },
          },
        }),
        stderr: "",
      };
    }
    if (command === "update-branch" || command === "start-job") {
      return { status: 0, stdout: JSON.stringify({ jobSummary: { jobId: "42" } }), stderr: "" };
    }
    return { status: 1, stdout: "", stderr: "unexpected command" };
  };
}

test("dev Amplify publish uses the BlossomPot app when the secret is unset", () => {
  const calls: string[][] = [];
  publishDevAmplifyConfig({ ...devPublishInput, AMPLIFY_APP_ID: "" }, (args) => {
    calls.push(args);
    return amplifyResponses("dev")(args);
  });
  const getApp = calls.find((args) => args[1] === "get-app");
  assert.ok(getApp);
  assert.equal(getApp[getApp.indexOf("--app-id") + 1], BLOSSOMPOT_AMPLIFY_APP_ID);
  assert.equal(calls.some((args) => args.includes(USARAKHI_AMPLIFY_APP_ID)), false);
});

test("dev Amplify publish keeps unrelated settings and does not update main", () => {
  const calls: string[][] = [];
  const result = publishDevAmplifyConfig(devPublishInput, (args) => {
    calls.push(args);
    return amplifyResponses("dev")(args);
  });
  assert.equal(result.jobId, "42");
  assert.equal(result.environment.NEXT_PUBLIC_GTM_ID, "GTM-KEEP");
  assert.equal(result.environment.GBO_STOREFRONT_ENABLED, "false");
  assert.equal(result.environment.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, "pk_test_only");
  const update = calls.find((args) => args[1] === "update-branch");
  const start = calls.find((args) => args[1] === "start-job");
  assert.ok(update);
  assert.ok(start);
  const updateBody = JSON.parse(update.at(-1) ?? "{}") as {
    branchName?: string;
    enableAutoBuild?: boolean;
    environmentVariables?: Record<string, string>;
  };
  const startBody = JSON.parse(start.at(-1) ?? "{}") as { branchName?: string; jobType?: string };
  assert.equal(updateBody.branchName, "dev");
  assert.equal(updateBody.enableAutoBuild, false);
  assert.equal(updateBody.environmentVariables?.NEXT_PUBLIC_GTM_ID, "GTM-KEEP");
  assert.equal(startBody.branchName, "dev");
  assert.equal(startBody.jobType, "RELEASE");
  assert.equal(calls.some((args) => args.includes("main") || args.includes("blossompot-prod")), false);
  assert.doesNotMatch(JSON.stringify(calls), /pk_live_should_not_remain|ASIA|secret_access|sk_live/i);
});

test("dev Amplify publish stops before an update when the app or branch is wrong", () => {
  const wrongRepo: string[][] = [];
  assert.throws(() =>
    publishDevAmplifyConfig(devPublishInput, (args) => {
      wrongRepo.push(args);
      return amplifyResponses("dev", "https://github.com/example/other")(args);
    })
  );
  assert.equal(wrongRepo.some((args) => args[1] === "update-branch"), false);

  const wrongBranch: string[][] = [];
  assert.throws(() =>
    publishDevAmplifyConfig(devPublishInput, (args) => {
      wrongBranch.push(args);
      return amplifyResponses("main")(args);
    })
  );
  assert.equal(wrongBranch.some((args) => args[1] === "update-branch"), false);

  const denied: string[][] = [];
  assert.throws(
    () =>
      publishDevAmplifyConfig(devPublishInput, (args) => {
        denied.push(args);
        return { status: 254, stdout: "", stderr: "An error occurred (AccessDenied) when calling the GetApp operation" };
      }),
    /AccessDenied/
  );
  assert.equal(denied.length, 1);
  assert.throws(() => publishDevAmplifyConfig({ ...devPublishInput, GITHUB_REF: "refs/heads/main" }, () => {
    throw new Error("AWS must not be called from main");
  }));
});

test("the dev frontend build rejects missing and production configuration without writing a file", () => {
  const dir = mkdtempSync(join(tmpdir(), "bp-frontend-env-"));
  const envFile = join(dir, ".env.production");
  const valid = {
    NEXT_PUBLIC_APP_ENV: "dev",
    NEXT_PUBLIC_API_URL: "https://abc123.execute-api.us-east-1.amazonaws.com/dev",
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: "us-east-1_DevPool",
    NEXT_PUBLIC_COGNITO_CLIENT_ID: "devclient123",
    NEXT_PUBLIC_COGNITO_REGION: "us-east-1",
    NEXT_PUBLIC_CDN_URL: "https://d111111abcdef.cloudfront.net",
    NEXT_PUBLIC_SITE_URL: "https://www.blossompot.com",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_should_not_remain",
  };
  try {
    assert.throws(() => devFrontendBuildEnv({}, BLOSSOMPOT_AMPLIFY_APP_ID), /missing NEXT_PUBLIC_API_URL/);
    assert.throws(
      () => devFrontendBuildEnv({ ...valid, NEXT_PUBLIC_API_URL: `https://${PROD_API_HOST}/dev` }, BLOSSOMPOT_AMPLIFY_APP_ID),
      /production API host/
    );
    assert.throws(
      () => devFrontendBuildEnv({ ...valid, NEXT_PUBLIC_CDN_URL: `https://${PROD_CDN_HOST}` }, BLOSSOMPOT_AMPLIFY_APP_ID),
      /production CloudFront/
    );
    assert.throws(() => devFrontendBuildEnv(valid, USARAKHI_AMPLIFY_APP_ID), /not BlossomPot/);
    assert.throws(() => writeDevFrontendEnvFile({}, BLOSSOMPOT_AMPLIFY_APP_ID, envFile));
    assert.equal(existsSync(envFile), false);
    const built = writeDevFrontendEnvFile(valid, BLOSSOMPOT_AMPLIFY_APP_ID, envFile);
    assert.equal(built.NEXT_PUBLIC_SITE_URL, `https://dev.${BLOSSOMPOT_AMPLIFY_APP_ID}.amplifyapp.com`);
    assert.equal(built.GBO_STOREFRONT_ENABLED, "false");
    assert.equal(built.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, undefined);
    assert.doesNotMatch(readFileSync(envFile, "utf8"), /pk_live|ASIA|secret/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const devOutputs = [
  { OutputKey: "UserPoolId", OutputValue: "us-east-1_DevPool" },
  { OutputKey: "UserPoolClientId", OutputValue: "devclient123" },
  { OutputKey: "ApiUrl", OutputValue: "https://abc123.execute-api.us-east-1.amazonaws.com/dev/" },
  { OutputKey: "CloudFrontDomain", OutputValue: "d111111abcdef.cloudfront.net" },
  { OutputKey: "ProductsTableName", OutputValue: DEV_PRODUCTS_TABLE },
  { OutputKey: "OrdersTableName", OutputValue: "blossompot-orders-dev" },
];

test("dev stack outputs become the dev build env and keep the production guards", () => {
  const env = devBuildEnvFromOutputs(devOutputs);
  assert.equal(env.NEXT_PUBLIC_APP_ENV, "dev");
  assert.equal(env.NEXT_PUBLIC_API_URL, "https://abc123.execute-api.us-east-1.amazonaws.com/dev");
  assert.equal(env.NEXT_PUBLIC_COGNITO_USER_POOL_ID, "us-east-1_DevPool");
  assert.equal(env.NEXT_PUBLIC_COGNITO_CLIENT_ID, "devclient123");
  assert.equal(env.NEXT_PUBLIC_COGNITO_REGION, "us-east-1");
  assert.equal(env.NEXT_PUBLIC_CDN_URL, "https://d111111abcdef.cloudfront.net");
  assert.deepEqual(devStackDescribeArgs(), [
    "cloudformation",
    "describe-stacks",
    "--region",
    "us-east-1",
    "--stack-name",
    "blossompot-dev",
    "--output",
    "json",
  ]);
  assert.equal(DEV_STACK_REGION, "us-east-1");
  assert.throws(() => assertDevReadTarget("blossompot-prod", "us-east-1"));
  assert.throws(() => assertDevReadTarget(DEV_STACK, "us-west-2"));
});

test("dev stack output checks reject a missing key and production endpoints", () => {
  assert.throws(() => devBuildEnvFromOutputs(devOutputs.filter((output) => output.OutputKey !== "ApiUrl")), /missing output key\(s\): ApiUrl/);
  assert.throws(
    () =>
      devBuildEnvFromOutputs(
        devOutputs.map((output) =>
          output.OutputKey === "ApiUrl" ? { ...output, OutputValue: `https://${PROD_API_HOST}/dev` } : output
        )
      ),
    /production API host/
  );
  assert.throws(
    () =>
      devBuildEnvFromOutputs(
        devOutputs.map((output) =>
          output.OutputKey === "ApiUrl"
            ? { ...output, OutputValue: "https://abc123.execute-api.us-east-1.amazonaws.com/prod" }
            : output
        )
      ),
    /ending in \/dev/
  );
  assert.throws(
    () =>
      devBuildEnvFromOutputs(
        devOutputs.map((output) =>
          output.OutputKey === "CloudFrontDomain" ? { ...output, OutputValue: PROD_CDN_HOST } : output
        )
      ),
    /production CloudFront/
  );
  assert.throws(
    () =>
      devBuildEnvFromOutputs(
        devOutputs.map((output) =>
          output.OutputKey === "ProductsTableName" ? { ...output, OutputValue: PROD_PRODUCTS_TABLE } : output
        )
      ),
    /blossompot-products-prod/
  );
});

test("dev stack read errors name credentials, access denial, and a missing stack", () => {
  assert.match(devStackReadError("", "Unable to locate credentials"), /no usable AWS credentials/);
  assert.match(devStackReadError("", "Unable to locate credentials"), /not a missing stack output/);
  assert.match(devStackReadError("An error occurred (AccessDenied) when calling the DescribeStacks operation"), /not allowed to describe/);
  assert.match(devStackReadError("Stack with id blossompot-dev does not exist"), /was not found/);
  assert.doesNotMatch(devStackReadError("An error occurred (AccessDenied)"), /ASIA|secret|token/i);
});

function cliJson(outputs: { OutputKey: string; OutputValue: string }[]): AwsCliResult {
  return { status: 0, stdout: JSON.stringify({ Stacks: [{ Outputs: outputs }] }) };
}

test("a failed dev stack lookup does not write an environment file", () => {
  const dir = mkdtempSync(join(tmpdir(), "bp-dev-env-"));
  const envFile = join(dir, ".env.production");
  writeFileSync(envFile, "NEXT_PUBLIC_API_URL=https://keep.example/dev\n", "utf8");
  const failures: AwsCliResult[] = [
    { status: 253, error: "Unable to locate credentials" },
    { status: 254, stderr: "An error occurred (AccessDenied) when calling the DescribeStacks operation: User is not authorized" },
    { status: 254, stderr: "Stack with id blossompot-dev does not exist" },
    cliJson(devOutputs.filter((output) => output.OutputKey !== "UserPoolId")),
    cliJson(devOutputs.map((output) => output.OutputKey === "ApiUrl" ? { ...output, OutputValue: `https://${PROD_API_HOST}/dev` } : output)),
    cliJson(devOutputs.map((output) => output.OutputKey === "CloudFrontDomain" ? { ...output, OutputValue: PROD_CDN_HOST } : output)),
    cliJson(devOutputs.map((output) => output.OutputKey === "ProductsTableName" ? { ...output, OutputValue: PROD_PRODUCTS_TABLE } : output)),
  ];
  try {
    for (const failure of failures) {
      assert.throws(() =>
        materializeDevBuildEnv({
          stack: DEV_STACK,
          region: DEV_STACK_REGION,
          envFile,
          run: () => failure,
        })
      );
      assert.equal(readFileSync(envFile, "utf8"), "NEXT_PUBLIC_API_URL=https://keep.example/dev\n");
    }
    const missing = join(dir, "missing.env");
    assert.throws(() =>
      materializeDevBuildEnv({
        stack: "blossompot-prod",
        region: DEV_STACK_REGION,
        envFile: missing,
        run: () => {
          throw new Error("AWS CLI must not be called for the production stack");
        },
      })
    );
    assert.throws(() =>
      materializeDevBuildEnv({
        stack: DEV_STACK,
        region: "us-west-2",
        envFile: missing,
        run: () => {
          throw new Error("AWS CLI must not be called for the wrong region");
        },
      })
    );
    assert.equal(existsSync(missing), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a successful mocked dev stack read writes only the five public build values", () => {
  const dir = mkdtempSync(join(tmpdir(), "bp-dev-env-"));
  const envFile = join(dir, ".env.production");
  try {
    const env = materializeDevBuildEnv({
      stack: DEV_STACK,
      region: DEV_STACK_REGION,
      envFile,
      run: () => cliJson(devOutputs),
    });
    const written = readFileSync(envFile, "utf8");
    assert.equal(env.NEXT_PUBLIC_API_URL, "https://abc123.execute-api.us-east-1.amazonaws.com/dev");
    assert.match(written, /^NEXT_PUBLIC_APP_ENV=dev$/m);
    assert.match(written, /^NEXT_PUBLIC_API_URL=https:\/\/abc123\.execute-api\.us-east-1\.amazonaws\.com\/dev$/m);
    assert.match(written, /^NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_DevPool$/m);
    assert.match(written, /^NEXT_PUBLIC_COGNITO_CLIENT_ID=devclient123$/m);
    assert.match(written, /^NEXT_PUBLIC_CDN_URL=https:\/\/d111111abcdef\.cloudfront\.net$/m);
    assert.doesNotMatch(written, new RegExp(PROD_API_HOST));
    assert.doesNotMatch(written, /ASIA|secret|token|sk_live|BEGIN/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("dev catalog verification workflow is manual and read-only", () => {
  const workflow = readFileSync(resolve(root, ".github/workflows/verify-dev-catalog.yml"), "utf8");
  const script = readFileSync(resolve(root, "scripts/persist-dev-bundled-catalogs.ts"), "utf8");
  const target = readFileSync(resolve(root, "scripts/ci/dev-catalog-persist.ts"), "utf8");
  assertReadOnlyDevCatalogWorkflow(workflow);
  assertCatalogVerificationIsReadOnly(script);
  assert.doesNotMatch(workflow, /echo\s+.*AWS_|console\.log\(/);
  assert.match(workflow, /secrets\.AWS_ACCESS_KEY_ID/);
  assert.match(workflow, /secrets\.AWS_SECRET_ACCESS_KEY/);
  assert.match(workflow, /secrets\.AWS_SESSION_TOKEN/);
  assert.match(target, /796174527529/);
  assert.match(target, /blossompot-products-dev/);
  assert.match(target, /blossompot-dev/);
  assert.match(target, /us-east-1/);
  assert.match(script, /arn:aws:dynamodb:\$\{DEV_CATALOG_REGION\}:\$\{DEV_CATALOG_ACCOUNT\}:table\/\$\{DEV_CATALOG_TABLE\}/);
});

test("workflow and Amplify config isolate dev from production", () => {
  assertWorkflowIsolation(readFileSync(resolve(root, ".github/workflows/deploy.yml"), "utf8"));
  assertAmplifyIsolation(readFileSync(resolve(root, "amplify.yml"), "utf8"));
  const template = readFileSync(resolve(root, "infrastructure/template.yaml"), "utf8");
  assert.match(template, /TableName: !Sub blossompot-products-\$\{Environment\}/);
  assert.match(template, /StageName: !Ref Environment/);
  assert.match(template, /IsProd: !Equals \[!Ref Environment, prod\]/);
  assert.match(template, /SesDomainIdentity:[\s\S]*Condition: IsProd[\s\S]*EmailIdentity: blossompot.com/);
});
