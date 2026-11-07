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
    const seen: Array<{ url: string; cache?: RequestCache; method?: string }> = [];
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1;
      seen.push({ url: String(input), cache: init?.cache, method: init?.method });
      await gate;
      return jsonResponse(body);
    }) as typeof fetch;

    const pending = Promise.all([
      loadStorefrontCatalogCountries(),
      loadStorefrontCatalogCountries(),
      loadStorefrontCatalogCountries(),
    ]);
    let settled:
      | { ok: true; rows: Awaited<typeof pending> }
      | { ok: false; error: unknown }
      | undefined;
    // Handle the shared promise immediately so a slow import cannot reject after the test ends.
    const captured = pending.then(
      (rows) => {
        settled = { ok: true, rows };
      },
      (error: unknown) => {
        settled = { ok: false, error };
      }
    );
    try {
      // The shared request starts after a dynamic import. CI can take longer than a fixed delay.
      const started = Date.now();
      while (calls < 1 && !settled && Date.now() - started < 5000) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      if (calls < 1 && settled?.ok === false) throw settled.error;
      assert.equal(calls, 1);
      assert.equal(seen[0]?.url, `${getApiUrl()}/catalog-countries`);
      assert.equal(seen[0]?.cache, "no-store");
      assert.equal(seen[0]?.method, undefined);
      release();
      const [first, second, third] = await pending;
      assert.deepEqual(first, body);
      assert.deepEqual(second, body);
      assert.deepEqual(third, body);

      const again = await loadStorefrontCatalogCountries();
      assert.equal(calls, 2);
      assert.equal(seen[1]?.url, `${getApiUrl()}/catalog-countries`);
      assert.deepEqual(again, body);
    } finally {
      release();
      await captured;
    }
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
