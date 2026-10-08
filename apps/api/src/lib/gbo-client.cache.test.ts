import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  clearGboGiftsCache,
  gboGiftsCacheKey,
  gboListGifts,
  gboSandboxEnabled,
} from "./gbo-client.ts";

const previousSandbox = process.env.GBO_SANDBOX;
const previousToken = process.env.GBO_API_TOKEN;
const previousBase = process.env.GBO_BASE_URL;
const originalFetch = globalThis.fetch;

afterEach(() => {
  clearGboGiftsCache();
  globalThis.fetch = originalFetch;
  if (previousSandbox === undefined) delete process.env.GBO_SANDBOX;
  else process.env.GBO_SANDBOX = previousSandbox;
  if (previousToken === undefined) delete process.env.GBO_API_TOKEN;
  else process.env.GBO_API_TOKEN = previousToken;
  if (previousBase === undefined) delete process.env.GBO_BASE_URL;
  else process.env.GBO_BASE_URL = previousBase;
});

test("sandbox and live gift cache keys stay distinct", async () => {
  delete process.env.GBO_API_TOKEN;
  delete process.env.GBO_BASE_URL;
  clearGboGiftsCache();

  assert.notEqual(gboGiftsCacheKey("US|country_iso_alpha2=US", true), gboGiftsCacheKey("US|country_iso_alpha2=US", false));
  assert.match(gboGiftsCacheKey("US", true), /sandbox$/);
  assert.match(gboGiftsCacheKey("US", false), /live$/);

  const urls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    const sandbox = url.includes("/sandbox/");
    return new Response(
      JSON.stringify({
        data: [
          {
            id: sandbox ? 1 : 2,
            name: sandbox ? "Sandbox basket" : "Live basket",
            price: 10,
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }) as typeof fetch;

  process.env.GBO_SANDBOX = "true";
  assert.equal(gboSandboxEnabled({ token: "test-token" }), true);
  const sandboxGifts = await gboListGifts({ country: "US" }, { token: "test-token" });
  process.env.GBO_SANDBOX = "false";
  assert.equal(gboSandboxEnabled({ token: "test-token" }), false);
  const liveGifts = await gboListGifts({ country: "US" }, { token: "test-token" });

  assert.equal(sandboxGifts[0]?.name, "Sandbox basket");
  assert.equal(liveGifts[0]?.name, "Live basket");
  assert.equal(urls.length, 2);
  assert.match(urls[0] ?? "", /https:\/\/www\.giftbasketsoverseas\.com\/api\/v1\/sandbox\/gifts\/get/);
  assert.match(urls[1] ?? "", /https:\/\/www\.giftbasketsoverseas\.com\/api\/v1\/gifts\/get\?/);
  assert.doesNotMatch(urls[1] ?? "", /\/sandbox\//);

  const cachedLive = await gboListGifts({ country: "US" }, { token: "test-token" });
  assert.equal(cachedLive[0]?.name, "Live basket");
  assert.equal(urls.length, 2);

  clearGboGiftsCache();
  process.env.GBO_SANDBOX = "true";
  const forcedLive = await gboListGifts({ country: "US" }, { token: "test-token", sandbox: false });
  assert.equal(forcedLive[0]?.name, "Live basket");
  assert.match(urls.at(-1) ?? "", /\/api\/v1\/gifts\/get\?/);
  assert.doesNotMatch(urls.at(-1) ?? "", /\/sandbox\//);
});
