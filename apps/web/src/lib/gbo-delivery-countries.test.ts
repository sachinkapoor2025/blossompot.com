import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getApiUrl } from "./env";
import { loadStorefrontCatalogCountries } from "./gbo-delivery-countries";

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("storefront catalog countries request", () => {
  it("shares one in-flight GET /catalog-countries and does not keep the response", async () => {
    const body = {
      countries: [
        { countryCode: "US", enabled: true },
        { countryCode: "GB", enabled: false },
      ],
      defaultCountry: "US",
    };
    let calls = 0;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(String(input), `${getApiUrl()}/catalog-countries`);
      assert.equal(init?.cache, "no-store");
      assert.equal(init?.method, undefined);
      calls += 1;
      await gate;
      return jsonResponse(body);
    }) as typeof fetch;

    const pending = Promise.all([
      loadStorefrontCatalogCountries(),
      loadStorefrontCatalogCountries(),
      loadStorefrontCatalogCountries(),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(calls, 1);
    release();
    const [first, second, third] = await pending;
    assert.deepEqual(first, body);
    assert.deepEqual(second, body);
    assert.deepEqual(third, body);

    const again = await loadStorefrontCatalogCountries();
    assert.equal(calls, 2);
    assert.deepEqual(again, body);
  });

  it("shares one failed request, then fetches again on the next call", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonResponse({ error: "catalog countries unavailable" }, 400);
    }) as typeof fetch;

    const failed = await Promise.allSettled([
      loadStorefrontCatalogCountries(),
      loadStorefrontCatalogCountries(),
    ]);
    assert.equal(calls, 1);
    assert.equal(failed[0].status, "rejected");
    assert.equal(failed[1].status, "rejected");
    if (failed[0].status === "rejected") {
      assert.equal(failed[0].reason instanceof Error, true);
      assert.equal((failed[0].reason as Error).message, "catalog countries unavailable");
    }

    const retried = await Promise.allSettled([loadStorefrontCatalogCountries()]);
    assert.equal(calls, 2);
    assert.equal(retried[0].status, "rejected");
  });
});
