import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { loadStorefrontFxQuote } from "./currency-context";

const originalFetch = globalThis.fetch;
const RATE_KEYS = ["hr_ecom_usd_inr_rate", "hr_ecom_usd_inr_rate_at", "hr_ecom_usd_fx_rates"];

class MemoryStorage {
  private readonly map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

if (typeof globalThis.sessionStorage === "undefined") {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function clearFxSession() {
  for (const key of RATE_KEYS) sessionStorage.removeItem(key);
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  clearFxSession();
});

describe("storefront FX quote", () => {
  it("shares one in-flight /api/fx-rates request and keeps the rounded rate", async () => {
    clearFxSession();
    let fxCalls = 0;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      assert.match(url, /\/api\/fx-rates$/);
      fxCalls += 1;
      await gate;
      return jsonResponse({
        rate: 96.123456,
        source: "frankfurter",
        rates: { INR: 96.123456, GBP: 0.78 },
      });
    }) as typeof fetch;

    const pending = Promise.all([loadStorefrontFxQuote(), loadStorefrontFxQuote()]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(fxCalls, 1);
    release();
    const [first, second] = await pending;
    assert.equal(first.rate, 96.1235);
    assert.equal(first.source, "frankfurter");
    assert.equal(first.rates.GBP, 0.78);
    assert.equal(first.rates.INR, 96.1235);
    assert.equal(first.rates.USD, 1);
    assert.deepEqual(second, first);

    const cached = await loadStorefrontFxQuote();
    assert.equal(fxCalls, 1);
    assert.equal(cached.source, "session-cache");
    assert.equal(cached.rate, 96.1235);
    assert.equal(cached.rates.GBP, 0.78);
  });

  it("falls back to the config rate once when the proxy fails", async () => {
    clearFxSession();
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes("/api/fx-rates")) return jsonResponse({ error: "Exchange rates unavailable" }, 502);
      if (url.includes("/config/usd-inr-rate")) {
        return jsonResponse({ rate: 91.5, source: "config" });
      }
      throw new Error(url);
    }) as typeof fetch;

    const [first, second] = await Promise.all([loadStorefrontFxQuote(), loadStorefrontFxQuote()]);
    assert.equal(first.rate, 91.5);
    assert.equal(first.source, "config");
    assert.equal(first.rates.INR, 91.5);
    assert.deepEqual(second, first);
    assert.equal(urls.filter((url) => url.includes("/api/fx-rates")).length, 1);
    assert.equal(urls.filter((url) => url.includes("/config/usd-inr-rate")).length, 1);

    urls.length = 0;
    const cached = await loadStorefrontFxQuote();
    assert.equal(cached.source, "session-cache");
    assert.equal(cached.rate, 91.5);
    assert.equal(urls.length, 0);
  });

  it("uses the env fallback without caching it, then retries", async () => {
    clearFxSession();
    let fxCalls = 0;
    globalThis.fetch = (async () => {
      fxCalls += 1;
      throw new Error("offline");
    }) as typeof fetch;

    const failed = await loadStorefrontFxQuote();
    assert.equal(failed.source, "fallback");
    assert.equal(failed.rate > 0, true);
    assert.equal(fxCalls, 2);

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      fxCalls += 1;
      assert.match(String(input), /\/api\/fx-rates$/);
      return jsonResponse({ rate: 88, source: "frankfurter", rates: { INR: 88 } });
    }) as typeof fetch;
    const recovered = await loadStorefrontFxQuote();
    assert.equal(recovered.source, "frankfurter");
    assert.equal(recovered.rate, 88);
    assert.equal(fxCalls, 3);
  });

  it("refreshes an expired session quote", async () => {
    sessionStorage.setItem("hr_ecom_usd_inr_rate", "80");
    sessionStorage.setItem("hr_ecom_usd_inr_rate_at", String(Date.now() - 2 * 60 * 60 * 1000));
    sessionStorage.setItem("hr_ecom_usd_fx_rates", JSON.stringify({ INR: 80, USD: 1, GBP: 0.7 }));
    let fxCalls = 0;
    globalThis.fetch = (async () => {
      fxCalls += 1;
      return jsonResponse({ rate: 97.25, source: "frankfurter", rates: { INR: 97.25, EUR: 0.9 } });
    }) as typeof fetch;

    const quote = await loadStorefrontFxQuote();
    assert.equal(fxCalls, 1);
    assert.equal(quote.rate, 97.25);
    assert.equal(quote.rates.EUR, 0.9);
  });
});
