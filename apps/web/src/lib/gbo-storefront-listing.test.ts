import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { loadGboStorefrontProducts } from "./product-loader.ts";

const previousFlag = process.env.GBO_STOREFRONT_ENABLED;
const previousApi = process.env.NEXT_PUBLIC_API_URL;
const previousApp = process.env.NEXT_PUBLIC_APP_ENV;
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (previousFlag === undefined) delete process.env.GBO_STOREFRONT_ENABLED;
  else process.env.GBO_STOREFRONT_ENABLED = previousFlag;
  if (previousApi === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = previousApi;
  if (previousApp === undefined) delete process.env.NEXT_PUBLIC_APP_ENV;
  else process.env.NEXT_PUBLIC_APP_ENV = previousApp;
});

test("the storefront flag gates the live GBO gifts request", async () => {
  process.env.NEXT_PUBLIC_APP_ENV = "dev";
  process.env.NEXT_PUBLIC_API_URL = "https://abc123.execute-api.us-east-1.amazonaws.com/dev";
  const urls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    urls.push(String(input));
    return new Response(
      JSON.stringify({
        gifts: [{ id: 9, name: "Live hamper", price: 40 }],
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }) as typeof fetch;

  process.env.GBO_STOREFRONT_ENABLED = "false";
  const hidden = await loadGboStorefrontProducts("US");
  assert.deepEqual(hidden, []);
  assert.equal(urls.length, 0);

  process.env.GBO_STOREFRONT_ENABLED = "true";
  const listed = await loadGboStorefrontProducts("US");
  assert.equal(listed.length, 1);
  assert.equal(listed[0]?.sku, "gbo:US:9");
  assert.equal(urls.length, 1);
  assert.match(urls[0] ?? "", /\/gbo\/gifts\?country=US$/);
  assert.doesNotMatch(urls[0] ?? "", /\/sandbox/);
});
