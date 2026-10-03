import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { resolve } from "path";
import { test } from "node:test";
import {
  DEV_CLEARED_PARAMETERS,
  DEV_PRODUCTS_TABLE,
  DEV_STACK,
  PROD_PRODUCTS_TABLE,
  PROD_STACK,
  assertAmplifyIsolation,
  assertApiUrl,
  assertProductsTable,
  assertSamTarget,
  assertWorkflowIsolation,
  devAmplifyEnvironment,
  devParameterOverrides,
} from "./deploy-target.ts";

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
      appId: "d1vlvm5li37k6g",
      stripePublishableKeyTest: "pk_test_only",
    }
  );
  assert.equal(env.NEXT_PUBLIC_API_URL, "https://abc123.execute-api.us-east-1.amazonaws.com/dev");
  assert.equal(env.NEXT_PUBLIC_APP_ENV, "dev");
  assert.equal(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, "pk_test_only");
  assert.equal(env.RAZOR_KEY_ID, undefined);
  assert.equal(env.GBO_STOREFRONT_ENABLED, "false");
  assert.equal(env.NEXT_PUBLIC_SITE_URL, "https://dev.d1vlvm5li37k6g.amplifyapp.com");
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
        appId: "app",
      }
    )
  );
});

test("workflow and Amplify config isolate dev from production", () => {
  assertWorkflowIsolation(readFileSync(resolve(root, ".github/workflows/deploy.yml"), "utf8"));
  assertAmplifyIsolation(readFileSync(resolve(root, "amplify.yml"), "utf8"));
  const template = readFileSync(resolve(root, "infrastructure/template.yaml"), "utf8");
  assert.match(template, /TableName: !Sub blossompot-products-\$\{Environment\}/);
  assert.match(template, /StageName: !Ref Environment/);
});
