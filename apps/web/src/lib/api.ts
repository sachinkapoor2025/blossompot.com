import { getApiUrl } from "@/lib/env";

type ApiOptions = RequestInit & {
  sessionId?: string;
  token?: string;
  /** Server ISR seconds. Use `false` for no-store. Default: no-store when authed, else 300s. */
  revalidate?: number | false;
};

function isIdempotentMethod(method?: string): boolean {
  const m = (method ?? "GET").toUpperCase();
  return m === "GET" || m === "HEAD" || m === "OPTIONS";
}

/**
 * Retry only network failures (and transient 5xx on idempotent GETs).
 * Always return the final Response — including 5xx — so callers can parse `{ error }` bodies.
 * Never retry POST/PUT/PATCH/DELETE on 5xx (avoids duplicate sends like Test Email).
 */
async function fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  const retryServerErrors = isIdempotentMethod(init.method);
  const maxAttempts = retryServerErrors ? attempts : 1;
  let lastNetworkError: unknown;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || res.status < 500 || !retryServerErrors || i === maxAttempts - 1) {
        return res;
      }
    } catch (err) {
      lastNetworkError = err;
      if (i === maxAttempts - 1) {
        throw lastNetworkError instanceof Error ? lastNetworkError : new Error("Fetch failed");
      }
    }
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }

  throw lastNetworkError instanceof Error ? lastNetworkError : new Error("Fetch failed");
}

function errorMessageFromBody(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
    if (typeof record.message === "string" && record.message.trim()) return record.message;
  }
  return `API error (${status})`;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { sessionId, token, revalidate, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (sessionId) headers["X-Session-Id"] = sessionId;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${getApiUrl()}${path}`;

  const isServer = typeof window === "undefined";
  const needsFresh = Boolean(sessionId || token || revalidate === false);
  const cacheOptions: Pick<RequestInit, "cache" | "next"> = needsFresh
    ? { cache: "no-store" }
    : isServer
      ? { next: { revalidate: typeof revalidate === "number" ? revalidate : 300 } }
      : { cache: "default" };

  const res = await fetchWithRetry(url, {
    ...fetchOptions,
    headers,
    ...cacheOptions,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errorMessageFromBody(errBody, res.status));
  }

  return res.json();
}

export { getApiUrl as API_URL };
