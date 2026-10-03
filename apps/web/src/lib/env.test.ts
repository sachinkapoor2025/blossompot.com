import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { getApiUrl, isDevDeployment, normalizeApiUrl, PROD_API_URL } from "./env.ts";

const KEYS = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_APP_ENV", "AWS_BRANCH", "NODE_ENV"] as const;
const snapshot = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of KEYS) {
    const value = snapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function setEnv(values: Partial<Record<(typeof KEYS)[number], string>>): void {
  for (const key of KEYS) delete process.env[key];
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) process.env[key] = value;
  }
}

test("local development stays on localhost", () => {
  setEnv({ NODE_ENV: "development" });
  assert.equal(isDevDeployment(), false);
  assert.equal(getApiUrl(), "http://localhost:3001");
});

test("production builds without an explicit URL keep the production API", () => {
  setEnv({ NODE_ENV: "production" });
  assert.equal(getApiUrl(), PROD_API_URL);
});

test("an explicit API URL is used for non-dev builds", () => {
  setEnv({
    NODE_ENV: "production",
    NEXT_PUBLIC_API_URL: "https://abc123.execute-api.us-east-1.amazonaws.com/prod",
  });
  assert.equal(getApiUrl(), "https://abc123.execute-api.us-east-1.amazonaws.com/prod");
});

test("normalizeApiUrl still appends /prod only outside the dev deployment check", () => {
  assert.equal(
    normalizeApiUrl("https://abc123.execute-api.us-east-1.amazonaws.com"),
    "https://abc123.execute-api.us-east-1.amazonaws.com/prod"
  );
  assert.equal(
    normalizeApiUrl("https://abc123.execute-api.us-east-1.amazonaws.com/dev"),
    "https://abc123.execute-api.us-east-1.amazonaws.com/dev"
  );
});

test("dev builds use the dev API and refuse the production fallback", () => {
  const devUrl = "https://abc123.execute-api.us-east-1.amazonaws.com/dev";
  setEnv({ NODE_ENV: "production", NEXT_PUBLIC_APP_ENV: "dev", NEXT_PUBLIC_API_URL: devUrl });
  assert.equal(getApiUrl(), devUrl);

  setEnv({ NODE_ENV: "production", AWS_BRANCH: "dev", NEXT_PUBLIC_API_URL: `${devUrl}/` });
  assert.equal(getApiUrl(), devUrl);

  setEnv({ NODE_ENV: "production", NEXT_PUBLIC_APP_ENV: "dev" });
  assert.throws(() => getApiUrl(), /Refusing to use the production API/);

  setEnv({ NODE_ENV: "production", AWS_BRANCH: "dev", NEXT_PUBLIC_API_URL: PROD_API_URL });
  assert.throws(() => getApiUrl(), /Refusing to use the production API/);

  setEnv({
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_ENV: "dev",
    NEXT_PUBLIC_API_URL: "https://abc123.execute-api.us-east-1.amazonaws.com",
  });
  assert.throws(() => getApiUrl(), /Refusing to use the production API/);
});
